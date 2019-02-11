require('dotenv').config();

const cont = require('./context');
const desafio = require('../app/utils/desafio');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
// const { checkAnsweredQuiz } = require('../app/utils/checkQR');
const prepApi = require('../app/utils/prep_api');
const mainMenu = require('../app/utils/mainMenu');
// const help = require('../app/utils/helper');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');
// jest.mock('../app/utils/helper');

it('desafioAceito', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await desafio.desafioAceito(context);

	await expect(context.sendText).toBeCalledWith(flow.desafioAceito.text1, opt.desafioAceito);
});

it('desafioRecusado', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await desafio.desafioRecusado(context);

	await expect(context.sendText).toBeCalledWith(flow.desafioRecusado.text1);
	await expect(mainMenu.sendMain).toBeCalledWith(context);
});

it('asksDesafio - user finished quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { finished_quiz: 1 };
	await desafio.asksDesafio(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.finished_quiz === 1).toBeTruthy();
	await expect(mainMenu.sendMain).toBeCalledWith(context);
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

it('followUp - user already part on research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 1 };
	await desafio.followUp(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalled();
});

it('followUp - dont know if user is_eligible_for_research/user didnt start quiz', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0 };
	context.state.quizCounter = { count_quiz: 0 };
	await desafio.followUp(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });

	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
	await expect(context.sendText).toBeCalledWith(flow.desafio.text3, opt.answer.sendQuiz);
});

it('followUp - user didnt finish quiz and counter less then 3 ', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 0 };
	context.state.quizCounter = { count_quiz: 0 };
	context.state.startedQuiz = true;
	await desafio.followUp(context);

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });

	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
	await expect(context.sendText).toBeCalledWith(flow.desafio.text1, opt.answer.sendQuiz);
});

it('followUp - user didnt finish quiz and counter less then 3 ', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 0 };
	context.state.quizCounter = { count_quiz: 3 };
	await desafio.followUp(context);

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalled();
});

it('followUp - user not eligible_for_research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 1 };
	await desafio.followUp(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === null || context.state.user.finished_quiz === 0).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === 0).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalled();
});

it('followUp - user eligible_for_research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 1, finished_quiz: 1 };
	await desafio.followUp(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === null || context.state.user.finished_quiz === 0).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();

	await expect(context.setState).toBeCalledWith({ researchCounter: await prepApi.getCountResearch(context.session.user.id) });
	await expect(context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3).toBeFalsy();
	await expect(prepApi.postCountResearch).toBeCalledWith(context.session.user.id);
	await expect(context.sendText).toBeCalledWith(flow.desafio.text2, opt.answer.sendResearch);
});
