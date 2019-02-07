const flow = require('./flow');
const opt = require('./options');
const { checkAnsweredQuiz } = require('./checkQR');

async function handleToken(context) {
	await context.setState({ awaitToken: false, dialog: 'handleToken' });
	if (context.state.whatWasTyped.length === 6) {
		await context.sendText('Legal, é válido!');
		await context.setState({ dialog: 'mainMenu' });
	} else {
		await context.sendText('Inválido, tente novamente');
		await context.setState({ dialog: 'joinToken' });
	}
}

async function onTheResearch(context) {
	await context.setState({ dialog: 'onTheResearch' });
	await context.sendText(flow.onTheResearch.text1);
	await context.sendImage(flow.onTheResearch.gif);
	await context.sendText(flow.onTheResearch.text2);
}

async function notOnResearch(context) {
	await context.setState({ dialog: 'NotOnResearch' });
	await context.sendText(flow.NotOnResearch.text1);
}

async function notEligible(context) {
	await context.setState({ dialog: 'NotEligible' });
	await context.sendText(flow.notEligible.text1, opt.saidNo);
}

async function researchSaidNo(context) {
	await context.sendText(flow.quizNo.text1, opt.saidNo);
}

async function researchSaidYes(context) {
	await context.sendText(flow.quizYes.text1, await checkAnsweredQuiz(context, opt.saidYes));
}

module.exports.onTheResearch = onTheResearch;
module.exports.notOnResearch = notOnResearch;
module.exports.notEligible = notEligible;
module.exports.researchSaidNo = researchSaidNo;
module.exports.researchSaidYes = researchSaidYes;
module.exports.handleToken = handleToken;
