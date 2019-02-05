const flow = require('./flow');
const opt = require('./options');
const prepApi = require('./prep_api');
const { checkAnsweredQuiz } = require('./checkQR');

async function asksDesafio(context, options) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	if (context.state.user.finished_quiz === 1) {
		await context.sendText(flow.desafioRecusado.text2, await checkAnsweredQuiz(context, options)); // has answered the quiz already
	} else {
		await context.sendText(flow.asksDesafio.text1, opt.asksDesafio); // has yet to awnser the quiz
	}
}

async function desafioRecusado(context) {
	await context.sendText(flow.desafioRecusado.text1);
	await context.sendText(flow.desafioRecusado.text2, await checkAnsweredQuiz(context, opt.greetings));
}

async function desafioAceito(context) {
	await context.sendText(flow.desafioAceito.text1);
	await context.sendText(flow.desafioAceito.text2, opt.desafioAceito);
}


module.exports.asksDesafio = asksDesafio;
module.exports.desafioRecusado = desafioRecusado;
module.exports.desafioAceito = desafioAceito;
