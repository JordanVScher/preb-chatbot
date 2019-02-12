require('dotenv').config();

const cont = require('./context');
const question = require('./question');
const quiz = require('../app/utils/quiz');
const aux = require('../app/utils/quiz_aux');
const prepApi = require('../app/utils/prep_api');

jest.mock('../app/utils/quiz_aux');
jest.mock('../app/utils/prep_api');

it('AnswerExtraQuestion - multiple choice - 5 more', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = question.regularMultipleChoice;
	context.state.categoryQuestion = 'quiz';
	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(aux.handleFlags).toBeCalledWith(context, context.state.currentQuestion);
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();


	await expect(context.state.categoryQuestion === 'quiz').toBeTruthy();
	await expect(context.state.currentQuestion.count_more === 10).toBeFalsy();
	await expect(context.state.currentQuestion.count_more === 5).toBeTruthy();
	await expect(context.state.currentQuestion.count_more === 2).toBeFalsy();
	await expect(context.sendText).toBeCalledWith('Calma, só mais algumas perguntinhas e a gente acaba 🌟🌟');

	await expect(aux.handleAC5).toBeCalledWith(context);
	await expect(context.state.currentQuestion.type === 'multiple_choice').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion));
});

it('AnswerExtraQuestion - open text - 10 more', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = question.regularOpenText;
	context.state.categoryQuestion = 'quiz';
	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(aux.handleFlags).toBeCalledWith(context, context.state.currentQuestion);
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();

	await expect(context.state.categoryQuestion === 'quiz').toBeTruthy();
	await expect(context.state.currentQuestion.count_more === 10).toBeTruthy();
	await expect(context.state.currentQuestion.count_more === 5).toBeFalsy();
	await expect(context.state.currentQuestion.count_more === 2).toBeFalsy();
	await expect(context.sendText).toBeCalledWith('Estamos indo bem, força! 💪💪');

	await expect(aux.handleAC5).toBeCalledWith(context);
	await expect(context.state.currentQuestion.type === 'open_text').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text);
	await expect(context.setState).toBeCalledWith({ onTextQuiz: true });
});

it('AnswerExtraQuestion - null question', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = question.nullQuestion;
	context.state.categoryQuestion = 'quiz';
	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(aux.handleFlags).toBeCalledWith(context, context.state.currentQuestion);
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeTruthy();
	await expect(aux.endQuizA).toBeCalledWith(context);
});

it('AnswerExtraQuestion - null question', async () => {
	const context = cont.quickReplyContext('extraQuestion0', 'beginQuiz');
	context.state.currentQuestion = question.extraMultiple;
	await quiz.AnswerExtraQuestion(context);

	const index = context.state.lastQRpayload.replace('extraQuestion', '');
	await expect(index === '0').toBeTruthy();
	const answer = context.state.currentQuestion.extra_quick_replies[index].text;
	await expect(answer === 'Tente descobrir').toBeTruthy();

	await expect(context.sendText).toBeCalledWith(answer);
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});

it('handleAnswerA - regular answer - not finished', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = question.nullQuestion;
	context.state.sentAnswer = question.notFinished;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.state.sentAnswer.error === 'Internal server error').toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(aux.handleFlags).toBeCalledWith(context, context.state.sentAnswer);

	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ finished_quiz: false });
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});
it('handleAnswerA - regular answer - finished', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = question.nullQuestion;
	context.state.sentAnswer = question.finished;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.state.sentAnswer.error === 'Internal server error').toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(aux.handleFlags).toBeCalledWith(context, context.state.sentAnswer);

	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeFalsy();
	await expect(aux.endQuizA).toBeCalledWith(context);
});

it('handleAnswerA - internal error', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = question.nullQuestion;
	context.state.sentAnswer = question.serverError;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.state.sentAnswer.error === 'Internal server error').toBeTruthy();
	await expect(context.sendText).toBeCalledWith('Ops, tive um erro interno');
});

it('handleAnswerA - invalid value', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = question.nullQuestion;
	context.state.sentAnswer = question.invalidValue;
	const quizOpt = '19/19/19';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeTruthy();
	await expect(context.sendText).toBeCalledWith('Formato inválido! Tente novamente!');
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});
