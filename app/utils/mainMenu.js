const checkQR = require('./checkQR');
const { getQR } = require('./attach');
const flow = require('./flow');
const { getCombinaContact } = require('./helper');

async function sendMain(context, text) {
	await context.setState({ nextDialog: '', originalDialog: '', onButtonQuiz: false });
	await context.setState({ calendar: '', calendarCurrent: '', freeHours: '' });
	let toSend = text;
	if (!toSend || toSend.length === 0) toSend = flow.mainMenu.text1;
	await context.sendText(toSend, await checkQR.checkMainMenu(context));
}

async function falarComCombina(context) {
	const msg = await getCombinaContact(context.state.user.combina_city);
	if (msg) await context.sendText(msg);
	await context.typing(5 * 1000);
	sendMain(context);
}

async function falarComSUS(context) {
	await context.sendText(flow.falarComHumano.sus);
	await context.typing(5 * 1000);
	sendMain(context);
}

async function falarComHumano(context, nextDialog, text) {
	await context.setState({ nextDialog: nextDialog || '' });

	const { user } = context.state;
	if (user && user.voucher_type === 'combina') {
		await falarComCombina(context);
	} else if (user && user.voucher_type === 'sus') {
		await falarComSUS(context);
	} else {
		let toSend = text;
		if (!toSend || toSend.length === 0) toSend = flow.falarComHumano.text1;

		const btn = await getQR(flow.falarComHumano);
		// if user is menorDeQuinze, remove Falar com Humano option
		if (context.state.menorDeQuinze === true || context.state.naoPublico === true) btn.quick_replies.shift();
		await context.sendText(toSend, btn);
	}
}


module.exports = {
	sendMain, falarComHumano, falarComSUS, falarComCombina,
};
