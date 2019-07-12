const flow = require('./flow');
const opt = require('./options');
const { getRecipientPrep } = require('./prep_api');
const { checarConsulta } = require('./consulta');

module.exports.researchSaidYes = async (context) => {
	await context.setState({ categoryConsulta: 'recrutamento' });
	await context.setState({ sendExtraMessages: true }); // used only to show a few different messages on consulta
	await checarConsulta(context);
};

module.exports.handleToken = async (context, answer) => {
	if (answer === true) {
		await context.sendText(flow.joinToken.success);
		await context.setState({ user: await getRecipientPrep(context.session.user.id) }); // integration_token is added to user
		await context.setState({ dialog: 'mainMenu' });
	} else { // error or invalid number
		await context.sendText(flow.joinToken.fail);
		await context.sendText(flow.joinToken.fail2, opt.joinToken);
		await context.setState({ dialog: 'joinTokenErro' });
	}
};
