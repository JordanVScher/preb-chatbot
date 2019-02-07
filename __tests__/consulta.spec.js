const cont = require('./context');
const consulta = require('../app/utils/consulta');
const opt = require('../app/utils/options');
const flow = require('../app/utils/flow');
const prepApi = require('../app/utils/prep_api');
const help = require('../app/utils/helper');

jest.mock('../app/utils/options');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/flow');

it('verConsulta - no appointments', async () => {
	const context = cont.quickReplyContext('verConsulta', 'greetings');
	context.state.consultas = {};
	await consulta.verConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.verConsulta.zero, opt.saidYes);
});

it('verConsulta - one appointment', async () => {
	const context = cont.quickReplyContext('verConsulta', 'greetings');
	context.state.consultas = { appointments: [{ datetime_start: '' }] };
	await consulta.verConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0).toBeTruthy();
    for (const iterator of context.state.consultas.appointments) { // eslint-disable-line
		await expect(context.sendText).toBeCalledWith('Arrasou! Você tem uma consulta:'
		+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
        + `\n⏰: ${help.formatDate(iterator.datetime_start)}`);
	}
});// טך

it('nextDay', async () => {
	const context = cont.quickReplyContext('verConsulta', 'greetings');
	const page = 0;
	context.state.freeDays = [];
	await consulta.nextDay(context);

	await expect(context.sendText).toBeCalledWith('Escolha uma data', { quick_replies: context.state.freeDays[page] });
});

it('nextHour', async () => {
	const context = cont.quickReplyContext('marcarConsulta', 'greetings');
	const page = 0;
	context.state.freeHours = [];
	await consulta.nextHour(context);

	await expect(context.sendText).toBeCalledWith('Escolha um horário', { quick_replies: context.state.freeHours[page] });
});
