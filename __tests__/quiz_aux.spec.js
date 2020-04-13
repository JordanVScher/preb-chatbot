const cont = require('./context');
const questions = require('./question');
const aux = require('../app/utils/quiz_aux');

// jest.mock('../app/utils/helper');

describe('buildMultipleChoice', () => {
	it('"quiz" complement with no extra option', async () => {
		const complement = 'quiz';
		const question = questions.regularMultipleChoice;

		let result = await aux.buildMultipleChoice(question, complement);
		result = result.quick_replies;
		await expect(result.length === 2).toBeTruthy();

		await expect(result[0].title).toBe(question.multiple_choices[1]);
		await expect(result[0].payload).toBe(`${complement}${1}${question.code}`);
		await expect(result[1].title).toBe(question.multiple_choices[2]);
		await expect(result[1].payload).toBe(`${complement}${2}${question.code}`);
	});

	it('"triagemQuiz" complement with extra option', async () => {
		const complement = 'triagemQuiz';
		const question = questions.extraMultiple;

		let result = await aux.buildMultipleChoice(question, complement);
		result = result.quick_replies;
		await expect(result.length === 3).toBeTruthy();

		await expect(result[0].title).toBe(question.multiple_choices[1]);
		await expect(result[0].payload).toBe(`${complement}${1}${question.code}`);
		await expect(result[1].title).toBe(question.multiple_choices[2]);
		await expect(result[1].payload).toBe(`${complement}${2}${question.code}`);
		await expect(result[2].title).toBe(question.extra_quick_replies[0].label);
		await expect(result[2].payload).toBe('extraQuestion0');
	});
});

describe('sendQuizQuestion', () => {
	it('multiple_choice', async () => {
		const context = cont.quickReplyContext('startQuiz', 'startQuiz');
		context.state.categoryQuestion = 'publico_interesse';
		context.state.currentQuestion = questions.regularMultipleChoice;
		const prefix = 'quiz';

		await aux.sendQuizQuestion(context, prefix);

		await expect(context.state.currentQuestion.type === 'multiple_choice').toBeTruthy();
		await expect(context.setState).toBeCalledWith({ onButtonQuiz: true });
		await expect(context.setState).toBeCalledWith({ buttonsFull: await aux.buildMultipleChoice(context.state.currentQuestion, 'quiz') });
		await expect(context.setState).toBeCalledWith({ buttonTexts: await aux.getButtonTextList(context.state.buttonsFull) });
		await expect(context.sendText).toBeCalledWith(context.state.quizText, context.state.buttonsFull);
	});

	it('open_text', async () => {
		const context = cont.quickReplyContext('startQuiz', 'startQuiz');
		context.state.categoryQuestion = 'publico_interesse';
		context.state.currentQuestion = questions.regularOpenText;
		const prefix = 'quiz';

		await aux.sendQuizQuestion(context, prefix);

		await expect(context.state.currentQuestion.type === 'open_text').toBeTruthy();
		await expect(context.setState).toBeCalledWith({ onTextQuiz: true });
		await expect(context.sendText).toBeCalledWith(context.state.quizText);
	});
});

describe('buildQuizText', () => {
	it('local - shows code', async () => {
		const currentQuestion = questions.regularOpenText;

		const res = await aux.buildQuizText(currentQuestion.text, currentQuestion.code, 'local');

		await expect(res.includes(currentQuestion.text)).toBeTruthy();
		await expect(res.includes(currentQuestion.code)).toBeTruthy();
	});

	it('not local - dont show code', async () => {
		const currentQuestion = questions.regularOpenText;

		const res = await aux.buildQuizText(currentQuestion.text, currentQuestion.code, 'prod');

		await expect(res.includes(currentQuestion.text)).toBeTruthy();
		await expect(res.includes(currentQuestion.code)).toBeFalsy();
	});
});
