require('dotenv').config();

const cont = require('./context');
const desafio = require('../app/utils/desafio');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
// const { checkAnsweredQuiz } = require('../app/utils/checkQR');
const prepApi = require('../app/utils/prep_api');
const mainMenu = require('../app/utils/mainMenu');
const help = require('../app/utils/helper');
const { sendCarouselSus } = require('../app/utils/carousel');
const triagem = require('../app/utils/triagem');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/carousel');
jest.mock('../app/utils/triagem');

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

it('sendQuiz - count less than 3 - started quiz', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.quizCounter = { count_quiz: 2 };
	context.state.startedQuiz = true;
	await desafio.sendQuiz(context);


	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'quiz' });
	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
	await expect(context.state.startedQuiz === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.desafio.text1, opt.answer.sendQuiz);
});

// it('sendQuiz - count less than 3 - started quiz - stoppedHalfway', async () => {
// 	const context = cont.quickReplyContext('0', 'prompt');
// 	context.state.quizCounter = { count_quiz: 2 };
// 	context.state.startedQuiz = true; context.state.stoppedHalfway = true;
// 	await desafio.sendQuiz(context);

// 	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
// 	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'quiz' });
// 	await expect(context.state.quizCounter && context.state.quizCounter.count_quiz >= 3).toBeFalsy();
// 	await expect(prepApi.postCountQuiz).toBeCalledWith(context.session.user.id);
// 	await expect(context.state.startedQuiz === true).toBeTruthy();
// 	await expect(context.state.stoppedHalfway === true).toBeTruthy();
// 	await expect(context.sendText).toBeCalledWith(flow.desafio.text4, opt.answer.sendQuiz);
// });

it('sendQuiz - count less than 3 - didnt start quiz', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.quizCounter = { count_quiz: 2 };
	context.state.startedQuiz = false;
	await desafio.sendQuiz(context);

	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) });
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'quiz' });
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
	await expect(context.setState).toBeCalledWith({ categoryQuestion: 'quiz' });
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
	await expect(context.sendText).toBeCalledWith(flow.desafio.text4, opt.answer.sendResearch);
});

it('sendResearch - count 3 ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.researchCounter = { count_invited_research: 3 };
	await desafio.sendResearch(context);

	await expect(context.setState).toBeCalledWith({ researchCounter: await prepApi.getCountResearch(context.session.user.id) });
	await expect(context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalledWith(context);
});

it('sendConsulta - has consulta', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.consulta = { appointments: [{ datetime_start: '' }] };
	await desafio.sendConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeTruthy();
	// await expect(context.sendText).toBeCalledWith(flow.triagem.consulta2, opt.answer.sendConsulta);

	await expect(context.sendText).toBeCalledWith(flow.triagem.consulta1);
	for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
		await expect(context.sendText).toBeCalledWith(''
			+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
			+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
			+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
	}

	await expect(context.sendText).toBeCalledWith(flow.triagem.cta);
	await expect(mainMenu.sendMain).toBeCalledWith(context);
});

it('sendConsulta - no consulta', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await desafio.sendConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeFalsy();

	await expect(context.sendText).toBeCalledWith(flow.triagem.consulta2, opt.answer.sendConsulta);
});

it('asksDesafio - finishedQuiz', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.startedQuiz = true; context.state.user = { finished_quiz: 1 };
	await desafio.asksDesafio(context);

	await expect(context.state.startedQuiz === true || context.state.user.finished_quiz === 1).toBeTruthy();
	await expect(mainMenu.sendMain).toBeCalledWith(context);
});

it('asksDesafio - startedQuiz', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.startedQuiz = true; context.state.user = { finished_quiz: 0 };
	await desafio.asksDesafio(context);

	await expect(context.state.startedQuiz === true || context.state.user.finished_quiz === 1).toBeTruthy();
	await expect(mainMenu.sendMain).toBeCalledWith(context);
});

it('asksDesafio - didnt startedQuiz', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.startedQuiz = false; context.state.user = { finished_quiz: 0 };
	await desafio.asksDesafio(context);

	await expect(context.state.startedQuiz === true || context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.asksDesafio.intro, opt.asksDesafio);
});

it('checkAconselhamento - duvida and prep', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.intentType = 'duvida';
	context.state.user = { is_prep: 1 };
	await desafio.checkAconselhamento(context);

	await expect(prepApi.resetTriagem).toBeCalledWith(context.session.user.id);
	await expect(context.state.intentType === 'duvida').toBeTruthy();
	await expect(context.state.user.is_prep === 1).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalledWith(context);
});

it('checkAconselhamento - duvida and not prep', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.intentType = 'duvida';
	context.state.user = { is_prep: 0 };
	await desafio.checkAconselhamento(context);

	await expect(prepApi.resetTriagem).toBeCalledWith(context.session.user.id);
	await expect(context.state.intentType === 'duvida').toBeTruthy();
	await expect(context.state.user.is_prep === 1).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.triagem.invite, opt.answer.isPrep);
});

