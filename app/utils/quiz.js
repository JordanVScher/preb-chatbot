const prepAPI = require('../prep_api.js');
const research = require('./research');

async function endQuizA(context) {
	if (context.state.is_eligible_for_research === true) {
		if (context.state.is_part_of_research === true) {
			await research.onTheResearch(context);
		} else {
			await research.notOnResearch(context);
		}
	} else {
		await research.notOnResearch(context);
	}

	// if (context.state.isPrep === true) {
	// 	await research.onTheResearch(context);
	// } else if (context.state.isPrep === false) {
	// 	await research.NotOnResearch(context);
	// }
}

// check if user has already answered the quiz to remove the quick_reply option from the menu UNUSED
async function checkAnsweredQuiz(context, options) {
	let newOptions = options.quick_replies; // getting array out of the QR object
	console.log('antes', newOptions);
	if (context.state.currentQuestion && context.state.currentQuestion.code === null) { // no more questions to answer
		console.log('entrei');
		newOptions = await newOptions.filter(obj => obj.payload !== 'startQuizA'); // remove quiz option
	}
	console.log('depois', newOptions);
	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

// builds quick_repliy menu from the question answer options
async function buildMultipleChoice(question) {
	const qrButtons = [];
	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: question.multiple_choices[element], payload: `quiz${element}` });
	});

	if (question.extra_quick_replies && question.extra_quick_replies.length > 0) {
		question.extra_quick_replies.forEach((element, index) => {
			qrButtons.push({ content_type: 'text', title: element.label, payload: `extraQuestion${index}` });
		});
	}

	return { quick_replies: qrButtons };
}

// loads next question and shows it to the user
async function answerQuizA(context) {
	await context.setState({ currentQuestion: await prepAPI.getPendinQuestion(context.session.user.id) });
	console.log('\nnova pergunta', context.state.currentQuestion, '\n');

	if (context.state.currentQuestion && context.state.currentQuestion.code === null) { // user already answered the quiz (user shouldn't be here)
		await endQuizA(context); // quiz is over
	} else { /* eslint-disable no-lonely-if */ // user is still answering the quiz
		if (context.state.currentQuestion.count_more === 10) { // encouragement message
			await context.sendText('Só faltam 10 perguntinhas, força! 💪💪');
		} else if (context.state.currentQuestion.count_more === 5) {
			await context.sendText('Calma, só mais 5 perguntas e a gente acaba 🌟🌟');
		} else if (context.state.currentQuestion.count_more === 2) {
			await context.sendText('Boa, só faltam duas perguntinhas ✨✨');
		}

		// showing question and answer options
		if (context.state.currentQuestion.type === 'multiple_choice') {
			await context.sendText(context.state.currentQuestion.text, await buildMultipleChoice(context.state.currentQuestion));
		} else if (context.state.currentQuestion.type === 'open_text') {
			await context.sendText(context.state.currentQuestion.text);
			await context.setState({ onTextQuiz: true });
		}
		/* eslint-enable no-lonely-if */
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
	const sentAnswer = await prepAPI.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt);
	console.log('resultado', sentAnswer);

	if (sentAnswer.error === 'Internal server error') { // error
		await context.sendText('Ops, tive um erro interno');
	} else if (sentAnswer.form_error && sentAnswer.form_error.answer_value && sentAnswer.form_error.answer_value === 'invalid') { // input format is wrong (text)
		await context.sendText('Formato inválido! Digite novamente!');
		// Date is: YYYY-MM-DD
		await context.setState({ dialog: 'startQuizA' }); // re-asks same question
	} else { /* eslint-disable no-lonely-if */ // no error, answer was saved successfully
		// checks if user is a part of this research
		// if (sentAnswer.is_prep && sentAnswer.is_prep === 1) {
		// 	await context.setState({ isPrep: true });
		// } else if (sentAnswer.is_prep && sentAnswer.is_prep === 0) {
		// 	await context.setState({ isPrep: false });
		// }

		if (sentAnswer.is_eligible_for_research && sentAnswer.is_eligible_for_research === 1) { // user is eligible for research -> sees "do you want to participate" question
			await context.setState({ is_eligible_for_research: true });
		}
		if (sentAnswer.is_part_of_research && sentAnswer.is_part_of_research === 1) { // chooses to participate in the research
			await context.setState({ is_part_of_research: true });
		}

		if (sentAnswer.finished_quiz && sentAnswer.finished_quiz === 0) { // check if the quiz is over
			await context.setState({ dialog: 'startQuizA' }); // not over, sends user to next question
		} else {
			await context.sendText('Você acabou o quiz! Bom trabalho! 👏👏👏');
			await endQuizA(context); // quiz is over
		}
		/* eslint-enable no-lonely-if */
	}
}

module.exports.answerQuizA = answerQuizA;
module.exports.handleAnswerA = handleAnswerA;
module.exports.AnswerExtraQuestion = AnswerExtraQuestion;
module.exports.endQuizA = endQuizA;
module.exports.checkAnsweredQuiz = checkAnsweredQuiz;
