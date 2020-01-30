const cont = require('./context');
const questions = require('./question');
const aux = require('../app/utils/quiz_aux');
const opt = require('../app/utils/options');
const flow = require('../app/utils/flow');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/mainMenu');

it('buildMultipleChoice - quiz with no extra option', async () => {
	const complement = 'quiz';
	const question = questions.regularMultipleChoice;
	const result = await aux.buildMultipleChoice(question, complement);

	await expect(result.quick_replies.length === 2).toBeTruthy();
	await expect(result.quick_replies[0].title === questions.regularMultipleChoice.multiple_choices[1]).toBeTruthy();
	await expect(result.quick_replies[0].payload === `${complement}1${question.code}`).toBeTruthy();
	await expect(result.quick_replies[1].title === questions.regularMultipleChoice.multiple_choices[2]).toBeTruthy();
	await expect(result.quick_replies[1].payload === `${complement}2${question.code}`).toBeTruthy();
});

it('buildMultipleChoice - extra option', async () => {
	const complement = 'triagem';
	const question = questions.extraMultiple;
	const result = await aux.buildMultipleChoice(question, complement);

	await expect(result.quick_replies.length === 3).toBeTruthy();
	await expect(result.quick_replies[0].title === questions.extraMultiple.multiple_choices[1]).toBeTruthy();
	await expect(result.quick_replies[0].payload === `${complement}1${question.code}`).toBeTruthy();
	await expect(result.quick_replies[1].title === questions.extraMultiple.multiple_choices[2]).toBeTruthy();
	await expect(result.quick_replies[1].payload === `${complement}2${question.code}`).toBeTruthy();
	await expect(result.quick_replies[2].title === questions.extraMultiple.extra_quick_replies[0].label).toBeTruthy();
	await expect(result.quick_replies[2].payload === 'extraQuestion0').toBeTruthy();
});