it('checkAconselhamento - not duvida and prep', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_prep: 1 };
	await desafio.checkAconselhamento(context);

	await expect(prepApi.resetTriagem).toBeCalledWith(context.session.user.id);
	await expect(context.state.intentType === 'duvida').toBeFalsy();
	await expect(context.state.user.is_prep === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) }); // sendConsulta
});

it('checkAconselhamento - not duvida and not prep', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { is_prep: 0 };
	await desafio.checkAconselhamento(context);

	await expect(prepApi.resetTriagem).toBeCalledWith(context.session.user.id);
	await expect(context.state.intentType === 'duvida').toBeFalsy();
	await expect(context.state.user.is_prep === 1).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.triagem.send);
	await expect(triagem.getTriagem).toBeCalledWith(context);
});

it('followUpIntent - not target audience, no category', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_target_audience: 0 };
	context.state.categoryQuestion = '';
	context.state.intentName = 'teste';
	await desafio.followUpIntent(context);

	await expect(context.setState).toBeCalledWith({ intentType: await help.separateIntent(context.state.intentName), dialog: 'prompt' });
	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });

	await expect(context.state.user.is_target_audience === 1).toBeFalsy();
	await expect(context.state.categoryQuestion).toBeFalsy();

	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // sendQuiz
});

it('followUpIntent - not target audience, didnt finish quiz', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_target_audience: 0 };
	context.state.currentQuestion = { code: 'A5' };
	context.state.categoryQuestion = 'quiz';
	context.state.intentName = 'teste';
	await desafio.followUpIntent(context);

	await expect(context.setState).toBeCalledWith({ intentType: await help.separateIntent(context.state.intentName), dialog: 'prompt' });
	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });

	await expect(context.state.user.is_target_audience === 1).toBeFalsy();
	await expect(context.state.categoryQuestion).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(!context.state.currentQuestion || context.state.currentQuestion.code === null).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // sendQuiz
});

it('followUpIntent - not target audience, didnt finish quiz', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_target_audience: 0 };
	context.state.categoryQuestion = 'quiz';
	await desafio.followUpIntent(context);

	await expect(context.setState).toBeCalledWith({ intentType: await help.separateIntent(context.state.intentName), dialog: 'prompt' });
	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });

	await expect(context.state.user.is_target_audience === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(!context.state.currentQuestion || context.state.currentQuestion.code === null).toBeTruthy();
	await expect(mainMenu.sendShareAndMenu).toBeCalledWith(context);
});

it('followUpIntent - user already part on research', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 1, is_target_audience: 1 };
	await desafio.followUpIntent(context);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(prepApi.resetTriagem).toBeCalledWith(context.session.user.id); // checkAconselhamento
});

it('followUpIntent - not research, didnt finish quiz and servico', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_target_audience: 1, finished_quiz: 0 };
	context.state.intentType = 'serviço';
	await desafio.followUpIntent(context);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.intentType === 'serviço').toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.triagem.posto);
	await expect(context.state.user.finished_quiz === 0).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // sendQuiz
});

it('followUpIntent - not research, finished quiz and eligible ', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_target_audience: 1, is_eligible_for_research: 1, finished_quiz: 1	}; // eslint-disable-line
	await desafio.followUpIntent(context);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.intentType === 'serviço').toBeFalsy();
	await expect(context.state.user.finished_quiz === 0).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ researchCounter: await prepApi.getCountResearch(context.session.user.id) }); // sendResearch
});

it('followUpIntent - not research, finished quiz, eligible and problema ', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_target_audience: 1, is_eligible_for_research: 1, finished_quiz: 1	}; // eslint-disable-line
	context.state.intentType = 'problema';
	await desafio.followUpIntent(context);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.intentType === 'serviço').toBeFalsy();
	await expect(context.state.user.finished_quiz === 0).toBeFalsy();
	await expect(context.state.intentType === 'problema').toBeTruthy();
	// await expect(context.sendText).toBeCalledWith(await help.buildEmergenciaMsg(context.state.user.city, flow.triagem.whatsapp));
	await expect(context.setState).toBeCalledWith({ researchCounter: await prepApi.getCountResearch(context.session.user.id) }); // sendResearch
});

it('followUpIntent - not research, finished quiz and not eligible  ', async () => {
	const context = cont.quickReplyContext('aboutAmanda', 'mainMenu');
	context.state.user = { is_part_of_research: 0, is_target_audience: 1, is_eligible_for_research: 0, finished_quiz: 1	}; // eslint-disable-line
	await desafio.followUpIntent(context);

	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.intentType === 'serviço').toBeFalsy();
	await expect(context.state.user.finished_quiz === 0).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === 0 && context.state.user.finished_quiz === 1).toBeTruthy();
	await expect(sendCarouselSus).toBeCalledWith(context, opt.sus);
});
