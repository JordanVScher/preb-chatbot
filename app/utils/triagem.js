// handles screening/trigem type of quiz
const prepApi = require('./prep_api.js');
const aux = require('./quiz_aux');

async function getTriagem(context) {
	await context.typingOn();
	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, 'screening') });
	console.log('currentQuestion', context.state.currentQuestion);

	if (!context.state.currentQuestion || context.state.currentQuestion.code === null) { // user already answered the quiz (user shouldn't be here)
		await aux.endTriagem(context, context.state.sentAnswer);
	} else { // user is still answering the quiz
		if (context.state.currentQuestion.type === 'multiple_choice') { // showing question and answer options
			await context.sendText(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion, 'tria'));
		} else if (context.state.currentQuestion.type === 'open_text') {
			await context.setState({ onTextQuiz: true });
			await context.sendText(context.state.currentQuestion.text);
		}
		await context.typingOff();
	}
}

async function handleAnswer(context, quizOpt) {
	await context.setState({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, 'screening', context.state.currentQuestion.code, quizOpt) });
	console.log('sentAnswer', context.state.sentAnswer);

	if (context.state.sentAnswer.error || context.state.sentAnswer.form_error) { // error
		await context.sendText('Ops, parece que me perdi. Pode me responder de novo?');
		getTriagem(context);
	} else if (context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid') { // input format is wrong (text)
		await context.sendText('Formato inválido! Tente novamente!');
		getTriagem(context);
	} else { /* eslint-disable no-lonely-if */ // no error, answer was saved successfully
		if (context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0) { // check if the quiz is over
			getTriagem(context);
			// await context.setState({ dialog: 'triagem' }); // not over, sends user to next question
		} else {
			await aux.endTriagem(context, context.state.sentAnswer);
		}
	}
}


module.exports.getTriagem = getTriagem;
module.exports.handleAnswer = handleAnswer;
