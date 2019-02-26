const cont = require('./context');
const consulta = require('../app/utils/consulta');
const aux = require('../app/utils/consulta-aux');
const opt = require('../app/utils/options');
const flow = require('../app/utils/flow');
const prepApi = require('../app/utils/prep_api');
const help = require('../app/utils/helper');
const { checkConsulta } = require('../app/utils/checkQR');
const { sendMain } = require('../app/utils/mainMenu');

jest.mock('../app/utils/options');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/flow');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/consulta-aux');

it('verConsulta - no appointments', async () => {
	const context = cont.quickReplyContext('verConsulta', 'greetings');
	context.state.consulta = {};
	await consulta.verConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.verConsulta.zero, await checkConsulta(context, opt.marcarConsulta));
});

it('verConsulta - one appointment', async () => {
	const context = cont.quickReplyContext('verConsulta', 'greetings');
	context.state.consulta = { appointments: [{ datetime_start: '' }] };
	await consulta.verConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id) });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeTruthy();
	for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
		await expect(context.sendText).toBeCalledWith(''
				+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
				+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
				+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
	}
	await expect(context.sendText).toBeCalledWith(flow.consulta.view);
	await expect(sendMain).toBeCalledWith(context);
});


it('nextDay', async () => {
	const context = cont.quickReplyContext('verConsulta', 'greetings');
	const page = 0;
	context.state.freeDays = [];
	await consulta.nextDay(context);

	await expect(context.sendText).toBeCalledWith(flow.consulta.date, { quick_replies: context.state.freeDays[page] });
});

it('nextHour', async () => {
	const context = cont.quickReplyContext('marcarConsulta', 'greetings');
	const page = 0;
	context.state.freeHours = [];
	await consulta.nextHour(context);

	await expect(context.sendText).toBeCalledWith(flow.consulta.hour, { quick_replies: context.state.freeHours[page] });
});

it('showCities - no extraMessage', async () => {
	const context = cont.quickReplyContext('getCity', 'greetings');
	context.state.cities = { calendars: [{ city: 'a', id: '1' }] };
	const options = [];
	await consulta.showCities(context, options);

	await expect(context.setState).toBeCalledWith({ cities: await prepApi.getAvailableCities() });
	context.state.cities.calendars.forEach(async (element) => {
		options.push({ content_type: 'text', title: element.city, payload: `city${element.id}` });
	});

	await expect(options.length === 1).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.city, { quick_replies: options });
});

it('showCities - with extraMessage', async () => {
	const context = cont.quickReplyContext('getCity', '');
	context.state.cities = { calendars: [{ city: 'a', id: '1' }, { city: 'b', id: '2' }] };
	context.state.sendExtraMessages = true;
	const options = [];
	await consulta.showCities(context, options);

	await expect(context.state.sendExtraMessages === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quizYes.text3);

	await expect(context.setState).toBeCalledWith({ cities: await prepApi.getAvailableCities() });
	context.state.cities.calendars.forEach(async (element) => {
		options.push({ content_type: 'text', title: element.city, payload: `city${element.id}` });
	});

	await expect(options.length === 2).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.city, { quick_replies: options });
});

it('showDays', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.calendar = { dates: { appointment_window_id: 1, hours: [Array], ymd: '2019-02-25' } };
	context.state.time = context.state.calendar;
	context.state.freeDays = { 0: [{ content_type: 'text', title: '25/02 - Segunda', payload: 'dia1' }] };
	await consulta.showDays(context);

	await expect(context.setState).toBeCalledWith({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.cityId) });
	await expect(context.setState).toBeCalledWith({ freeTime: await aux.cleanDates(context.state.calendar.dates) });
	await expect(context.setState).toBeCalledWith({ freeDays: await aux.separateDaysQR(context.state.freeTime) });

	await expect(context.state.freeDays && context.state.freeDays['0'] && context.state.freeDays['0'].length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.date, { quick_replies: context.state.freeDays['0'] });
});

it('showHours', async () => {
	const context = cont.quickReplyContext('showHours', '');
	context.state.freeTime = [{ appointment_window_id: 1, hours: [Array], ymd: '2019-02-25' }];
	context.state.chosenDay = { hours: '' };
	context.state.freeHours = { 0: [{ content_type: 'text', title: '08:00 - 08:30', payload: 'hora1' }] };
	const ymd = '1';
	await consulta.showHours(context, ymd);

	await expect(context.setState).toBeCalledWith({ chosenDay: context.state.freeTime.find(date => date.ymd === ymd) });
	await expect(context.setState).toBeCalledWith({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours) });
	await expect(context.state.freeHours && context.state.freeHours['0'] && context.state.freeHours['0'].length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.hours, { quick_replies: context.state.freeHours['0'] });
});
