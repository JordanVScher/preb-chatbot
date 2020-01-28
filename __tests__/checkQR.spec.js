const cont = require('./context');
const checkQR = require('../app/utils/checkQR');
const opt = require('../app/utils/options');

jest.mock('../app/utils/prep_api');

// it('checkAnsweredQuiz - no check', async () => {
// 	const context = cont.quickReplyContext('greetings', 'greetings');
// 	context.state.user = { finished_quiz: 0 };
// 	const result = await checkQR.checkAnsweredQuiz(context, opt.asksDesafio);

// 	await expect(result.quick_replies.length === 3).toBeTruthy();
// 	await expect(result.quick_replies[0].title === 'Vamos!').toBeTruthy();
// 	await expect(result.quick_replies[1].title === 'Agora não').toBeTruthy();
// 	await expect(result.quick_replies[2].title === 'Já Faço Parte').toBeTruthy();
// });

// it('checkAnsweredQuiz - verConsulta but quiz not finished and not eligible', async () => {
// 	const context = cont.quickReplyContext('greetings', 'greetings');
// 	context.state.user = { finished_quiz: 0, is_eligible_for_research: 0 };
// 	const result = await checkQR.checkAnsweredQuiz(context, opt.greetings);

// 	await expect(result.quick_replies.length === 1).toBeTruthy();
// 	await expect(result.quick_replies[0].title === 'Quiz').toBeTruthy();
// });

// it('checkAnsweredQuiz - verConsulta, quiz finished and eligible but no consulta', async () => {
// 	const context = cont.quickReplyContext('greetings', 'greetings');
// 	context.state.user = { finished_quiz: 1, is_eligible_for_research: 1 };
// 	const result = await checkQR.checkAnsweredQuiz(context, opt.greetings);

// 	await expect(result.quick_replies.length === 1).toBeTruthy();
// 	await expect(result.quick_replies[0].title === 'Marcar Consulta').toBeTruthy();
// });

// it('checkAnsweredQuiz - verConsulta, quiz finished and eligible with consulta', async () => {
// 	const context = cont.quickReplyContext('greetings', 'greetings');
// 	context.state.user = { finished_quiz: 1, is_eligible_for_research: 1 };
// 	context.state.consulta = { appointments: ['foobar'] };
// 	const result = await checkQR.checkAnsweredQuiz(context, opt.greetings);

// 	await expect(result.quick_replies.length === 1).toBeTruthy();
// 	await expect(result.quick_replies[0].title === 'Ver Consulta').toBeTruthy();
// });

// it('checkConsulta - not eligible_for_research ', async () => {
// 	const context = cont.quickReplyContext('greetings', 'greetings');
// 	context.state.user = { is_eligible_for_research: 0 };
// 	const result = await checkQR.checkConsulta(context, opt.consulta);

// 	await expect(result.quick_replies.length === 0).toBeTruthy();
// });

// it('checkConsulta - zero consulta', async () => {
// 	const context = cont.quickReplyContext('greetings', 'greetings');
// 	context.state.user = { is_eligible_for_research: 1 };
// 	const result = await checkQR.checkConsulta(context, opt.consulta);

// 	await expect(result.quick_replies.length === 1).toBeTruthy();
// 	await expect(result.quick_replies[0].title === 'Marcar Consulta').toBeTruthy();
// });

// it('checkConsulta - one or more consultas', async () => {
// 	const context = cont.quickReplyContext('greetings', 'greetings');
// 	context.state.user = { is_eligible_for_research: 1 };
// 	context.state.consulta = { appointments: ['foo'] };
// 	const result = await checkQR.checkConsulta(context, opt.consulta);

// 	await expect(result.quick_replies.length === 1).toBeTruthy();
// 	await expect(result.quick_replies[0].title === 'Ver Consulta').toBeTruthy();
// });

