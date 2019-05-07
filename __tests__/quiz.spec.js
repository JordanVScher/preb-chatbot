require('dotenv').config();

const cont = require('./context');
const questions = require('./question');
const quiz = require('../app/utils/quiz');
const aux = require('../app/utils/quiz_aux');
const flow = require('../app/utils/flow');
const prepApi = require('../app/utils/prep_api');

jest.mock('../app/utils/quiz_aux');
jest.mock('../app/utils/prep_api');

it('answerQuizA - multiple choice - 5 more - empty category', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.regularMultipleChoice; context.state.categoryQuestion = '';
	context.state.user = { is_target_audience: 1 };
	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.categoryQuestion || context.state.categoryQuestion === '').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'quiz' });
	context.state.categoryQuestion = 'quiz'; // change quiz value
	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();
	await expect(context.state.categoryQuestion === 'quiz').toBeTruthy();
	await expect(context.state.currentQuestion.count_more === 5).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quiz.count2);

	await expect(context.state.currentQuestion.type === 'multiple_choice').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion));
	await expect(context.typingOff).toBeCalled();
});

it('answerQuizA - multiple choice - 5 more - fun_questions', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.regularMultipleChoice; context.state.categoryQuestion = 'fun_questions';
	context.state.user = { is_target_audience: 1 };
	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.categoryQuestion || context.state.categoryQuestion === '').toBeFalsy();

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();
	await expect(context.state.categoryQuestion === 'quiz').toBeFalsy();

	await expect(context.state.currentQuestion.type === 'multiple_choice').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion));
	await expect(context.typingOff).toBeCalled();
});

it('answerQuizA - open text - 10 more - quiz category', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.regularOpenText; context.state.categoryQuestion = 'quiz';
	context.state.user = { is_target_audience: 1 };
	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.categoryQuestion || context.state.categoryQuestion === '').toBeFalsy();

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();
	await expect(context.state.categoryQuestion === 'quiz').toBeTruthy();
	await expect(context.state.currentQuestion.count_more === 10).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quiz.count1);

	await expect(context.state.currentQuestion.type === 'open_text').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ onTextQuiz: true });
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text);
	await expect(context.typingOff).toBeCalled();
});

it('answerQuizA - null question', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.categoryQuestion = 'quiz';
	context.state.user = { is_target_audience: 1 }; context.state.sentAnswer = { id: '1' };

	await quiz.answerQuizA(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect((!context.state.currentQuestion || context.state.currentQuestion.code === null) && (context.state.sentAnswer && !context.state.sentAnswer.form_error)).toBeTruthy();
	await expect(aux.sendTermos).toBeCalledWith(context);
});

it('AnswerExtraQuestion', async () => {
	const context = cont.quickReplyContext('extraQuestion0', 'beginQuiz');
	context.state.currentQuestion = questions.extraMultiple;
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
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.notFinished;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});

it('handleAnswerA - regular answer - finished but not target audience', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.finishedNotPart;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeFalsy();
	await expect((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
		|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});

it('handleAnswerA - regular answer - finished and target audience', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.finished;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0).toBeFalsy();

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeFalsy();
	await expect((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
		|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0)).toBeFalsy();
	await expect(aux.sendTermos).toBeCalledWith(context);
});

it('handleAnswerA - regular answer - is not target audience', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.finishedIsTarget;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'fun_questions' });

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
		|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0))).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});

it('handleAnswerA - regular answer - texto provisorio', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.halfway;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'fun_questions' });

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.textoProvisorio).toBeTruthy();
	await expect(aux.halfwayPointQuiz).toBeCalledWith(context);
});

it('handleAnswerA - internal error', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.serverError;
	const quizOpt = 'a resposta';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt,
		),
	});

	await expect(context.state.sentAnswer.error).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quiz.form_error);
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});

it('handleAnswerA - invalid value', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.invalidValue;
	const quizOpt = '19/19/19';
	await quiz.handleAnswerA(context);

	await expect(context.setState).toBeCalledWith({
		sentAnswer: await prepApi.postQuizAnswer(
			context.session.user.id, context.state.currentQuestion.code, quizOpt,
		),
	});
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quiz.invalid);
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuizA' });
});
