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

it('asksDesafio - user started quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.startedQuiz = true;
	await desafio.asksDesafio(context);
	await expect(context.state.startedQuiz === true).toBeTruthy();
	await expect(mainMenu.sendMain).toBeCalledWith(context);
});

it('asksDesafio - user dindt start quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.startedQuiz = false;
	await desafio.asksDesafio(context);
	await expect(context.state.startedQuiz === true).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.asksDesafio.text1);
	await expect(context.sendText).toBeCalledWith(flow.asksDesafio.text2, opt.asksDesafio);
});

it('sendQuiz - count less than 3 - started quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.quizCounter = { count_quiz: 2 };
	context.state.startedQuiz = true;
	await desafio.sendQuiz(context);

	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
	await expect(context.state.startedQuiz === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.text1, opt.answer.sendQuiz);
});

it('sendQuiz - count less than 3 - didnt start quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.quizCounter = { count_quiz: 2 };
	context.state.startedQuiz = false;
	await desafio.sendQuiz(context);

	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
	await expect(context.state.startedQuiz === true).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.text3, opt.answer.sendQuiz);
});

it('sendQuiz - count 3 ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.quizCounter = { count_quiz: 3 };
	await desafio.sendQuiz(context);
	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalledWith(context);
});

it('sendResearch - count less than 3 ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.researchCounter = { count_invited_research: 2 };
	await desafio.sendResearch(context);

	await expect(context.setState).toBeCalledWith({ researchCounter: await prepApi.getCountResearch(context.session.user.id) });
	await expect(context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3).toBeFalsy();
	await expect(prepApi.postCountResearch).toBeCalledWith(context.session.user.id);
	await expect(context.sendText).toBeCalledWith(flow.desafio.text2, opt.answer.sendResearch);
});

it('sendResearch - count 3 ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.researchCounter = { count_invited_research: 3 };
	await desafio.sendResearch(context);

	await expect(context.setState).toBeCalledWith({ researchCounter: await prepApi.getCountResearch(context.session.user.id) });
	await expect(context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalledWith(context);
});

it('followUp - not target audience, didnt finish quiz', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_target_audience: 0 };
	context.state.currentQuestion = { code: 'A5' };
	await desafio.followUp(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

	await expect(context.state.user.is_target_audience === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(!context.state.currentQuestion || context.state.currentQuestion.code === null).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // sendQuiz
});

it('followUp - not target audience, finished quiz', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_target_audience: 0 };
	await desafio.followUp(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

	await expect(context.state.user.is_target_audience === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(!context.state.currentQuestion || context.state.currentQuestion.code === null).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalledWith(context);
});

it('followUp - user already part on research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 1, is_target_audience: 1 };
	await desafio.followUp(context);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalled();
});

// it('followUp - dont know if user is_eligible_for_research/user didnt start quiz', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 0 };
// 	context.state.quizCounter = { count_quiz: 0 };
// 	await desafio.followUp(context);

// 	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
// 	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

// 	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
// 	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });

// 	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
// 	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
// 	await expect(context.sendText).toBeCalledWith(flow.desafio.text3, opt.answer.sendQuiz);
// });

// it('followUp - user didnt finish quiz and counter less then 3 ', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 0 };
// 	context.state.quizCounter = { count_quiz: 0 };
// 	context.state.startedQuiz = true;
// 	await desafio.followUp(context);

// 	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
// 	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });

// 	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
// 	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
// 	await expect(context.sendText).toBeCalledWith(flow.desafio.text1, opt.answer.sendQuiz);
// });

// it('followUp - user didnt finish quiz and counter less then 3 ', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 0 };
// 	context.state.quizCounter = { count_quiz: 3 };
// 	await desafio.followUp(context);

// 	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
// 	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
// 	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeTruthy();
// 	await expect(mainMenu.sendShareAndMenu).toBeCalled();
// });

// it('followUp - user not eligible_for_research', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 1 };
// 	await desafio.followUp(context);

// 	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
// 	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

// 	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
// 	await expect(context.state.user.is_eligible_for_research === null || context.state.user.finished_quiz === 0).toBeFalsy();
// 	await expect(context.state.user.is_eligible_for_research === 0).toBeTruthy();
// 	await expect(mainMenu.sendShareAndMenu).toBeCalled();
// });

// it('followUp - user eligible_for_research', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 1, finished_quiz: 1 };
// 	await desafio.followUp(context);

// 	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
// 	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

// 	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
// 	await expect(context.state.user.is_eligible_for_research === null || context.state.user.finished_quiz === 0).toBeFalsy();
// 	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();

