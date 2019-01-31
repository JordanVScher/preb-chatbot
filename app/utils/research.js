const flow = require('./flow');
const opt = require('./options');
const desafio = require('./desafio');

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
	await context.sendText(flow.quizYes.text1, await desafio.checkAnsweredQuiz(context, opt.saidYes));
}

module.exports.onTheResearch = onTheResearch;
module.exports.notOnResearch = notOnResearch;
module.exports.notEligible = notEligible;
module.exports.researchSaidNo = researchSaidNo;
module.exports.researchSaidYes = researchSaidYes;
