require('dotenv').config();

const cont = require('./context');
const questions = require('./question');
const aux = require('../app/utils/quiz_aux');
const research = require('../app/utils/research');
const { capQR } = require('../app/utils/helper');

jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/research');
jest.mock('../app/utils/helper');

it('handleFlags - both true', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	const response = questions.finished;
	await aux.handleFlags(context, response);

	await expect(response.is_eligible_for_research && response.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ is_eligible_for_research: true });

	await expect(response.is_part_of_research && response.is_part_of_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ is_part_of_research: true });
});

it('handleFlags - one false, one null', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	const response = questions.handleAnswer;
	await aux.handleFlags(context, response);

	await expect(response.is_eligible_for_research && response.is_eligible_for_research === 1).toBeFalsy();
	await expect(response.is_eligible_for_research === 0).toBeTruthy();

	await expect(response.is_part_of_research && response.is_part_of_research === 1).toBeFalsy();
	await expect(response.is_part_of_research === 0).toBeFalsy();
});

it('endQuizA - notEligible', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await aux.endQuizA(context);

	await expect(context.setState).toBeCalledWith({ finished_quiz: true });
	await expect(context.state.is_eligible_for_research === true).toBeFalsy();
	await expect(research.notEligible).toBeCalledWith(context);
});

it('endQuizA - researchSaidNo', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.is_eligible_for_research = true;
	await aux.endQuizA(context);

	await expect(context.setState).toBeCalledWith({ finished_quiz: true });
	await expect(context.state.is_eligible_for_research === true).toBeTruthy();
	await expect(context.state.is_part_of_research === true).toBeFalsy();
	await expect(research.researchSaidNo).toBeCalledWith(context);
});

it('endQuizA - researchSaidYes', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.is_eligible_for_research = true;
	context.state.is_part_of_research = true;
	await aux.endQuizA(context);

	await expect(context.setState).toBeCalledWith({ finished_quiz: true });
	await expect(context.state.is_eligible_for_research === true).toBeTruthy();
	await expect(context.state.is_part_of_research === true).toBeTruthy();
	await expect(research.researchSaidYes).toBeCalledWith(context);
});

it('buildMultipleChoice - no extra option', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	const qrButtons = [];
	const question = questions.regularMultipleChoice;
	await aux.endQuizA(context);

	Object.keys(question.multiple_choices).forEach(async (element) => {
		await expect(qrButtons.push).toBeCalledWith({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `quiz${element}` });
	});

	await expect(question.extra_quick_replies && question.extra_quick_replies.length > 0).toBeFalsy();
});

it('buildMultipleChoice - extra option', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	const qrButtons = [];
	const question = questions.extraMultiple;
	await aux.endQuizA(context);

	Object.keys(question.multiple_choices).forEach(async (element) => {
		await expect(qrButtons.push).toBeCalledWith({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `quiz${element}` });
	});

	await expect(question.extra_quick_replies && question.extra_quick_replies.length > 0).toBeTruthy();
	question.extra_quick_replies.forEach(async (element, index) => {
		await expect(qrButtons.push).toBeCalledWith({ content_type: 'text', title: await capQR(element.label), payload: `extraQuestion${index}` });
	});
});

it('handleAC5 - not AC5', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.regularMultipleChoice;
	await aux.endQuizA(context);

	await expect(context.state.currentQuestion.code === 'AC5').toBeFalsy();
});

it('handleAC5 - AC5 and is_eligible_for_research', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.extraMultiple;
	context.state.currentQuestion.is_eligible_for_research = 1;
	await aux.endQuizA(context);

	await expect(context.state.currentQuestion.code === 'AC5').toBeTruthy();
	await expect(context.state.currentQuestion.is_eligible_for_research === 1).toBeTruthy();
	// await expect(research.onTheResearch).toBeCalledWith(context);
});

it('handleAC5 - AC5 and NOT is_eligible_for_research', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.currentQuestion = questions.extraMultiple;
	context.state.currentQuestion.is_eligible_for_research = 0;
	await aux.endQuizA(context);

	await expect(context.state.currentQuestion.code === 'AC5').toBeTruthy();
	await expect(context.state.currentQuestion.is_eligible_for_research === 1).toBeFalsy();
	// await expect(research.notOnResearch).toBeCalledWith(context);
});
