const checkQR = require('./checkQR');
const flow = require('./flow');
const { createRecrutamentoTimer } = require('./timer');

async function sendMain(context, text) {
	await context.setState({ nextDialog: '', originalDialog: '', onButtonQuiz: false });
	await context.setState({ calendar: '', calendarCurrent: '', freeHours: '' });
	let toSend = text;
	if (!toSend || toSend.length === 0) {
		toSend = flow.mainMenu.text1;
	}
	await context.sendText(toSend, await checkQR.checkMainMenu(context));

	// create recrutamento timer if it wasn't created already (and if TCLE was never sent)
	if (context.state.recrutamentoTimer === true && !context.state.preCadastroSignature) await createRecrutamentoTimer(context.session.user.id, context);
}


module.exports = {
	sendMain,
};
