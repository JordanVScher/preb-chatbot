// handles screening/trigem type of quiz
const prepApi = require('./prep_api.js');
const aux = require('./quiz_aux');
const flow = require('./flow');
const { answerQuizA } = require('./quiz');
const { checkMainMenu } = require('./checkQR');
const help = require('./helper');
const opt = require('./options');

async function sendMain(context, text) {
	if (context.state.goBackToQuiz === true) { // check if user is on a quiz/ triagem so that we can send them back there right away instead of asking
		await context.setState({ dialog: 'backToQuiz', goBackToQuiz: false });
		await context.sendText(`${flow.desafio.text3}`);
		await answerQuizA(context);
	} else if (context.state.goBackToTriagem === true) {
		await context.setState({ dialog: 'goBackToTriagem', goBackToTriagem: false });
		await context.sendText(`${flow.desafio.text3}`);
		await getTriagem(context); // eslint-disable-line
	} else {
		let toSend = text;
		if (!toSend || toSend.length === 0) {
			toSend = flow.mainMenu.text1;
		}
		await context.sendText(toSend, await checkMainMenu(context));
	}
}

async function endTriagem(context) {
	await context.setState({ dialog: 'endTriagem' });
	console.log('result endTriagem', context.state.sentAnswer);

	if (context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1) {
		await context.setState({ suggestWaitForTest: true });
	} else {
		await context.setState({ suggestWaitForTest: false });
	}

	if (context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1) { // quando responder Há menos de 72H para a primeira pergunta da triagem
		await context.sendText(flow.triagem.emergency1);
		await context.sendText(await help.buildPhoneMsg(context.state.user.city, 'Telefones pra contato:', help.telefoneDictionary));
		await sendMain(context);
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1) { // "A mais de 6 meses" + todos não
		await context.setState({ dialog: 'autoTeste' });
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1) { // quando responder sim para a SC6 -> talvez a prep seja uma boa pra vc. bora marcar?
		await context.setState({ dialog: 'checarConsulta' });
	} else if (context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1) { // qualquer sim
		await context.sendText(flow.triagem.suggest, opt.triagem1);
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_test === 0) { // quando responder não para a SC6
		await sendMain(context);
	} else {
		await sendMain(context);
	}
}

async function getTriagem(context) {
	await context.typingOn();
	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, 'screening') });

	if (!context.state.currentQuestion || context.state.currentQuestion.code === null) { // user already answered the quiz (user shouldn't be here)
		await endTriagem(context, context.state.sentAnswer);
	} else { // user is still answering the quiz
		if (context.state.currentQuestion.code === 'SC2') {
			await context.sendText(flow.quiz.sintoma);
		}

		if (context.state.currentQuestion.type === 'multiple_choice') { // showing question and answer options
			await context.sendText(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion, 'tria'));
		} else if (context.state.currentQuestion.type === 'open_text') {
			await context.setState({ onTextQuiz: true });
			await context.sendText(context.state.currentQuestion.text);
		}
	}
	await context.typingOff();
}

async function handleAnswer(context, quizOpt) {
	await context.setState({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, 'screening', context.state.currentQuestion.code, quizOpt) });
	console.log('sentAnswer', context.state.sentAnswer);

	if (!context.state.sentAnswer || context.state.sentAnswer.error) { // error
		await context.sendText(flow.quiz.form_error);
		await context.setState({ dialog: 'triagem' });
	} else if (context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid') { // input format is wrong (text)
		await context.sendText(flow.quiz.invalid);
		await context.setState({ dialog: 'triagem' });
	} else { /* eslint-disable no-lonely-if */ // no error, answer was saved successfully
		if (context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0) { // check if the quiz is over
			await context.setState({ dialog: 'triagem' }); // not over, sends user to next question
		} else {
			await endTriagem(context, context.state.sentAnswer);
		}
	}
}

module.exports = {
	getTriagem,
	handleAnswer,
	endTriagem,
};
