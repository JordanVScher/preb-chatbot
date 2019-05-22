const flow = require('./flow');
const opt = require('./options');
const checkQR = require('./checkQR');
const { postIntegrationToken } = require('./prep_api');
const { checarConsulta } = require('./consulta');

module.exports.handleToken = async (context) => {
	const answer = await postIntegrationToken(context.session.user.id, context.state.whatWasTyped);
	if (answer.form_error) { // check if there was any errors
		await context.sendText(flow.joinToken.fail);
		await context.sendText(flow.joinToken.fail2, opt.joinToken);
		await context.setState({ dialog: 'joinTokenErro' });
	} else {
		await context.sendText(flow.joinToken.success);
		await context.setState({ dialog: 'mainMenu' });
	}
};

module.exports.onTheResearch = async (context) => { // -- not used
	await context.setState({ dialog: 'onTheResearch' });
	await context.sendText(flow.onTheResearch.text2);
	await context.sendText(flow.onTheResearch.text3);
	await context.sendText(flow.onTheResearch.AC5);
	await context.sendButtonTemplate(flow.quizYes.text1, opt.artigoLink);
	await context.sendText(flow.onTheResearch.extra, opt.onTheResearch);
};

module.exports.notEligible = async (context) => { // -- not used // não passou nas 3 primeiras perguntas
	await context.setState({ dialog: 'NotEligible' });
	await context.sendText(flow.foraPesquisa.text1, await checkQR.checkMainMenu(context));
};

module.exports.researchSaidYes = async (context) => {
	await context.setState({ categoryConsulta: 'recrutamento' });
	await context.setState({ sendExtraMessages: true }); // used only to show a few different messages on consulta
	await checarConsulta(context);
};

module.exports.notPart = async (context) => { // -- not used
	await context.setState({ dialog: 'noResearch' });
	await context.sendText(flow.foraPesquisa.text1, await checkQR.checkMainMenu(context));
};
