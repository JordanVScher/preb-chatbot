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
	context.state.consulta = {}; context.state.user = {};
	await consulta.verConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.verConsulta.zero, await checkConsulta(context, opt.marcarConsulta));
});

it('verConsulta - one appointment', async () => {
	const context = cont.quickReplyContext('verConsulta', 'greetings');
	context.state.consulta = { appointments: [{ datetime_start: '' }] }; context.state.user = {};
	await consulta.verConsulta(context);

	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
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

it('showDays - success', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.freeDays = [{ foo: 'bar' }];
	context.state.calendar = {}; context.state.user = {};
	await consulta.showDays(context);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ cidade: context.state.user.city });

	await expect(context.setState).toBeCalledWith({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.cityId, context.state.paginationDate) });
	await expect(context.setState).toBeCalledWith({ calendarNext: await prepApi.getAvailableDates(context.session.user.id, context.state.cityId, context.state.paginationDate + 1) });

	await expect(context.setState).toBeCalledWith({ freeTime: await aux.cleanDates(context.state.calendar.dates) });
	await expect(context.setState).toBeCalledWith({ freeDays: await aux.separateDaysQR(context.state.freeTime, context.state.calendarNext, context.state.paginationDate) });
	await expect(context.state.freeDays && context.state.freeDays.length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.date, { quick_replies: context.state.freeDays });
});

it('showDays - error with extra message', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.calendar = {}; context.state.user = {};
	context.state.sendExtraMessages = true;
	await consulta.showDays(context);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ cidade: context.state.user.city });

	await expect(context.state.sendExtraMessages === true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.quizYes.text3);

	await expect(context.setState).toBeCalledWith({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.cityId, context.state.paginationDate) });
	await expect(context.setState).toBeCalledWith({ calendarNext: await prepApi.getAvailableDates(context.session.user.id, context.state.cityId, context.state.paginationDate + 1) });

	await expect(context.setState).toBeCalledWith({ freeTime: await aux.cleanDates(context.state.calendar.dates) });
	await expect(context.setState).toBeCalledWith({ freeDays: await aux.separateDaysQR(context.state.freeTime, context.state.calendarNext, context.state.paginationDate) });
	await expect(context.state.freeDays && context.state.freeDays.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.fail1, opt.consultaFail);
});

it('showHours - success', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.freeHours = [{ foo: 'bar' }];
	context.state.chosenDay = {};
	context.state.freeTime = [];
	const ymd = 'foobar';
	await consulta.showHours(context, ymd);

	await expect(context.setState).toBeCalledWith({ chosenDay: context.state.freeTime.find(date => date.ymd === ymd) });
	await expect(context.setState).toBeCalledWith({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours, ymd, context.state.paginationHour) });

	await expect(context.state.freeHours && context.state.freeHours.length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.hours, { quick_replies: context.state.freeHours });
});

it('showHours - error', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.chosenDay = {};
	context.state.freeTime = [];
	const ymd = 'foobar';
	await consulta.showHours(context, ymd);

	await expect(context.setState).toBeCalledWith({ chosenDay: context.state.freeTime.find(date => date.ymd === ymd) });
	await expect(context.setState).toBeCalledWith({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours, ymd, context.state.paginationHour) });

	await expect(context.state.freeHours && context.state.freeHours.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.fail2, opt.consultaFail);
});

it('finalDate - success', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.chosenDay = { hours: [] };
	context.state.calendar = {}; context.state.chosenHour = {}; context.state.response = { id: '1' };
	const quota = '0';
	await consulta.finalDate(context, quota);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });
	await expect(context.setState).toBeCalledWith({
		response: await prepApi.postAppointment(
			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento',
			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
		),
	});

	await expect(context.state.response && context.state.response.id && context.state.response.id.length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(`${flow.consulta.success}`
		+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
		+ `\n⏰: ${await help.formatDate(context.state.chosenHour.datetime_start, context.state.chosenHour.time)}`
		+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);

	await expect(context.state.sendExtraMessages === true).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ sendExtraMessages: false });
	await expect(sendMain).toBeCalledWith(context);
});

it('finalDate - success with extra message', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.chosenDay = { hours: [] };
	context.state.calendar = {}; context.state.chosenHour = {};	context.state.response = { id: '1' };
	context.state.sendExtraMessages = true;
	const quota = '0';
	await consulta.finalDate(context, quota);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });
	await expect(context.setState).toBeCalledWith({
		response: await prepApi.postAppointment(
			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento',
			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
		),
	});

	await expect(context.state.response && context.state.response.id && context.state.response.id.length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(`${flow.consulta.success}`
		+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
		+ `\n⏰: ${await help.formatDate(context.state.chosenHour.datetime_start, context.state.chosenHour.time)}`
		+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);

	await expect(context.state.sendExtraMessages === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ sendExtraMessages: false });
	await expect(context.sendButtonTemplate).toBeCalledWith(flow.quizYes.text2, opt.questionario);
});

it('finalDate - error', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.chosenDay = { hours: [] };
	context.state.calendar = {}; context.state.chosenHour = {};	context.state.response = {};
	const quota = '0';
	await consulta.finalDate(context, quota);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });
	await expect(context.setState).toBeCalledWith({
		response: await prepApi.postAppointment(
			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento',
			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
		),
	});

	await expect(context.state.response && context.state.response.id && context.state.response.id.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.fail3, opt.consultaFail);
});
