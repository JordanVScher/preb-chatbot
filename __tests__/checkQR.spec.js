const cont = require('./context');
const checkQR = require('../app/utils/checkQR');
const opt = require('../app/utils/options');
const prepApi = require('../app/utils/prep_api');

jest.mock('../app/utils/prep_api');

it('checkAnsweredQuiz - no check', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { finished_quiz: 0 };
	const newOptions = opt.asksDesafio.quick_replies;
	await checkQR.checkAnsweredQuiz(context, opt.asksDesafio);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(newOptions.find(x => x.payload === 'getCity') || newOptions.find(x => x.payload === 'verConsulta')).toBeFalsy();
	await expect(newOptions === opt.asksDesafio.quick_replies).toBeTruthy();
});

it('checkAnsweredQuiz - verConsulta but quiz not finished and not eligible', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { finished_quiz: 0 };
	context.state.is_eligible_for_research = false;
	await checkQR.checkAnsweredQuiz(context, opt.greetings);
	let newOptions = opt.greetings.quick_replies;

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(newOptions.find(x => x.payload === 'getCity') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeFalsy();

	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta');
	newOptions = await newOptions.filter(obj => obj.payload !== 'getCity');
	await expect(newOptions === opt.greetings.quick_replies).toBeFalsy();
	await expect(newOptions.length === 1).toBeTruthy();
	await expect(newOptions[0].payload === 'beginQuiz').toBeTruthy();
});

it('checkAnsweredQuiz - verConsulta, quiz finished and eligible but no consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { finished_quiz: 1 };
	context.state.is_eligible_for_research = true;
	await checkQR.checkAnsweredQuiz(context, opt.greetings);
	let newOptions = opt.greetings.quick_replies;
	const { length } = newOptions;

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'beginQuiz'); // remove quiz option
	await expect(newOptions.length === length - 1).toBeTruthy();

	await expect(newOptions.find(x => x.payload === 'getCity') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consultas: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeFalsy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option to see consulta for there isn't any consulta available
	await expect(newOptions.length === length - 2).toBeTruthy();
});

it('checkAnsweredQuiz - verConsulta, quiz finished and eligible with consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { finished_quiz: 1 };
	context.state.is_eligible_for_research = true;
	context.state.consultas = { appointments: ['a'] };
	await checkQR.checkAnsweredQuiz(context, opt.greetings);
	let newOptions = opt.greetings.quick_replies;
	const { length } = newOptions;

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'beginQuiz'); // remove quiz option
	await expect(newOptions.length === length - 1).toBeTruthy();

	await expect(newOptions.find(x => x.payload === 'getCity') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consultas: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'getCity'); // remove option to schedule appointment because he scheduled one already
	await expect(newOptions.length === length - 2).toBeTruthy();
});


it('checkConsulta - not eligible_for_research ', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_eligible_for_research: 0 };
	let newOptions = opt.consulta.quick_replies;
	await checkQR.checkConsulta(context, opt.consulta);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_eligible_for_research === 1).toBeFalsy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-verConsulta'); // remove option
	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option
	newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-getCity'); // remove option
	newOptions = await newOptions.filter(obj => obj.payload !== 'getCity'); // remove option
	await expect(newOptions.length === 0).toBeTruthy();
});


it('checkConsulta - zero consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_eligible_for_research: 1 };
	context.state.consultas = { appointments: [] };
	let newOptions = opt.consulta.quick_replies;
	await checkQR.checkConsulta(context, opt.consulta);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consultas: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeFalsy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-verConsulta');
	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta');

	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkConsulta - one consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_eligible_for_research: 1 };
	context.state.consultas = { appointments: ['foo'] };
	let newOptions = opt.consulta.quick_replies;
	await checkQR.checkConsulta(context, opt.consulta);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consultas: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-getCity');
	newOptions = await newOptions.filter(obj => obj.payload !== 'getCity');

	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkMainMenu - not on audience, finished quiz', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = {};
	context.state.currentQuestion = { code: null };
	const newOptions = [];
	await checkQR.checkMainMenu(context, newOptions);

	await expect(context.setState).toBeCalledWith({ sendExtraMessages: false });

	newOptions.push({ content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' });
	newOptions.push({ content_type: 'text', title: 'Prevenções', payload: 'seePreventions' });

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code !== null).toBeFalsy();

	newOptions.push({ content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' });
	await expect(newOptions.length === 3).toBeTruthy();
});

it('checkMainMenu - not on audience, finish quiz', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = {};
	context.state.currentQuestion = { code: 'a5' };
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ sendExtraMessages: false });

	newOptions.push({ content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' });
	newOptions.push({ content_type: 'text', title: 'Prevenções', payload: 'seePreventions' });

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await expect(context.state.currentQuestion && context.state.currentQuestion.code !== null).toBeTruthy();
	newOptions.push({ content_type: 'text', title: 'Quiz', payload: 'beginQuiz' });

	newOptions.push({ content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' });
	await expect(newOptions.length === 4).toBeTruthy();
});

it('checkMainMenu - on audience and research, no consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 1, is_part_of_research: 1 };
	context.state.consultas = { appointments: [] };
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consultas: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeFalsy();
	newOptions.push({ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' });
	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkMainMenu - on audience and research, one consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 1, is_part_of_research: 1 };
	context.state.consultas = { appointments: ['foo'] };
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consultas: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeTruthy();
	newOptions.push({ content_type: 'text', title: 'Marcar Consulta', payload: 'getCity' });

	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkMainMenu - on audience, no research, eligible', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 1, is_part_of_research: 0, is_eligible_for_research: 1 };
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 0).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	newOptions.push({ content_type: 'text', title: 'Pesquisa', payload: 'askResearch' });

	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkMainMenu - on audience, no research, not eligible and finished_quiz ', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = {
		is_target_audience: 1, is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 1,
	};
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 0).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 0).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 0 && context.state.user.finished_quiz === 1).toBeTruthy();
	newOptions.push({ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' });

	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkMainMenu - on audience, no research, not eligible and not finished_quiz ', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = {
		is_target_audience: 1, is_part_of_research: 0, is_eligible_for_research: 0, finished_quiz: 0,
	};
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === 1).toBeFalsy();
	await expect(context.state.user.is_eligible_for_research === 0 && context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(context.state.user.finished_quiz === 0).toBeTruthy();
	newOptions.push({ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' });
	newOptions.push({ content_type: 'text', title: 'Quiz', payload: 'beginQuiz' });

	await expect(newOptions.length === 2).toBeTruthy();
});
