const prepApi = require('./prep_api');
const aux = require('./quiz_aux');
const flow = require('./flow');
const { addCityLabel } = require('./labels');

// const { sendShare } = require('./checkQR');

// loads next question and shows it to the user
async function answerQuizA(context) {
	await context.typingOn();
	// if the user never started the quiz (or if the user already ended the quiz once === '') the category is 'quiz'
	if (!context.state.categoryQuestion || context.state.categoryQuestion === '') { await context.setState({ categoryQuestion: 'quiz' }); }

	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	console.log('\nA nova pergunta do get', context.state.currentQuestion, '\n');
	console.log('categoryQuestion', context.state.categoryQuestion);

	// user already answered the quiz (user shouldn't be here)
	if ((!context.state.currentQuestion || context.state.currentQuestion.code === null) && (context.state.sentAnswer && !context.state.sentAnswer.form_error)) {
		await aux.sendTermos(context);
	} else { // user is still answering the quiz
		// showing question and answer options

		if (context.state.currentQuestion.code === 'AC9') {
			await context.sendText(flow.onTheResearch.text1);
			await context.sendImage(flow.onTheResearch.gif);
			await context.sendText(flow.onTheResearch.text2);
			await context.sendText(flow.onTheResearch.text3);
		// quer saber mais sobre o nosso projeto -> agora é uma pergunta do quiz
		}

			if (context.state.currentQuestion.type === 'multiple_choice') { // eslint-disable-line
			await context.sendText(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion, 'quiz'));
		} else if (context.state.currentQuestion.type === 'open_text') {
			await context.setState({ onTextQuiz: true });
			await context.sendText(context.state.currentQuestion.text);
		}
		await context.typingOff();
	} // -- answering quiz else
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
	console.log(`\nResultado do post da pergunta ${context.state.currentQuestion.code} - ${quizOpt}:`, context.state.sentAnswer, '\n');
	await context.setState({ onTextQuiz: false });
	// if we know user is not target audience he can only see the fun_questions or now on
	if (context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0) {
		await context.setState({ categoryQuestion: 'fun_questions' });
	}

	if (context.state.sentAnswer.error || !context.state.sentAnswer) { // error
		await context.sendText(flow.quiz.form_error);
		await context.setState({ dialog: 'startQuizA' }); // not over, sends user to next question
	} else {
		if (context.state.sentAnswer.followup_messages) {
			for (let i = 0; i < context.state.sentAnswer.followup_messages.length; i++) { // eslint-disable-line no-plusplus
				if (context.state.sentAnswer.followup_messages[i].includes('.png')) {
					await context.setState({ resultImageUrl: context.state.sentAnswer.followup_messages[i] }); // not over, sends user to next question
				} else {
					await context.sendText(context.state.sentAnswer.followup_messages[i]);
					if (i === 1 && context.state.currentQuestion.code === 'AC7') {
						if (context.state.resultImageUrl && context.state.resultImageUrl.length > 0) {
							await context.sendImage(context.state.resultImageUrl);
							await context.setState({ resultImageUrl: '' });
						}
					}
				}
			}
		}

		// saving city labels
		if (context.state.currentQuestion.code === 'A1') {
			await addCityLabel(context.session.user.id, quizOpt);
		}

		if (context.state.sentAnswer.offline_pre_registration_form) {
			await context.setState({ registrationForm: context.state.sentAnswer.offline_pre_registration_form });
		}

		if (context.state.currentQuestion.code === 'AC9') {
			if (quizOpt.toString() === '1') {
				await context.setState({ dialog: 'firstJoinResearch' });
			} else {
				await context.setState({ dialog: 'firstNoResearch' });
			}
		} else if (context.state.currentQuestion.code === 'AC8' && quizOpt.toString() === '2') {
			await context.setState({ dialog: 'stopHalfway' });
		} else if (context.state.sentAnswer.form_error
			|| (context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid')) { // input format is wrong (text)
			await context.sendText(flow.quiz.invalid); // Date is: YYYY-MM-DD
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
		}
		/* eslint-enable no-lonely-if */
	}
}


// extra questions -> explanation of obscure terms
// sends the answer to the question and sends user back to the question
async function AnswerExtraQuestion(context) {
	const index = context.state.lastQRpayload.replace('extraQuestion', '');
	const answer = context.state.currentQuestion.extra_quick_replies[index].text;
	await context.sendText(answer);
	await context.setState({ dialog: 'startQuizA' }); // re-asks same question
	return answer;
}

module.exports = {
	answerQuizA,
	handleAnswerA,
	AnswerExtraQuestion,
};
