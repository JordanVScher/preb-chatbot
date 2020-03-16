const checkQR = require('./checkQR');
const flow = require('./flow');

async function sendMain(context, text) {
	await context.setState({ nextDialog: '', originalDialog: '', onButtonQuiz: false });
	await context.setState({ calendar: '', calendarCurrent: '', freeHours: '' });
	let toSend = text;
	if (!toSend || toSend.length === 0) {
		toSend = flow.mainMenu.text1;
	}
	await context.sendText(toSend, await checkQR.checkMainMenu(context));
}


module.exports = {
	sendMain,
};
