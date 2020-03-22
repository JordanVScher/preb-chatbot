const flow = require('./flow');
const opt = require('./options');
const { getQR } = require('./attach');
const { sendMain } = require('./mainMenu');
const { falarComHumano } = require('./mainMenu');
const { getPhoneValid } = require('./helper');
const { formatPhone } = require('./helper');
// const { startConsulta } = require('./consulta');
// const { checkAppointment } = require('./consulta-aux');
const { addNewUser } = require('./labels');

async function checkPhone(context) {
	const phone = await getPhoneValid(context.state.whatWasTyped);
	if (phone) {
		await context.setState({ dialog: 'phoneValid', phone: await formatPhone(phone, context.state.user.city) });
	} else {
		await context.setState({ dialog: 'phoneInvalid', phone: '' });
	}
}

async function ofertaPesquisaStart(context, text) {
	await context.setState({ nextDialog: 'ofertaPesquisaEnd' });
	await context.sendText(text || flow.ofertaPesquisaStart.text1, await getQR(flow.ofertaPesquisaStart));
}

async function ofertaPesquisaSim(context) {
	await context.setState({ nextDialog: 'ofertaPesquisaEnd' });
	if (context.state.meContaDepois !== true) await context.sendText(flow.ofertaPesquisaSim.text1);
	await falarComHumano(context);
}

async function recrutamento(context) {
	if (context.state.user.is_target_audience && context.state.user.risk_group && !context.state.recrutamentoEnd) {
		await context.sendText(flow.recrutamento.text1, await getQR(flow.recrutamento));
	} else {
		await sendMain(context);
	}
}
async function TCLE(context) {
	if (!context.state.preCadastroSignature) {
		await context.setState({ dialog: '' });
		if (context.state.meContaDepois) { // se usuário escolheu "me conta depois"
			await context.sendText(flow.ofertaPesquisaSim.text0);
			await context.sendText(flow.ofertaPesquisaSim.text1);
			await context.typing(1000 * 20);
			await context.setState({ meContaDepois: false });
		} else {
			await context.sendText(flow.TCLE.text1);
		}
		await context.sendButtonTemplate(flow.TCLE.text2, opt.Research_TCLE); // send info button
		await context.sendText(flow.TCLE.text3, opt.Research_Termos); // ask for termos acceptance
	} else {
		await sendMain(context);
	}
}

// temConsulta = await checkAppointment(context.session.user.id)
async function preTCLE(context, temConsulta) { // eslint-disable-line no-unused-vars
	await addNewUser(context);
	if (context.state.user.is_eligible_for_research) { // é elegível pra pesquisa
		await context.sendText(flow.preTCLE.eligible);
	} else if (!context.state.user.is_eligible_for_research) { // não é elegivel pra pesquisa
		await context.sendText(flow.preTCLE.not_eligible);
	}

	await TCLE(context);
	// if (!context.state.user.is_target_audience) { // não é público de interesse
	// 	await TCLE(context);
	// } else if (context.state.leftContact || temConsulta) { // é público de interesse, já fez agendamento ou deixou contato
	// 	await TCLE(context);
	// } else { // é público de interesse, não fez agendamento nem deixou contato
	// 	await context.setState({ nextDialog: 'TCLE', dialog: '' });
	// 	await startConsulta(context);
	// }
}


async function ofertaPesquisaEnd(context) {
	await context.setState({ nextDialog: '', dialog: '' });
	if (context.state.user.is_target_audience) { // é público de interesse
		if (context.state.user.risk_group) { // é público de interesse com risco
			await context.setState({ nextDialog: 'preTCLE' });
			await recrutamento(context);
		} else { // é público de interesse sem risco
			await preTCLE(context);
		}
	} else { // não é público de interesse
		await sendMain(context);
	}
}

module.exports = {
	checkPhone, ofertaPesquisaStart, ofertaPesquisaSim, ofertaPesquisaEnd, TCLE, preTCLE, recrutamento,
};
