require('dotenv').config();

const cont = require('./context');
const questions = require('./question');
const aux = require('../app/utils/quiz_aux');
const opt = require('../app/utils/options');
const flow = require('../app/utils/flow');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/mainMenu');

it('sendTermos - is_eligible_for_research', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_eligible_for_research: 1 };
	await aux.sendTermos(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' });
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();

	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text1);
	await expect(context.sendImage).toBeCalledWith(flow.onTheResearch.gif);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text2);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text3);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.extra, opt.saberMais);
});

it('sendTermos - not eligible_for_research', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_eligible_for_research: 0 };
	await aux.sendTermos(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' });
	await expect(context.state.user.is_eligible_for_research === 1).toBeFalsy();

	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text2);
	await expect(context.sendText).toBeCalledWith(flow.quizYes.text15);
	await expect(context.sendButtonTemplate).toBeCalledWith(flow.onTheResearch.buildTermos, opt.TCLE);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.saidYes, opt.termos2);
});

it('buildMultipleChoice - quiz with no extra option', async () => {
	const complement = 'quiz';
	const question = questions.regularMultipleChoice;
	const result = await aux.buildMultipleChoice(question, complement);

	await expect(result.quick_replies.length === 2).toBeTruthy();
	await expect(result.quick_replies[0].title === questions.regularMultipleChoice.multiple_choices[1]).toBeTruthy();
	await expect(result.quick_replies[0].payload === `${complement}1`).toBeTruthy();
	await expect(result.quick_replies[1].title === questions.regularMultipleChoice.multiple_choices[2]).toBeTruthy();
	await expect(result.quick_replies[1].payload === `${complement}2`).toBeTruthy();
});

it('buildMultipleChoice - extra option', async () => {
	const complement = 'triagem';
	const question = questions.extraMultiple;
	const result = await aux.buildMultipleChoice(question, complement);

	await expect(result.quick_replies.length === 3).toBeTruthy();
	await expect(result.quick_replies[0].title === questions.extraMultiple.multiple_choices[1]).toBeTruthy();
	await expect(result.quick_replies[0].payload === `${complement}1`).toBeTruthy();
	await expect(result.quick_replies[1].title === questions.extraMultiple.multiple_choices[2]).toBeTruthy();
	await expect(result.quick_replies[1].payload === `${complement}2`).toBeTruthy();
	await expect(result.quick_replies[2].title === questions.extraMultiple.extra_quick_replies[0].label).toBeTruthy();
	await expect(result.quick_replies[2].payload === 'extraQuestion0').toBeTruthy();
});

// it('endTriagem - suggest_wait_for_test', async () => {
// 	const context = cont.quickReplyContext('0', 'prompt');
// 	context.state.sentAnswer = { suggest_wait_for_test: 1, go_to_test: 1 };
// 	await aux.endTriagem(context);

// 	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ suggestWaitForTest: true });
// 	await expect(context.setState).toBeCalledWith({ dialog: 'autoTeste' });
// });

// it('endTriagem - emergency_rerouting', async () => {
// 	const context = cont.quickReplyContext('0', 'prompt');
// 	context.state.sentAnswer = { emergency_rerouting: 1 };
// 	await aux.endTriagem(context);

// 	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1).toBeTruthy();
// 	await expect(context.sendText).toBeCalledWith(flow.triagem.emergency1);
// 	await expect(context.sendText).toBeCalledWith(await help.buildPhoneMsg(context.state.user.city, 'Telefones pra contato:'));
// 	await expect(sendMain).toBeCalledWith(context);
// });

// it('endTriagem - go_to_test', async () => {
// 	const context = cont.quickReplyContext('0', 'prompt');
// 	context.state.sentAnswer = { go_to_test: 1 };
// 	await aux.endTriagem(context);

// 	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ dialog: 'autoTeste' });
// });

// it('endTriagem - go_to_appointment', async () => {
// 	const context = cont.quickReplyContext('0', 'prompt');
// 	context.state.sentAnswer = { go_to_appointment: 1 };
// 	await aux.endTriagem(context);

// 	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ dialog: 'checarConsulta' });
// });

// it('endTriagem - suggest_appointment', async () => {
// 	const context = cont.quickReplyContext('0', 'prompt');
// 	context.state.sentAnswer = { suggest_appointment: 1 };
// 	await aux.endTriagem(context);

// 	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1).toBeTruthy();
// 	await expect(context.sendText).toBeCalledWith(flow.triagem.suggest, opt.triagem1);
// 	await context.sendText(flow.triagem.suggest, opt.triagem1);
// });

// it('endTriagem - default case', async () => {
// 	const context = cont.quickReplyContext('0', 'prompt');
// 	await aux.endTriagem(context);

// 	await expect(context.setState).toBeCalledWith({ dialog: 'endTriagem' });
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1).toBeFalsy();
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1).toBeFalsy();
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1).toBeFalsy();
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1).toBeFalsy();
// 	await expect(context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1).toBeFalsy();

// 	await expect(sendMain).toBeCalledWith(context);
// });
