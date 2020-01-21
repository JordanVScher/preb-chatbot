const prepApi = require('./prep_api');
const aux = require('./quiz_aux');
const flow = require('./flow');
const { addCityLabel } = require('./labels');
const help = require('./helper');
const { sentryError } = require('./error');

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
		if (context.state.currentQuestion.code === 'AC9') {
			await context.sendText(flow.onTheResearch.text1);
			await context.sendImage(flow.onTheResearch.gif);
			await context.sendText(flow.onTheResearch.text2);
			await context.sendText(flow.onTheResearch.text3);
			// quer saber mais sobre o nosso projeto -> agora é uma pergunta do quiz
		}

		// show question code for dev purposes
		const quizText = process.env.ENV !== 'local' ? context.state.currentQuestion.text : `${context.state.currentQuestion.code}. ${context.state.currentQuestion.text}`;
		if (context.state.currentQuestion.type === 'multiple_choice') {
			await context.setState({ onButtonQuiz: true });
			await context.setState({ buttonsFull: await aux.buildMultipleChoice(context.state.currentQuestion, 'quiz') });
			await context.setState({ buttonTexts: await help.getButtonTextList(context.state.buttonsFull) });
			await context.sendText(quizText, context.state.buttonsFull);
		} else if (context.state.currentQuestion.type === 'open_text') {
			await context.setState({ onTextQuiz: true });
			await context.sendText(quizText);
		}
		await context.typingOff();
	}
}

async function handleAnswer(context, quizOpt) {
	// context.state.currentQuestion.code -> the code for the current question
	// quizOpt -> the quiz option the user clicked/wrote
	await context.setState({ onTextQuiz: false, onButtonQuiz: false });
	await context.setState({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt) });
	console.log(`\nResultado do post da pergunta ${context.state.currentQuestion.code} - ${quizOpt}:`, context.state.sentAnswer, '\n');
	if (process.env.ENV === 'local') { await context.sendText(JSON.stringify(context.state.sentAnswer, null, 2)); }
	// error sending message to API, send user to same question and send error to the devs
	if (context.state.sentAnswer.error || !context.state.sentAnswer) {
		await context.sendText(flow.quiz.form_error);
		await context.setState({ dialog: 'startQuiz' });
		if (process.env.ENV !== 'local') await sentryError('PREP - Erro ao salvar resposta do Quiz', { sentAnswer: context.state.sentAnswer, quizOpt, state: context.state });
		return false;
	}
	// Invalid input format, make user try again on same question. // Date is: YYYY-MM-DD
	if (context.state.sentAnswer.form_error || (context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid')) { // input format is wrong (text)
		await context.sendText(flow.quiz.invalid);
		await context.setState({ dialog: 'startQuiz' }); // re-asks same question
		return false;
	}

	// if we know user is not target audience he can see only the fun_questions from now on
	if (context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0) {
		await context.setState({ categoryQuestion: 'fun_questions' });
	}

	// saving city labels
	if (context.state.currentQuestion.code === 'A1') {
		await addCityLabel(context.session.user.id, quizOpt);
	}

	// if we have any follow-up messages, send them
	if (context.state.sentAnswer.followup_messages) {
		for (let i = 0; i < context.state.sentAnswer.followup_messages.length; i++) {
			if (context.state.sentAnswer.followup_messages[i].includes('.png')) {
				await context.setState({ resultImageUrl: context.state.sentAnswer.followup_messages[i] });
			} else {
				await context.sendText(context.state.sentAnswer.followup_messages[i]);
				if (i === 1 && context.state.currentQuestion.code === 'AC7') {
					if (context.state.resultImageUrl && context.state.resultImageUrl.length > 0) {
						await context.sendImage(context.state.resultImageUrl); // send fun_questions result
						await context.setState({ resultImageUrl: '' });
					}
				}
			}
		}
	}

	// add registration form link to send later
	if (context.state.sentAnswer.offline_pre_registration_form) {
		await context.setState({ registrationForm: context.state.sentAnswer.offline_pre_registration_form });
	}

	if (context.state.currentQuestion.code === 'A6a' || context.state.sentAnswer.is_target_audience === 1) {
		await context.setState({ dialog: 'ofertaPesquisaStart' });
		return false;
	}


	// from here on out, the flow  of the quiz actually changes, so remember to return something to stop the rest from executing
	if (context.state.currentQuestion.code === 'AC9') {
		if (quizOpt.toString() === '1') {
			await context.setState({ dialog: 'firstJoinResearch' });
		} else {
			await context.setState({ dialog: 'firstNoResearch' });
		}
		return false;
	}

	if (context.state.currentQuestion.code === 'AC8' && quizOpt.toString() === '2') {
		await context.setState({ dialog: 'stopHalfway' });
		return false;
	}


	if (context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0) { // check if the quiz is over
		await context.setState({ dialog: 'startQuiz' });
		return false;
	}

	if ((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
	|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0)) {
		await context.setState({ dialog: 'startQuiz' });
		return false;
	}
	await aux.sendTermos(context);


	/* eslint-enable no-lonely-if */
	return true;
}


// extra questions -> explanation of obscure terms
// sends the answer to the question and sends user back to the question
async function AnswerExtraQuestion(context) {
	const index = context.state.lastQRpayload.replace('extraQuestion', '');
	const answer = context.state.currentQuestion.extra_quick_replies[index].text;
	await context.sendText(answer);
	await context.setState({ dialog: 'startQuiz' }); // re-asks same question
	return answer;
}

// allows user to type the text on a button to choose that option
async function handleText(context) {
	if (!context.state.whatWasTyped) return null;
	let text = context.state.whatWasTyped.toLowerCase();
	text = await help.accents.remove(text);
	let getIndex = null;
	context.state.buttonTexts.forEach((e, i) => {
		if (e.trim() === text.trim() && getIndex === null) { // user text has to be the same as the button text
		// if (e.includes(text) && getIndex === null) { // user text has to be belong to the button
			getIndex = i + 1;
		}
	});

	if (getIndex === null) return null;
	return getIndex;
}

module.exports = {
	answerQuizA,
	handleAnswer,
	AnswerExtraQuestion,
	handleText,
};
