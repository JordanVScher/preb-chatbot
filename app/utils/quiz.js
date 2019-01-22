const prepAPI = require('../prep_api.js');

async function buildMultipleChoice(question) {
	const qrButtons = [];
	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: question.multiple_choices[element], payload: `quiz${element}` });
	});

	return { quick_replies: qrButtons };
}

async function answerQuizA(context) {
	await context.setState({ currentQuestion: await prepAPI.getPendinQuestion(context.session.user.id) });

	console.log('nova pergunta', context.state.currentQuestion);

	if (context.state.currentQuestion && context.state.currentQuestion.error) {
		await context.sendText('Você já respondeu esse quiz!');
	} else if (context.state.currentQuestion.type === 'multiple_choice') {
		await context.sendText(context.state.currentQuestion.text, await buildMultipleChoice(context.state.currentQuestion));
	}
}

async function handleAnswerA(context) {
	// context.state.currentQuestion.code -> the code for the current question
	const quizOpt = context.state.lastQRpayload.replace('quiz', ''); // the quiz option the user clicked
	const sentAnswer = await prepAPI.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt);
	console.log('resultado', sentAnswer);
	if (sentAnswer.finished_quiz === 0) {
		await context.setState({ dialog: 'startQuizA' });
	} else {
		await context.setState({ dialog: 'endQuizA' });
	}
}


module.exports.answerQuizA = answerQuizA;
module.exports.handleAnswerA = handleAnswerA;
