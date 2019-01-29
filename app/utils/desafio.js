const flow = require('./flow');
const opt = require('./options');
const quiz = require('./quiz');

async function asksDesafio(context) {
	if (context.state.finished_quiz === true) {
		await context.sendText('Veja o que você pode fazer por aqui', await quiz.checkAnsweredQuiz(context, opt.greetings)); // has answered the quiz already
	} else {
		await context.sendText(flow.asksDesafio.text1, opt.asksDesafio); // has yet to awnser the quiz
	}
}

async function desafioRecusado(context) {
	await context.sendText('Ok');
	await context.sendText('Veja o que você pode fazer por aqui', opt.greetings);
}

async function desafioAceito(context) {
	await context.sendText('É o seguinte, são algumas perguntinhas e para responder, basta clicar no botão. Caso você clique em "Não sei o que é" em alguma delas, eu explicarei e você poderá responder novamente. No final, seu resultado 😉');
	await context.sendText('Sinceridade, hein! Não estou aqui para te julgar, então se joga!', opt.desafioAceito);
}

module.exports.asksDesafio = asksDesafio;
module.exports.desafioRecusado = desafioRecusado;
module.exports.desafioAceito = desafioAceito;
