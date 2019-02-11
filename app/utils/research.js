const flow = require('./flow');
const opt = require('./options');
const checkQR = require('./checkQR');
const { postIntegrationToken } = require('./prep_api');


async function handleToken(context) {
	const answer = await postIntegrationToken(context.session.user.id, context.state.whatWasTyped);
	if (answer.form_error) { // check if there was any errors
		await context.sendText(flow.joinToken.fail);
		await context.setState({ dialog: 'joinToken' });
	} else {
		await context.sendText(flow.joinToken.success);
		await context.setState({ dialog: 'mainMenu' });
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

async function notEligible(context) { // não passou nas 3 primeiras perguntas
	await context.setState({ dialog: 'NotEligible' });
	await context.sendText(flow.notEligible.text1);
	await context.sendText(flow.notEligible.text2, await checkQR.checkMainMenu(context, opt.mainMenu));
}

async function researchSaidNo(context) {
	await context.sendButtonTemplate(flow.quizNo.text1, opt.artigoLink);
	await context.sendText(flow.quizNo.text2, opt.saidNo);
}

async function researchSaidYes(context) {
	await context.sendButtonTemplate(flow.quizYes.text1, opt.artigoLink);
	await context.sendButtonTemplate(flow.quizYes.text2, opt.artigoLink);
	await context.sendText(flow.quizYes.text3, await checkQR.checkAnsweredQuiz(context, opt.saidYes));
}

async function notPart(context) {
	await context.setState({ dialog: 'noResearch' });
}

module.exports.onTheResearch = onTheResearch;
module.exports.notOnResearch = notOnResearch;
module.exports.notEligible = notEligible;
module.exports.researchSaidNo = researchSaidNo;
module.exports.researchSaidYes = researchSaidYes;
module.exports.handleToken = handleToken;
module.exports.notPart = notPart;
