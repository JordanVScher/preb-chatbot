const flow = require('./flow');
const opt = require('./options');
const { getRecipientPrep } = require('./prep_api');
const { linkIntegrationTokenLabel } = require('./labels');
const { getPhoneValid } = require('./helper');

async function handleToken(context, answer) {
	if (answer && answer.id) {
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

module.exports = {
	handleToken, checkPhone,
};
