const cont = require('./context');
const questions = require('./question');
const quiz = require('../app/utils/quiz');
const flow = require('../app/utils/flow');
const aux = require('../app/utils/quiz_aux');
const prepApi = require('../app/utils/prep_api');
const { addCityLabel } = require('../app/utils/labels');

jest.mock('../app/utils/quiz_aux');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/labels');
jest.mock('../app/utils/helper');

describe('answerQuiz', async () => {
	it('no startedQuiz with empty startedQuiz - update startedQuiz and set categoryQuestion to "publico_interesse" before sending question', async () => {
		const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
		context.state.currentQuestion = questions.regularMultipleChoice;
		context.state.categoryQuestion = '';
		await quiz.answerQuiz(context);

		await expect(context.setState).toBeCalledWith({ startedQuiz: true });
		await expect(context.setState).toBeCalledWith({ categoryQuestion: 'publico_interesse' });
		await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
		await expect(aux.sendQuizQuestion).toBeCalledWith(context, 'quiz');
	});
});

describe('answerQuiz', async () => {
	it('startedQuiz and category is already filled - load and send the question', async () => {
		const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
		context.state.currentQuestion = questions.regularMultipleChoice;
		context.state.categoryQuestion = 'fun_questions';
		context.state.startedQuiz = true;
		await quiz.answerQuiz(context);

		await expect(context.setState).not.toBeCalledWith({ startedQuiz: true });
		await expect(context.setState).not.toBeCalledWith({ categoryQuestion: 'publico_interesse' });
		await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
		await expect(aux.sendQuizQuestion).toBeCalledWith(context, 'quiz');
	});
});

it('AnswerExtraQuestion', async () => {
	const context = cont.quickReplyContext('extraQuestion0', 'beginQuiz');
	context.state.currentQuestion = questions.extraMultiple;
	const result = await quiz.AnswerExtraQuestion(context);

	await expect(result === questions.extraMultiple.extra_quick_replies[0].text).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(result);
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
});

it('handleAnswer', async () => {
	const context = cont.quickReplyContext('extraQuestion0', 'beginQuiz');
	context.state.currentQuestion = questions.extraMultiple;
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ onTextQuiz: false, onButtonQuiz: false });
	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, quizOpt) }); // eslint-disable-line
	await expect(context.sendText).toBeCalledWith(flow.quiz.form_error); // from handleQuizResposta, gets to the error because sentAnswer is null
});

describe('handleQuizResposta and sentAnswer', async () => {
	const quizOpt = '1';
	const context = cont.quickReplyContext('quiz0', 'beginQuiz');
	context.state.currentQuestion = questions.extraMultiple;

	it('null - error and try again', async () => {
		await quiz.handleQuizResposta(context, quizOpt);

		await expect(context.sendText).toBeCalledWith(flow.quiz.form_error);
		await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
	});

	it('error - error and try again', async () => {
		context.state.sentAnswer = questions.serverError;

		await quiz.handleQuizResposta(context, quizOpt);

		await expect(context.sendText).toBeCalledWith(flow.quiz.form_error);
		await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
	});

	it('invalid format - msg and try again', async () => {
		context.state.sentAnswer = questions.invalidValue;

		await quiz.handleQuizResposta(context, quizOpt);

		await expect(context.sendText).toBeCalledWith(flow.quiz.invalid);
		await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
	});

	it('A1 - Save city and keep going', async () => {
		context.state.sentAnswer = questions.regularMultipleChoice;
		context.state.currentQuestion.code = 'A1';
		await quiz.handleQuizResposta(context, quizOpt);

		await expect(addCityLabel).toBeCalledWith(context.session.user.id, quizOpt);
		await expect(aux.sendFollowUpMsgs).toBeCalledWith(context);
		await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
	});

	it('offline_pre_registration_form - Save registrationForm', async () => {
		context.state.sentAnswer = questions.regularMultipleChoice;
		context.state.sentAnswer.offline_pre_registration_form = 'foobar';
		context.state.currentQuestion.code = 'A2';
		await quiz.handleQuizResposta(context, quizOpt);

		await expect(aux.sendFollowUpMsgs).toBeCalledWith(context);
		await expect(context.setState).toBeCalledWith({ registrationForm: context.state.sentAnswer.offline_pre_registration_form });
		await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
	});

	it('Finished publico_interesse, is_target_audience false - go to brincadeira', async () => {
		context.state.categoryQuestion = 'publico_interesse';
		context.state.sentAnswer = { finished_quiz: 1, is_target_audience: 0 };

		await quiz.handleQuizResposta(context, quizOpt);
		await expect(aux.sendFollowUpMsgs).toBeCalledWith(context);
		await expect(context.setState).toBeCalledWith({ startedQuiz: false });
		await expect(context.setState).toBeCalledWith({ dialog: 'offerBrincadeira', publicoInteresseEnd: true, categoryQuestion: '' });
	});

	it('Finished publico_interesse, is_target_audience - go to oferta de pesquisa', async () => {
		context.state.categoryQuestion = 'publico_interesse';
		context.state.sentAnswer = { finished_quiz: 1, is_target_audience: 1 };

		await quiz.handleQuizResposta(context, quizOpt);
		await expect(aux.sendFollowUpMsgs).toBeCalledWith(context);
		await expect(context.setState).toBeCalledWith({ startedQuiz: false });
		await expect(context.setState).toBeCalledWith({ dialog: 'ofertaPesquisaStart', publicoInteresseEnd: true, categoryQuestion: '' });
	});

	it('Finished quiz_brincadeira - go to preTCLE', async () => {
		context.state.categoryQuestion = 'quiz_brincadeira';
		context.state.sentAnswer = { finished_quiz: 1 };

		await quiz.handleQuizResposta(context, quizOpt);
		await expect(aux.sendFollowUpMsgs).toBeCalledWith(context);
		await expect(context.setState).toBeCalledWith({ startedQuiz: false });
		await expect(context.setState).toBeCalledWith({ dialog: 'preTCLE', quizBrincadeiraEnd: true, categoryQuestion: '' });
	});

	it('Finished quiz_brincadeira - go to preTCLE', async () => {
		context.state.categoryQuestion = 'recrutamento';
		context.state.sentAnswer = { finished_quiz: 1 };

		await quiz.handleQuizResposta(context, quizOpt);
		await expect(aux.sendFollowUpMsgs).toBeCalledWith(context);
		await expect(context.setState).toBeCalledWith({ startedQuiz: false });
		await expect(context.setState).toBeCalledWith({ dialog: 'preTCLE', recrutamentoEnd: true, categoryQuestion: '' });
	});
});
