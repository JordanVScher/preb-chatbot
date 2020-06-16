const checkQR = require('./checkQR');
const { getQR } = require('./attach');
const flow = require('./flow');

async function sendMain(context, text) {
	await context.setState({ nextDialog: '', originalDialog: '', onButtonQuiz: false });
	await context.setState({ calendar: '', calendarCurrent: '', freeHours: '' });
	let toSend = text;
	if (!toSend || toSend.length === 0) toSend = flow.mainMenu.text1;
	await context.sendText(toSend, await checkQR.checkMainMenu(context));
}


async function falarComHumano(context, nextDialog, text) {
	await context.setState({ nextDialog: nextDialog || '' });

	let toSend = text;
	if (!toSend || toSend.length === 0) toSend = flow.falarComHumano.text1;

	const btn = await getQR(flow.falarComHumano);
	// if user is menorDeQuinze, remove Falar com Humano option
	if (context.state.menorDeQuinze === true) btn.quick_replies.shift();

	await context.sendText(toSend, btn);
}


module.exports = {
	sendMain, falarComHumano,
};
