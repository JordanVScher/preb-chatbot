const checkQR = require('./checkQR');
const flow = require('./flow');
// const opt = require('./options');
// const prepApi = require('./prep_api');
const { answerQuizA } = require('./quiz');
const { getTriagem } = require('./triagem');

async function sendMain(context, text) {
	await context.setState({ nextDialog: '', onButtonQuiz: false });
	await context.setState({ calendar: '', calendarCurrent: '', freeHours: '' });
	if (context.state.goBackToQuiz === true) { // check if user is on a quiz/triagem so that we can send them back there right away instead of asking
		await context.setState({ dialog: 'backToQuiz', goBackToQuiz: false });
		await context.sendText(`${flow.desafio.text3}`);
		await answerQuizA(context);
	} else if (context.state.goBackToTriagem === true) {
		await context.setState({ dialog: 'goBackToTriagem', goBackToTriagem: false });
		await context.sendText(`${flow.desafio.text3}`);
		await getTriagem(context);
	} else {
		let toSend = text;
		if (!toSend || toSend.length === 0) {
			toSend = flow.mainMenu.text1;
		}
		await context.sendText(toSend, await checkQR.checkMainMenu(context));
	}
}


module.exports = {
	sendMain,
};
