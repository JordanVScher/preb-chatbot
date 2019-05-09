require('dotenv').config();

const cont = require('./context');
const questions = require('./question');
const aux = require('../app/utils/quiz_aux');
const opt = require('../app/utils/options');
const flow = require('../app/utils/flow');
const help = require('../app/utils/helper');
const prepApi = require('../app/utils/prep_api');
const research = require('../app/utils/research');
const { capQR } = require('../app/utils/helper');
const { sendMain } = require('../app/utils/mainMenu');

jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/research');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/mainMenu');

it('endQuiz - not target audience', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_target_audience: 0 };
	await aux.endQuiz(context, prepApi);


	await expect(context.setState).toBeCalledWith({ categoryQuestion: '' });
	await expect(context.state.user.is_target_audience === 0).toBeTruthy();
	await expect(research.notPart).toBeCalledWith(context);
});

it('endQuiz - target audience and not eligible', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_target_audience: 1, is_eligible_for_research: 0 };
	await aux.endQuiz(context, prepApi);

	await expect(context.setState).toBeCalledWith({ categoryQuestion: '' });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeFalsy();
	await expect(research.notEligible).toBeCalledWith(context);
});

it('endQuiz - target audience and eligible', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_target_audience: 1, is_eligible_for_research: 1 };
	await aux.endQuiz(context, prepApi);

	await expect(context.setState).toBeCalledWith({ categoryQuestion: '' });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(research.onTheResearch).toBeCalledWith(context);
});

module.exports.sendTermos = async (context) => {
	await context.setState({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' }); // clean up the category, so that next time the user can answer the quiz properly
	if (context.state.user.is_eligible_for_research === 1) {
		await context.sendText(flow.onTheResearch.text1);
		await context.sendImage(flow.onTheResearch.gif);
	}
	await context.sendText(flow.quizYes.text15);
	await context.sendButtonTemplate(flow.onTheResearch.buildTermos, opt.TCLE);
	await context.sendText(flow.onTheResearch.saidYes, opt.termos);
};

it('sendTermos - is_eligible_for_research', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_eligible_for_research: 1 };
	await aux.sendTermos(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' });

	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text1);
	await expect(context.sendImage).toBeCalledWith(flow.onTheResearch.gif);

	await expect(context.sendText).toBeCalledWith(flow.quizYes.text15);
	await expect(context.sendButtonTemplate).toBeCalledWith(flow.onTheResearch.buildTermos, opt.TCLE);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.saidYes, opt.termos);
});

it('sendTermos - not eligible_for_research', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_eligible_for_research: 0 };
	await aux.sendTermos(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' });

	await expect(context.state.user.is_eligible_for_research === 1).toBeFalsy();

	await expect(context.sendText).toBeCalledWith(flow.quizYes.text15);
	await expect(context.sendButtonTemplate).toBeCalledWith(flow.onTheResearch.buildTermos, opt.TCLE);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.saidYes, opt.termos);
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

it('endTriagem - suggest_wait_for_test', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { suggest_wait_for_test: 1, go_to_test: 1 };
	await aux.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ suggestWaitForTest: true });
	await expect(context.setState).toBeCalledWith({ dialog: 'autoTeste' });
});

it('endTriagem - emergency_rerouting', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { emergency_rerouting: 1 };
	await aux.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.triagem.emergency1);
	await expect(context.sendText).toBeCalledWith(await help.buildPhoneMsg(context.state.user.city, 'Telefones pra contato:'));
	await expect(sendMain).toBeCalledWith(context);
});

it('endTriagem - go_to_test', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { go_to_test: 1 };
	await aux.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'autoTeste' });
});

it('endTriagem - go_to_appointment', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { go_to_appointment: 1 };
	await aux.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'checarConsulta' });
});

it('endTriagem - suggest_appointment', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.sentAnswer = { suggest_appointment: 1 };
	await aux.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.triagem.suggest, opt.triagem1);
	await context.sendText(flow.triagem.suggest, opt.triagem1);
});

it('endTriagem - default case', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await aux.endTriagem(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1).toBeFalsy();
	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1).toBeFalsy();

	await expect(sendMain).toBeCalledWith(context);
});
