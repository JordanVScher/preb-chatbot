const cont = require('./context');
const checkQR = require('../app/utils/checkQR');
const opt = require('../app/utils/options');
const prepApi = require('../app/utils/prep_api');

jest.mock('../app/utils/prep_api');

it('checkAnsweredQuiz - no check', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	const newOptions = opt.asksDesafio.quick_replies;
	await checkQR.checkAnsweredQuiz(context, opt.asksDesafio);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(newOptions.find(x => x.payload === 'marcarConsulta') || newOptions.find(x => x.payload === 'verConsulta')).toBeFalsy();
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
	await expect(newOptions.find(x => x.payload === 'marcarConsulta') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeFalsy();

	newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta');
	newOptions = await newOptions.filter(obj => obj.payload !== 'marcarConsulta');
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

	await expect(newOptions.find(x => x.payload === 'marcarConsulta') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
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

	await expect(newOptions.find(x => x.payload === 'marcarConsulta') || newOptions.find(x => x.payload === 'verConsulta')).toBeTruthy();
	await expect(context.state.is_eligible_for_research === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ consultas: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeTruthy();
	newOptions = await newOptions.filter(obj => obj.payload !== 'marcarConsulta'); // remove option to schedule appointment because he scheduled one already
	await expect(newOptions.length === length - 2).toBeTruthy();
});
