require('dotenv').config();

const cont = require('./context');
const aux = require('../app/utils/quiz_aux');
const prepApi = require('../app/utils/prep_api');
const research = require('../app/utils/research');
const { capQR } = require('../app/utils/helper');
const questions = require('./question');

jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/research');
jest.mock('../app/utils/helper');

it('endQuizA - not target audience', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_target_audience: 0 };
	await aux.endQuizA(context, prepApi);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 0).toBeTruthy();
	await expect(research.notPart).toBeCalledWith(context);
});

it('endQuizA - is_eligible_for_research - said yes', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_target_audience: 1, is_eligible_for_research: 1, is_part_of_research: 1 };
	await aux.endQuizA(context, prepApi);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(research.researchSaidYes).toBeCalledWith(context);
});

it('endQuizA - is_eligible_for_research - said no', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_target_audience: 1, is_eligible_for_research: 1, is_part_of_research: 0 };
	await aux.endQuizA(context, prepApi);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(research.researchSaidNo).toBeCalledWith(context);
});

it('endQuizA - not eligible', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_target_audience: 1, is_eligible_for_research: 0 };
	await aux.endQuizA(context, prepApi);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeFalsy();
	await expect(research.notEligible).toBeCalledWith(context);
});

it('buildMultipleChoice - no extra option', async () => {
	const qrButtons = [];
	const complement = 'quiz';
	const question = questions.regularMultipleChoice;
	await aux.buildMultipleChoice(question, complement);

	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `${complement}${element}` });
	});

	await expect(question.extra_quick_replies && question.extra_quick_replies.length > 0).toBeFalsy();
	await expect(qrButtons && qrButtons.length === 2).toBeTruthy();
});

it('buildMultipleChoice - extra option', async () => {
	const qrButtons = [];
	const complement = 'triagem';
	const question = questions.extraMultiple;
	await aux.buildMultipleChoice(question, complement);

	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `${complement}${element}` });
	});

	await expect(question.extra_quick_replies && question.extra_quick_replies.length > 0).toBeTruthy();
	question.extra_quick_replies.forEach(async (element, index) => {
		qrButtons.push({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `extraQuestion${index}` });
	});

	await expect(qrButtons && qrButtons.length === 4).toBeTruthy();
});
