const flow = require('./flow');
const opt = require('./options');
const { getQR } = require('./attach');
const { sendMain } = require('./mainMenu');
const { getRecipientPrep } = require('./prep_api');
const { linkIntegrationTokenLabel } = require('./labels');
const { getPhoneValid } = require('./helper');
const { loadCalendar } = require('./consulta');
const { checkAppointment } = require('./consulta');

async function handleToken(context, answer) {
	if (answer === true) {
		await context.sendText(flow.joinToken.success);
		await context.setState({ user: await getRecipientPrep(context.session.user.id) }); // integration_token is added to user
		await linkIntegrationTokenLabel(context);
		await context.setState({ dialog: 'mainMenu' });
	} else { // error or invalid number
		await context.sendText(flow.joinToken.fail);
		await context.sendText(flow.joinToken.fail2, opt.joinToken);
		await context.setState({ dialog: 'joinTokenErro' });
	}
}

async function checkPhone(context) {
	const phone = await getPhoneValid(context.state.whatWasTyped);
	if (phone) {
		await context.setState({ dialog: 'phoneValid', phone });
	} else {
		await context.setState({ dialog: 'phoneInvalid', phone: '' });
	}
}

async function ofertaPesquisaStart(context) {
	await context.sendText(flow.ofertaPesquisaStart.text1, await getQR(flow.ofertaPesquisaStart));
}

async function ofertaPesquisaSim(context) {
	await context.setState({ nextDialog: 'ofertaPesquisaEnd' });
	await context.sendText(flow.ofertaPesquisaSim.text1);
	await context.sendText(flow.ofertaPesquisaSim.text2, await getQR(flow.ofertaPesquisaSim));
}

async function TCLE(context) {
	if (context.state.meContaDepois) {
		await context.sendText('.... (introdução)');
		await context.sendText(flow.ofertaPesquisaSim.text1);
	} else {
		await context.sendText(flow.ofertaPesquisaSim.text2);
	}
	await context.sendText(flow.ofertaPesquisaSim.text3);

	await context.sendButtonTemplate(flow.ofertaPesquisaSim.text3, opt.TCLE);
	await context.sendText(flow.onTheResearch.saidYes, opt.termos2);

	return false;
}

async function preTCLE(context) {
	if (context.state.user.is_eligible_for_research) { // é elegível pra pesquisa
		await context.sendText(flow.preTCLE.eligible);
	} else { // não é elegivel pra pesquisa
		await context.sendText(flow.preTCLE.not_eligible);
	}

	if (!context.state.user.is_target_audience) { // não é público de interesse
		await TCLE();
	} else if (context.state.leftContact || await checkAppointment(context) === true) { // é público de interesse, já fez agendamento ou deixou contato
		await TCLE();
	} else { // é público de interesse, não fez agendamento nem deixou contato
		await context.setState({ nextDialog: 'TCLE', dialog: '' });
		await loadCalendar(context);
	}
}


async function ofertaPesquisaEnd(context) {
	await context.setState({ nextDialog: '', dialog: '' });
	if (!context.state.user.is_target_audience) { // não é público de interesse
		await sendMain(context);
	} else if (context.state.user.risk_group) { // é público de interesse com risco
		await context.setState({ nextDialog: 'preTCLE' });
		await context.sendText('Manda pro recrutamento e dps pro pre-tcle');
	} else { // é público de interesse sem risco
		await preTCLE(context);
	}
}


module.exports = {
	handleToken, checkPhone, ofertaPesquisaStart, ofertaPesquisaSim, ofertaPesquisaEnd,
};
