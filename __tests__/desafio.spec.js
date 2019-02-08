const cont = require('./context');
const desafio = require('../app/utils/desafio');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
// const { checkAnsweredQuiz } = require('../app/utils/checkQR');
const prepApi = require('../app/utils/prep_api');
const { sendMain } = require('../app/utils/mainMenu');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');

it('desafioAceito', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await desafio.desafioAceito(context);

	await expect(context.sendText).toBeCalledWith(flow.desafioAceito.text1, opt.desafioAceito);
});

it('desafioRecusado', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await desafio.desafioRecusado(context);

	await expect(context.sendText).toBeCalledWith(flow.desafioRecusado.text1);
	await expect(sendMain).toBeCalledWith(context);
});

it('asksDesafio - user finished quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { finished_quiz: 1 };
	await desafio.asksDesafio(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.finished_quiz === 1).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('asksDesafio - user didnt finished quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { finished_quiz: 0 };
	await desafio.asksDesafio(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.finished_quiz === 1).toBeFalsy();

	await expect(context.sendText).toBeCalledWith(flow.asksDesafio.text1);
	await expect(context.sendText).toBeCalledWith(flow.asksDesafio.text2, opt.asksDesafio);
});

it('followUp - counter equals 3', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.followUpCounter = 3;
	await desafio.followUp(context);

	await expect(context.state.followUpCounter >= 3).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('followUp - user already part on research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 1 };
	context.state.followUpCounter = 0;
	await desafio.followUp(context);

	await expect(context.state.followUpCounter >= 3).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ followUpCounter: context.state.followUpCounter >= 0 ? context.state.followUpCounter + 1 : 0 });

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('followUp - dont know if user is_eligible_for_research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0 };
	await desafio.followUp(context);

	await expect(context.state.followUpCounter >= 3).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ followUpCounter: context.state.followUpCounter >= 0 ? context.state.followUpCounter + 1 : 0 });

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.text1, opt.answer.sendQuiz);
});

it('followUp - user didnt finish quiz', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 0 };
	await desafio.followUp(context);

	await expect(context.state.followUpCounter >= 3).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ followUpCounter: context.state.followUpCounter >= 0 ? context.state.followUpCounter + 1 : 0 });

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.text1, opt.answer.sendQuiz);
});

it('followUp - user not eligible_for_research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 1 };
	await desafio.followUp(context);

	await expect(context.state.followUpCounter >= 3).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ followUpCounter: context.state.followUpCounter >= 0 ? context.state.followUpCounter + 1 : 0 });

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === null || context.state.user.finished_quiz === 0).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === 0).toBeTruthy();
	await expect(sendMain).toBeCalled();
});

it('followUp - user eligible_for_research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 1, finished_quiz: 1 };
	await desafio.followUp(context);

	await expect(context.state.followUpCounter >= 3).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ followUpCounter: context.state.followUpCounter >= 0 ? context.state.followUpCounter + 1 : 0 });

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === null || context.state.user.finished_quiz === 0).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.text2, opt.answer.sendResearch);
});
