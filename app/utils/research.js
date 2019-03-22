const flow = require('./flow');
const opt = require('./options');
const checkQR = require('./checkQR');
const { postIntegrationToken } = require('./prep_api');
const { checarConsulta } = require('./consulta');

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

	await context.sendText(flow.onTheResearch.text2);
	await context.sendText(flow.onTheResearch.AC5);
	await context.sendButtonTemplate(flow.quizYes.text1, opt.artigoLink);
	await context.sendText(flow.onTheResearch.extra, opt.onTheResearch);
}

async function notEligible(context) { // não passou nas 3 primeiras perguntas
	await context.setState({ dialog: 'NotEligible' });
	await context.sendText(flow.foraPesquisa.text1, await checkQR.checkMainMenu(context));
}

async function researchSaidYes(context) {
	await context.setState({ categoryConsulta: 'recrutamento' });
	await context.setState({ sendExtraMessages: true }); // used only to show a few different messages on consulta
	await checarConsulta(context);
}

async function notPart(context) {
	await context.setState({ dialog: 'noResearch' });
	await context.sendText(flow.foraPesquisa.text1, await checkQR.checkMainMenu(context));
}

module.exports.onTheResearch = onTheResearch;
module.exports.notEligible = notEligible;
// module.exports.researchSaidNo = researchSaidNo;
module.exports.researchSaidYes = researchSaidYes;
module.exports.handleToken = handleToken;
module.exports.notPart = notPart;