it('checkMainMenu - not on audience, didnt finish quiz -> faz quiz', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 0, is_part_of_research: 0 }; context.state.currentQuestion = { code: 'a5' };
	context.state.publicoInteresseEnd = false;
	const result = await checkQR.checkMainMenu(context);

	await expect(result.quick_replies.length === 5).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
	await expect(result.quick_replies[1].payload === 'beginQuiz').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Já Faço Parte').toBeTruthy();
	await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
});

it('checkMainMenu - not on audience, didnt finish quiz, has token -> faz quiz', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 0, is_part_of_research: 0, integration_token: 'foobar' }; context.state.currentQuestion = { code: 'a5' };
	context.state.publicoInteresseEnd = false;
	const result = await checkQR.checkMainMenu(context);

	await expect(result.quick_replies.length === 5).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
	await expect(result.quick_replies[1].payload === 'beginQuiz').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Ver meu Voucher').toBeTruthy();
	await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
});

it('checkMainMenu - on audience, finished quiz -> recrutamento', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 1, is_part_of_research: 0 };
	context.state.publicoInteresseEnd = true;
	const result = await checkQR.checkMainMenu(context);

	await expect(result.quick_replies.length === 5).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
	await expect(result.quick_replies[1].payload === 'recrutamento').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Já Faço Parte').toBeTruthy();
	await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
});

it('checkMainMenu - on audience, finished quiz and regulamento -> no quiz', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 1, is_part_of_research: 0 };
	context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = true;
	const result = await checkQR.checkMainMenu(context);

	await expect(result.quick_replies.length === 4).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Prevenções').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Já Faço Parte').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Sobre a Amanda').toBeTruthy();
});

it('checkMainMenu - not on audience, finished quiz -> brincadeira', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 0, is_part_of_research: 0 };
	context.state.publicoInteresseEnd = true;
	const result = await checkQR.checkMainMenu(context);

	await expect(result.quick_replies.length === 5).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
	await expect(result.quick_replies[1].payload === 'querBrincadeira').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Já Faço Parte').toBeTruthy();
	await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
});

it('checkMainMenu - not on audience, finished quiz and brincadeira -> no quiz', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 0, is_part_of_research: 0 };
	context.state.publicoInteresseEnd = true; context.state.quizBrincadeiraEnd = true;
	const result = await checkQR.checkMainMenu(context);

	await expect(result.quick_replies.length === 4).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Prevenções').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Já Faço Parte').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Sobre a Amanda').toBeTruthy();
});

it('checkMedication - less than four months', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { prep_since: Date.now() };
	const result = await checkQR.checkMedication(context.state.user.prep_since);

	await expect(result.quick_replies.length === 3).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Acabou o Remédio').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Esqueci de tomar').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Dúvida com o Remédio').toBeTruthy();
});

it('checkMedication - more than four months', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { prep_since: 155208009 };
	const result = await checkQR.checkMedication(context.state.user.prep_since);

	await expect(result.quick_replies.length === 4).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Sintomas').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Acabou o Remédio').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Esqueci de tomar').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Dúvida com o Remédio').toBeTruthy();
});

it('autoTesteOption - city 1', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.autoTesteOption = '1';
	const result = await checkQR.autoTesteOption(opt.autoteste, context.state.autoTesteOption);

	await expect(result.quick_replies.length === 2).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Autoteste').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Serviço').toBeTruthy();
});

it('autoTesteOption - city 2 as number', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.autoTesteOption = 2;
	const result = await checkQR.autoTesteOption(opt.autoteste, context.state.autoTesteOption);

	await expect(result.quick_replies.length === 2).toBeTruthy();
	await expect(result.quick_replies[0].title === 'ONG').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Serviço').toBeTruthy();
});

it('autoTesteOption - city 3 - nothing changes', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.autoTesteOption = 3;
	const result = await checkQR.autoTesteOption(opt.autoteste, context.state.autoTesteOption);

	await expect(result.quick_replies === opt.autoteste.quick_replies).toBeTruthy();
});
