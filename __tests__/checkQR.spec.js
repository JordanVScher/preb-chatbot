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
	await expect(newOptions.find(x => x.payload === 'showDays') || newOptions.find(x => x.payload === 'verConsulta')).toBeFalsy();
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
	await expect(newOptions.find(x => x.payload === 'showDays') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeFalsy();

	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta');
	newOptions = await newOptions.filter(obj => obj.payload !== 'showDays');
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

	await expect(newOptions.find(x => x.payload === 'showDays') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeFalsy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option to see consulta for there isn't any consulta available
	await expect(newOptions.length === length - 2).toBeTruthy();
});

it('checkAnsweredQuiz - verConsulta, quiz finished and eligible with consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { finished_quiz: 1 };
	context.state.is_eligible_for_research = true;
	context.state.consulta = { appointments: ['a'] };
	await checkQR.checkAnsweredQuiz(context, opt.greetings);
	let newOptions = opt.greetings.quick_replies;
	const { length } = newOptions;

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'beginQuiz'); // remove quiz option
	await expect(newOptions.length === length - 1).toBeTruthy();

	await expect(newOptions.find(x => x.payload === 'showDays') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'showDays'); // remove option to schedule appointment because he scheduled one already
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
	newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-showDays'); // remove option
	newOptions = await newOptions.filter(obj => obj.payload !== 'showDays'); // remove option
	await expect(newOptions.length === 0).toBeTruthy();
});


it('checkConsulta - zero consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_eligible_for_research: 1 };
	context.state.consulta = { appointments: [] };
	let newOptions = opt.consulta.quick_replies;
	await checkQR.checkConsulta(context, opt.consulta);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeFalsy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-verConsulta');
	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta');

	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkConsulta - one consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_eligible_for_research: 1 };
	context.state.consulta = { appointments: ['foo'] };
	let newOptions = opt.consulta.quick_replies;
	await checkQR.checkConsulta(context, opt.consulta);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_eligible_for_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-showDays');
	newOptions = await newOptions.filter(obj => obj.payload !== 'showDays');

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
	context.state.consulta = { appointments: [] };
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeFalsy();
	newOptions.push({ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' });
	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkMainMenu - on audience and research, one consulta', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 1, is_part_of_research: 1 };
	context.state.consulta = { appointments: ['foo'] };
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeTruthy();
	newOptions.push({ content_type: 'text', title: 'Marcar Consulta', payload: 'showDays' });

	await expect(newOptions.length === 1).toBeTruthy();
});

it('checkMainMenu - on audience, no research, eligible', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = {
		is_target_audience: 1, is_part_of_research: 0, is_eligible_for_research: 1, finished_quiz: 1,
	};
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 0).toBeTruthy();
	await expect(context.state.user.is_eligible_for_research === 1 && context.state.user.finished_quiz === 1).toBeTruthy();
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

it('checkMainMenu - is prep ', async () => {
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

it('checkMainMenu - on audience and research, is_prep', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { is_target_audience: 1, is_part_of_research: 1, is_prep: 1 };
	context.state.consulta = { appointments: [] };
	const newOptions = [];
	await checkQR.checkMainMenu(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.is_target_audience === 1).toBeTruthy();
	await expect(context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeFalsy();
	newOptions.push({ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' });
	await expect(context.state.user.is_part_of_research === 1 && context.state.user.is_prep === 1).toBeTruthy();
	newOptions.push({ content_type: 'text', title: 'Medicação', payload: 'medicaçao' });
	newOptions.push({ content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' });


	await expect(newOptions.length === 3).toBeTruthy();
});


it('checkMedication - less than four months', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { prep_since: 155208009 }; // eslint-disable-line
	const newOptions = [];
	await checkQR.checkMedication(context);

	const fourMonths = 7776000; // the time range for the user to be in the first stage of the treatment
	const userJoined = context.state.user.prep_since / 1000 | 0; // eslint-disable-line
	const now = Date.now() / 1000 | 0; // eslint-disable-line

	await expect(now - userJoined <= fourMonths).toBeFalsy();

	newOptions.push({ content_type: 'text', title: 'Acabou o Remédio', payload: 'acabouRemedio' });
	newOptions.push({ content_type: 'text', title: 'Esqueci de tomar', payload: 'esqueciDeTomar' });
	newOptions.push({ content_type: 'text', title: 'Dúvida com o Remédio', payload: 'duvidaComRemedio' });

	await expect(newOptions.length === 3).toBeTruthy();
});

it('checkMedication - more than four months', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { prep_since: 1552080090000 }; // eslint-disable-line
	const newOptions = [];
	await checkQR.checkMedication(context);

	const fourMonths = 7776000; // the time range for the user to be in the first stage of the treatment
	const userJoined = context.state.user.prep_since / 1000 | 0; // eslint-disable-line
	const now = Date.now() / 1000 | 0; // eslint-disable-line

	await expect(now - userJoined <= fourMonths).toBeTruthy();

	newOptions.push({ content_type: 'text', title: 'Sintomas', payload: 'sintomas' });
	newOptions.push({ content_type: 'text', title: 'Acabou o Remédio', payload: 'acabouRemedio' });
	newOptions.push({ content_type: 'text', title: 'Esqueci de tomar', payload: 'esqueciDeTomar' });
	newOptions.push({ content_type: 'text', title: 'Dúvida com o Remédio', payload: 'duvidaComRemedio' });

	await expect(newOptions.length === 4).toBeTruthy();
});
