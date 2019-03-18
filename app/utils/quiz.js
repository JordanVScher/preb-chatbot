const prepApi = require('./prep_api.js');
const aux = require('./quiz_aux');
const flow = require('./flow');


// loads next question and shows it to the user
async function answerQuizA(context) {
	await context.typingOn();
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });

	if (context.state.user.is_target_audience === 0) {
		await context.setState({ categoryQuestion: 'fun_questions' });
	} else {
		await context.setState({ categoryQuestion: 'quiz' });
	}

	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	console.log('\nA nova pergunta do get', context.state.currentQuestion, '\n');

	// user already answered the quiz (user shouldn't be here)
	if ((!context.state.currentQuestion || context.state.currentQuestion.code === null) && (context.state.sentAnswer && !context.state.sentAnswer.form_error)) {
		await aux.sendTermos(context);
	} else { // user is still answering the quiz
		if (context.state.categoryQuestion === 'quiz') { // send encouragement only on the regular quiz
			if (context.state.currentQuestion.count_more === 10) { // encouragement message
				await context.sendText(flow.quiz.count1);
			} else if (context.state.currentQuestion.count_more === 5) {
				await context.sendText(flow.quiz.count2);
			} else if (context.state.currentQuestion.count_more === 2) {
				await context.sendText(flow.quiz.count3);
			}
		}

		// showing question and answer options
			if (context.state.currentQuestion.type === 'multiple_choice') { // eslint-disable-line
			await context.sendText(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion, 'quiz'));
		} else if (context.state.currentQuestion.type === 'open_text') {
			await context.setState({ onTextQuiz: true });
			await context.sendText(context.state.currentQuestion.text);
		}
		// } // -- not AC5
		await context.typingOff();
	} // -- answering quiz else
}

// extra questions -> explanation of obscure terms
// sends the answer to the question and sends user back to the question
async function AnswerExtraQuestion(context) {
	const index = context.state.lastQRpayload.replace('extraQuestion', '');
	const answer = context.state.currentQuestion.extra_quick_replies[index].text;
	await context.sendText(answer);
	await context.setState({ dialog: 'startQuizA' }); // re-asks same question
}

async function handleAnswerA(context, quizOpt) {
	// context.state.currentQuestion.code -> the code for the current question
	// quizOpt -> the quiz option the user clicked/wrote
	// try {
	await context.setState({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt) });
	// } catch (err) {
	// await context.sendText(flow.quiz.form_error);
	// await context.setState({ dialog: 'startQuizA' }); // not over, sends user to next question
	// }
	console.log('\nResultado do post da pergunta', context.state.sentAnswer, '\n');
	await context.setState({ onTextQuiz: false });

	if (context.state.sentAnswer.error) { // error
		await context.sendText(flow.quiz.form_error);
		await context.setState({ dialog: 'startQuizA' }); // not over, sends user to next question
	} else if (context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid') { // input format is wrong (text)
		await context.sendText(flow.quiz.invalid);
		// Date is: YYYY-MM-DD
		await context.setState({ dialog: 'startQuizA' }); // re-asks same question
	} else { /* eslint-disable no-lonely-if */ // no error, answer was saved successfully
		if (context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0) { // check if the quiz is over
			await context.setState({ dialog: 'startQuizA' }); // not over, sends user to next question
		} else if ((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
		|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0)) {
			await context.setState({ dialog: 'startQuizA' }); // not over, sends user to next question
		} else {
			await aux.sendTermos(context);
		}
		/* eslint-enable no-lonely-if */
	}
}


module.exports.answerQuizA = answerQuizA;
module.exports.handleAnswerA = handleAnswerA;
module.exports.AnswerExtraQuestion = AnswerExtraQuestion;