// 	await expect(context.setState).toBeCalledWith({ researchCounter: await prepApi.getCountResearch(context.session.user.id) });
// 	await expect(context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3).toBeFalsy();
// 	await expect(prepApi.postCountResearch).toBeCalledWith(context.session.user.id);
// 	await expect(context.sendText).toBeCalledWith(flow.desafio.text2, opt.answer.sendResearch);
// });

// // most of followUpIntent should be the same as followUp (tested above), below we are testing only the differences
// it('followUpIntent - test serviço', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 0, is_eligible_for_research: 1, finished_quiz: 0 };
// 	context.state.intentType = 'serviço';
// 	await desafio.followUpIntent(context);

// 	const separateIntent = jest.fn();
// 	await expect(context.setState).toBeCalledWith({ intentType: await separateIntent(context.state.intentName) });
// 	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
// 	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });

// 	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
// 	await expect(context.state.intentType === 'serviço').toBeTruthy();
// 	await expect(context.sendText).toBeCalledWith('Melhor ir em um posto de saúde mais próximo de você');
// 	await expect(!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // follows sendQuiz
// });

// it('followUpIntent - serviço and prep', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 1, is_prep: 1 };
// 	context.state.intentType = 'serviço';
// 	await desafio.followUpIntent(context);

// 	await expect(context.state.user.is_part_of_research === 1).toBeTruthy(); // checkAconselhamento
// 	await expect(context.state.intentType === 'duvida').toBeFalsy();
// 	await expect(context.state.user.is_prep === 0).toBeFalsy();

// 	await expect(context.sendText).toBeCalledWith('Bb, vou te fazer umas perguntinhas para te ajudar melhor.');
// 	await expect(context.sendText).toBeCalledWith('<Fluxo triagem> a fazer');
// 	await expect(context.setState).toBeCalledWith({ dialog: 'triagem' });
// });

// it('followUpIntent - serviço and NOT prep and NO consultas', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 1, is_prep: 0 };
// 	context.state.intentType = 'serviço';
// 	await desafio.followUpIntent(context);

// 	await expect(context.state.user.is_part_of_research === 1).toBeTruthy(); // checkAconselhamento
// 	await expect(context.state.intentType === 'duvida').toBeFalsy();
// 	await expect(context.state.user.is_prep === 0).toBeTruthy();

// 	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) }); // sendConsulta
// 	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeFalsy();
// 	await expect(context.sendText).toBeCalledWith('Percebi que você não tem uma consulta.\nVamos marcar?', opt.answer.sendConsulta);
// });

// it('followUpIntent - serviço and NOT prep and one consulta', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 1, is_prep: 0 };
// 	context.state.consultas = { appointments: [{ datetime_start: '' }] };
// 	context.state.intentType = 'serviço';
// 	await desafio.followUpIntent(context);

// 	await expect(context.state.user.is_part_of_research === 1).toBeTruthy(); // checkAconselhamento
// 	await expect(context.state.intentType === 'duvida').toBeFalsy();
// 	await expect(context.state.user.is_prep === 0).toBeTruthy();

// 	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) }); // sendConsulta
// 	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeTruthy();
// 	await expect(context.sendText).toBeCalled();
// 	await expect(context.sendText).toBeCalledWith('<informações dos CTAs>');
// 	await expect(mainMenu.sendMain).toBeCalledWith(context);
// });

// it('followUpIntent - duvida and prep', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 1, is_prep: 1 };
// 	context.state.intentType = 'duvida';
// 	await desafio.followUpIntent(context);

// 	await expect(context.state.user.is_part_of_research === 1).toBeTruthy(); // checkAconselhamento
// 	await expect(context.state.intentType === 'duvida').toBeTruthy();
// 	await expect(context.state.user.is_prep === 0).toBeFalsy();

// 	await expect(mainMenu.sendShareAndMenu).toBeCalled();
// });
// it('followUpIntent - duvida and NOT prep', async () => {
// 	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
// 	context.state.user = { is_part_of_research: 1, is_prep: 0 };
// 	context.state.intentType = 'duvida';
// 	await desafio.followUpIntent(context);

// 	await expect(context.state.user.is_part_of_research === 1).toBeTruthy(); // checkAconselhamento
// 	await expect(context.state.intentType === 'duvida').toBeTruthy();
// 	await expect(context.state.user.is_prep === 0).toBeTruthy();

// 	await expect(context.sendText).toBeCalledWith('Agora que já respondi suas dúvidas, topa responder algumas perguntinhas para ver se tem mais alguma coisa que eu possa te ajudar?', opt.answer.isPrep);
// });
