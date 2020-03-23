require('dotenv').config();

const cont = require('./context');
const questions = require('./question');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const triagem = require('../app/utils/triagem');
const aux = require('../app/utils/quiz_aux');
const prepApi = require('../app/utils/prep_api');
const help = require('../app/utils/helper');

jest.mock('../app/utils/quiz_aux');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/labels');
jest.mock('../app/utils/helper');

it('endTriagem - suggest_wait_for_test and dont go_to_test', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { suggest_wait_for_test: 1, go_to_test: 0 };
	await triagem.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ suggestWaitForTest: true });

	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_test === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('endTriagem - emergency_rerouting', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { emergency_rerouting: 1 };
	await triagem.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ suggestWaitForTest: false });

	await expect(context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.triagem.emergency1);
	await expect(context.sendText).toBeCalledWith(await help.buildPhoneMsg(context.state.user.city, 'Telefones pra contato:'));
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('endTriagem - go_to_test', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { go_to_test: 1 };
	await triagem.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'autoTeste' });
});


it('endTriagem - go_to_appointment', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { go_to_appointment: 1 };
	await triagem.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'checarConsulta' });
});

it('endTriagem - suggest_appointment', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { suggest_appointment: 1 };
	await triagem.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.triagem.suggest, opt.triagem1);
	await context.sendText(flow.triagem.suggest, opt.triagem1);
});

it('endTriagem - default case', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await triagem.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1).toBeFalsy();

	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('handleAnswer - default case', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	const quizOpt = '0'; context.state.currentQuestion = questions.nullQuestion;
	await triagem.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, 'screening', context.state.currentQuestion.code, quizOpt) });
	await expect(!context.state.sentAnswer || context.state.sentAnswer.error).toBeTruthy();

	await expect(context.sendText).toBeCalledWith(flow.quiz.form_error);
	await expect(context.setState).toBeCalledWith({ dialog: 'triagemQuiz' });
});

it('handleAnswer - invalid value', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.invalidValue;
	const quizOpt = '19/19/19';
	await triagem.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, 'screening', context.state.currentQuestion.code, quizOpt) });
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeTruthy();

	await expect(context.sendText).toBeCalledWith(flow.quiz.invalid);
	await expect(context.setState).toBeCalledWith({ dialog: 'triagemQuiz' });
});

it('handleAnswer - regular answer - not finished', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.notFinished;
	const quizOpt = '1';
	await triagem.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, 'screening', context.state.currentQuestion.code, quizOpt) });
	await expect(!context.state.sentAnswer || context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'triagemQuiz' });
});

it('handleAnswer - regular answer - finished quiz', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.finished;
	const quizOpt = '1';
	await triagem.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, 'screening', context.state.currentQuestion.code, quizOpt) });
	await expect(!context.state.sentAnswer || context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeFalsy();

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' }); // endTriagem
});

// async function getTriagem(context) {
// 	await context.typingOn();
// 	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, 'screening') });
// 	console.log('currentQuestion', context.state.currentQuestion);


// 	if (!context.state.currentQuestion || context.state.currentQuestion.code === null) { // user already answered the quiz (user shouldn't be here)
// 		await endTriagem(context, context.state.sentAnswer);
// 	} else { // user is still answering the quiz
// 		if (context.state.currentQuestion.code === 'SC2') {
// 			await context.sendText(flow.quiz.sintoma);
// 		}

// 		if (context.state.currentQuestion.type === 'multiple_choice') { // showing question and answer options
// 			await context.sendText(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion, 'tria'));
// 		} else if (context.state.currentQuestion.type === 'open_text') {
// 			await context.setState({ onTextQuiz: true });
// 			await context.sendText(context.state.currentQuestion.text);
// 		}
// 		await context.typingOff();
// 	}
// }

it('getTriagem - null question', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.nullQuestion;
	await triagem.getTriagem(context);

	await expect(context.typingOn).toBeCalled();

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, 'screening') });
	await expect(!context.state.currentQuestion || context.state.currentQuestion.code === null).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' }); // endTriagem
	await expect(context.typingOff).toBeCalled();
});

it('getTriagem - SC2 and multiple_choice', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.extraMultiple;
	context.state.currentQuestion.code = 'SC2';
	await triagem.getTriagem(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, 'screening') });
	await expect(!context.state.currentQuestion || context.state.currentQuestion.code === null).toBeFalsy();
	await expect(context.state.currentQuestion.code === 'SC2').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quiz.sintoma);

	await expect(context.state.currentQuestion.type === 'multiple_choice').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion, 'tria'));
});

it('getTriagem - SC2 and multiple_choice', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.regularOpenText;
	await triagem.getTriagem(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, 'screening') });
	await expect(!context.state.currentQuestion || context.state.currentQuestion.code === null).toBeFalsy();
	await expect(context.state.currentQuestion.code === 'SC2').toBeFalsy();
	await expect(context.state.currentQuestion.type === 'multiple_choice').toBeFalsy();
	await expect(context.state.currentQuestion.type === 'open_text').toBeTruthy();

	await expect(context.setState).toBeCalledWith({ onTextQuiz: true });
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text);
});
