const flow = require('./flow');
const opt = require('./options');
const { getQR } = require('./attach');
const { getRecipientPrep } = require('./prep_api');
const { linkIntegrationTokenLabel } = require('./labels');
const { getPhoneValid } = require('./helper');

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

async function ofertaPesquisaEnd(context) {
	await context.setState({ nextDialog: '' });
	await context.sendText('ofertaPesquisaEnd');
}

module.exports = {
	handleToken, checkPhone, ofertaPesquisaStart, ofertaPesquisaSim, ofertaPesquisaEnd,
};
