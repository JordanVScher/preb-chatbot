const { join } = require('./flow');
const { getQR } = require('./attach');
const { getRecipientPrep } = require('./prep_api');
const { putUpdateVoucherFlag } = require('./prep_api');
const { linkIntegrationTokenLabel } = require('./labels');

// fluxo já faço parte
async function handlePrepToken(context, answer) {
	if (answer === true) {
		await context.sendText(join.askPrep.success);
		await putUpdateVoucherFlag(context.session.user.id, 'sisprep');
		await context.setState({ user: await getRecipientPrep(context.session.user.id) }); // integration_token is added to user
		await linkIntegrationTokenLabel(context);
		if (context.state.user.is_prep === 1) await context.sendText(join.end);
		await context.setState({ dialog: 'mainMenu' });
	} else { // error or invalid number
		await context.sendText(join.askPrep.fail1);
		await context.sendText(join.askPrep.fail2, await getQR(join.askPrep));
		await context.setState({ dialog: 'joinPrepErro' });
	}
}


module.exports = {
	handlePrepToken,
};
