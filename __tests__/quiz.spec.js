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

it('answerQuiz - multiple choice - empty category', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.regularMultipleChoice; context.state.categoryQuestion = '';
	await quiz.answerQuiz(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.categoryQuestion || context.state.categoryQuestion === '').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'quiz' });
	context.state.categoryQuestion = 'quiz'; // change quiz value
	await quiz.answerQuiz(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();

	await expect(context.state.currentQuestion.type === 'multiple_choice').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion));
	await expect(context.typingOff).toBeCalled();
});

it('answerQuiz - multiple choice - fun_questions', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.regularMultipleChoice; context.state.categoryQuestion = 'fun_questions';
	await quiz.answerQuiz(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.categoryQuestion || context.state.categoryQuestion === '').toBeFalsy();

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();

	await expect(context.state.currentQuestion.type === 'multiple_choice').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text, await aux.buildMultipleChoice(context.state.currentQuestion));
	await expect(context.typingOff).toBeCalled();
});

it('answerQuiz - open text - quiz category', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.regularOpenText; context.state.categoryQuestion = 'quiz';
	await quiz.answerQuiz(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.typingOn).toBeCalled();
	await expect(!context.state.categoryQuestion || context.state.categoryQuestion === '').toBeFalsy();

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code === null).toBeFalsy();

	await expect(context.state.currentQuestion.type === 'open_text').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ onTextQuiz: true });
	await expect(context.sendText).toBeCalledWith(context.state.currentQuestion.text);
	await expect(context.typingOff).toBeCalled();
});

it('answerQuiz - null question', async () => {
	const context = cont.quickReplyContext('desafioAceito', 'beginQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.categoryQuestion = 'quiz';
	context.state.sentAnswer = { id: '1' };

	await quiz.answerQuiz(context);

	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect((!context.state.currentQuestion || context.state.currentQuestion.code === null) && (context.state.sentAnswer && !context.state.sentAnswer.form_error)).toBeTruthy();
	await expect(aux.sendTermos).toBeCalledWith(context);
});

it('AnswerExtraQuestion', async () => {
	const context = cont.quickReplyContext('extraQuestion0', 'beginQuiz');
	context.state.currentQuestion = questions.extraMultiple;
	const result = await quiz.AnswerExtraQuestion(context);

	await expect(result === questions.extraMultiple.extra_quick_replies[0].text).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(result);
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
});

it('handleAnswer - regular answer - not finished', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.notFinished;
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
});

it('handleAnswer - regular answer - finished but not target audience', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.finishedNotPart;
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeFalsy();
	await expect((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
		|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0)).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
});

it('handleAnswer - regular answer - finished and target audience', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.finished;
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });

	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0).toBeFalsy();


	await expect(context.state.sentAnswer.error).toBeFalsy();

	await expect(context.state.sentAnswer.offline_pre_registration_form).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ registrationForm: context.state.sentAnswer.offline_pre_registration_form });

	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.finished_quiz === 0).toBeFalsy();
	await expect((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
		|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0)).toBeFalsy();
	await expect(aux.sendTermos).toBeCalledWith(context);
});

it('handleAnswer - regular answer - is not target audience', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.finishedIsTarget;
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'fun_questions' });

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeFalsy();
	await expect(((context.state.sentAnswer.finished_quiz === 1 && context.state.sentAnswer.is_target_audience === 0)
		|| (!context.state.sentAnswer.finished_quiz && context.state.user.is_target_audience === 0))).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
});

it('handleAnswer - regular answer - followup_messages', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.halfway;
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'fun_questions' });

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.followup_messages).toBeTruthy();
	// loop
	await expect(context.state.sentAnswer.followup_messages[0].includes('.png')).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ resultImageUrl: context.state.sentAnswer.followup_messages[0] });
	await expect(context.state.currentQuestion.code === 'AC7').toBeFalsy();

	await expect(context.sendText).toBeCalledWith(context.state.sentAnswer.followup_messages[1]);
	await expect(context.sendText).toBeCalledWith(context.state.sentAnswer.followup_messages[2]);
});

it('handleAnswer - regular answer - followup_messages on AC7', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.halfway;
	context.state.currentQuestion.code = 'AC7';
	context.state.resultImageUrl = questions.halfway.followup_messages[0]; // eslint-disable-line
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });
	await expect(context.state.sentAnswer && context.state.sentAnswer.is_target_audience === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'fun_questions' });

	await expect(context.state.sentAnswer.followup_messages).toBeTruthy();
	// loop
	await expect(context.state.sentAnswer.followup_messages[0].includes('.png')).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ resultImageUrl: context.state.sentAnswer.followup_messages[0] });
	await expect(context.state.currentQuestion.code === 'AC7').toBeTruthy();
	await expect(context.state.resultImageUrl && context.state.resultImageUrl.length > 0).toBeTruthy();
	await expect(context.sendImage).toBeCalledWith(context.state.resultImageUrl);
	await expect(context.setState).toBeCalledWith({ resultImageUrl: '' });

	await expect(context.sendText).toBeCalledWith(context.state.sentAnswer.followup_messages[1]);
	await expect(context.sendText).toBeCalledWith(context.state.sentAnswer.followup_messages[2]);
});

it('handleAnswer - regular answer - saving city', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion; context.state.sentAnswer = questions.notFinished;
	context.state.currentQuestion.code = 'A1';
	const quizOpt = '1';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.state.currentQuestion.code === 'A1').toBeTruthy();
	await expect(addCityLabel).toBeCalledWith(context.session.user.id, quizOpt);
});

it('handleAnswer - onHalfwayPoint - second option', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.onHalfwayPoint; context.state.sentAnswer = questions.halfway;
	const quizOpt = '2';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });

	await expect(context.state.sentAnswer.error).toBeFalsy();
	await expect(context.state.sentAnswer.followup_messages).toBeTruthy();
	await expect(context.state.currentQuestion.code === 'AC8' && quizOpt.toString() === '2').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'stopHalfway' });
});

it('handleAnswer - internal error', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.serverError;
	const quizOpt = 'a resposta';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });

	await expect(context.state.sentAnswer.error || !context.state.sentAnswer).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quiz.form_error);
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
});

it('handleAnswer - invalid value', async () => {
	const context = cont.quickReplyContext('quiz1', 'answerQuiz');
	context.state.currentQuestion = questions.nullQuestion;
	context.state.sentAnswer = questions.invalidValue;
	const quizOpt = '19/19/19';
	await quiz.handleAnswer(context, quizOpt);

	await expect(context.setState).toBeCalledWith({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.currentQuestion.code, quizOpt) });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false });

	await expect(context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quiz.invalid);
	await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
});
