const { join } = require('./flow');
const { getQR } = require('./attach');
const { getRecipientPrep } = require('./prep_api');
const { putUpdateVoucherFlag } = require('./prep_api');
const { getValidVouchers } = require('./prep_api');
const { linkIntegrationTokenLabel } = require('./labels');
const { sendMain } = require('./mainMenu');

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

async function handleCombinaToken(context, answer) {
	if (answer && answer.id) {
		await context.sendText(join.joinCombinaAsk.success);
		await context.setState({ user: await getRecipientPrep(context.session.user.id) });
		await linkIntegrationTokenLabel(context);
		await context.setState({ dialog: 'joinCombinaCity' });
	} else { // error or invalid number
		await context.sendText(join.joinCombinaAsk.fail1);
		await context.sendText(join.joinCombinaAsk.fail2, await getQR(join.joinCombinaAsk));
		await context.setState({ dialog: 'joinCombinaAskErro' });
	}
}

async function joinSus(context) {
	await context.sendText(join.end);
	await putUpdateVoucherFlag(context.session.user.id, 'sus');
	await context.setState({ user: await getRecipientPrep(context.session.user.id) });
	await sendMain(context);
}

async function printCombinaVouchers(context) {
	const { ENV } = process.env;

	if (!ENV || ENV !== 'homol' || ENV !== 'local') {
		console.log('Essa função não pode ser acessada nesse ambiente!');
	} else {
		const res = await getValidVouchers();

		if (res && res.available_combina_vouchers) {
			const text = res.available_combina_vouchers.join('\n');
			if (text) await context.sendText(`Alguns vouchers válidos:\n${text}`);
		}
	}
}


module.exports = {
	handlePrepToken, handleCombinaToken, joinSus, printCombinaVouchers,
};
