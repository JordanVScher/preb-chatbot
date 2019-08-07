const cont = require('./context');
const consulta = require('../app/utils/consulta');
const aux = require('../app/utils/consulta-aux');
const opt = require('../app/utils/options');
const flow = require('../app/utils/flow');
const prepApi = require('../app/utils/prep_api');
const help = require('../app/utils/helper');
const { checkConsulta } = require('../app/utils/checkQR');
const { buildButton } = require('../app/utils/checkQR');
const { checkMainMenu } = require('../app/utils/checkQR');
// const { sendMain } = require('../app/utils/mainMenu');

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

// it('verConsulta - one appointmen with integration token and on salvador', async () => {
// 	const context = cont.quickReplyContext('verConsulta', 'greetings');
// 	context.state.consulta = { appointments: [{ datetime_start: '' }] }; context.state.user = { integration_token: 'foobar', city };
// 	await consulta.verConsulta(context);

// 	await expect(context.setState).toBeCalledWith({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
// 	await expect(context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0).toBeTruthy();
// 	for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
// 		await expect(context.sendText).toBeCalledWith(''
// 				+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
// 				+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
// 				+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);

// 		await expect(context.state.user.integration_token && context.state.user.integration_token.length > 0).toBeTruthy();
// 	}

// 	await expect(context.sendText).toBeCalledWith(flow.consulta.view);

// 	await sendSalvador(context);
// 	await context.sendText(flow.consulta.view);
// 	await context.sendText(flow.mainMenu.text1, await checkMainMenu(context));
// 	await expect(sendMain).toBeCalledWith(context);
// });

it('showDays - success', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.freeDays = [{ foo: 'bar' }]; context.state.calendar = { dates: ['foo'] };
	context.state.user = {};
	await consulta.showDays(context);

	await expect(context.setState).toBeCalledWith({ cidade: context.state.user.city });
	await expect(context.setState).toBeCalledWith({ calendarCurrent: context.state.calendar[context.state.paginationDate], calendarNext: context.state.calendar[context.state.paginationDate + 1] }); // eslint-disable-line
	await expect(context.setState).toBeCalledWith({ freeDays: await aux.separateDaysQR(context.state.calendarCurrent, context.state.calendarNext, context.state.paginationDate) });

	await expect(context.state.freeDays && context.state.freeDays.length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.date, { quick_replies: context.state.freeDays });
});

it('showDays - failure', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.freeDays = []; context.state.calendar = { dates: ['foo'] };
	context.state.user = {};
	await consulta.showDays(context);

	await expect(context.setState).toBeCalledWith({ cidade: context.state.user.city });
	await expect(context.setState).toBeCalledWith({ calendarCurrent: context.state.calendar[context.state.paginationDate], calendarNext: context.state.calendar[context.state.paginationDate + 1] }); // eslint-disable-line
	await expect(context.setState).toBeCalledWith({ freeDays: await aux.separateDaysQR(context.state.calendarCurrent, context.state.calendarNext, context.state.paginationDate) });

	await expect(context.state.freeDays && context.state.freeDays.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.fail1, opt.consultaFail);
});

it('showHours - success', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.freeHours = [{ foo: 'bar' }]; context.state.chosenDay = {}; context.state.calendarCurrent = [];
	const ymd = 'foobar';
	await consulta.showHours(context, '');

	await expect(context.setState).toBeCalledWith({ chosenDay: context.state.calendarCurrent.find(date => date.ymd === ymd) });
	await expect(context.setState).toBeCalledWith({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours, ymd, context.state.paginationHour) });

	await expect(context.state.freeHours && context.state.freeHours.length > 0).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.hours, { quick_replies: context.state.freeHours });
});

it('showHours - error', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.chosenDay = {}; context.state.calendarCurrent = [];
	const ymd = 'foobar';
	await consulta.showHours(context, ymd);

	await expect(context.setState).toBeCalledWith({ chosenDay: context.state.calendarCurrent.find(date => date.ymd === ymd) });
	await expect(context.setState).toBeCalledWith({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours, ymd, context.state.paginationHour) });

	await expect(context.state.freeHours && context.state.freeHours.length > 0).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.fail2, opt.consultaFail);
});

it('loadCalendar', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.calendar = { dates: [] };
	await consulta.loadCalendar(context);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.user.city, context.state.paginationDate) });
	await expect(context.setState).toBeCalledWith({ calendar: await context.state.calendar.dates.sort((obj1, obj2) => new Date(obj1.ymd) - new Date(obj2.ymd)) });
	await expect(context.setState).toBeCalledWith({ calendar: await aux.cleanDates(context.state.calendar) });
	await expect(context.setState).toBeCalledWith({ calendar: await aux.separateDaysIntoPages(context.state.calendar) });

	await expect(context.state.sendExtraMessages === true).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.consulta.checar2);

	await expect(context.setState).toBeCalledWith({ cidade: context.state.user.city }); // showDays
});

it('loadCalendar with sendExtraMessages', async () => {
	const context = cont.quickReplyContext('showDays', '');
	context.state.calendar = { dates: [] }; context.state.sendExtraMessages = true;
	await consulta.loadCalendar(context);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.user.city, context.state.paginationDate) });
	await expect(context.setState).toBeCalledWith({ calendar: await context.state.calendar.dates.sort((obj1, obj2) => new Date(obj1.ymd) - new Date(obj2.ymd)) });
	await expect(context.setState).toBeCalledWith({ calendar: await aux.cleanDates(context.state.calendar) });
	await expect(context.setState).toBeCalledWith({ calendar: await aux.separateDaysIntoPages(context.state.calendar) });

	await expect(context.state.sendExtraMessages === true).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ sendExtraMessages2: true, sendExtraMessages: false });
	await expect(context.sendText).toBeCalledWith(flow.quizYes.text3.replace('<LOCAL>', help.extraMessageDictionary[context.state.user.city]));
	await expect(context.sendText).toBeCalledWith(flow.quizYes.text4);

	await expect(context.setState).toBeCalledWith({ cidade: context.state.user.city }); // showDays
});


// it('finalDate - success with salvador and extra message and url', async () => {
// 	const context = cont.quickReplyContext('showDays', '');
// 	context.state.chosenDay = { hours: [] }; context.state.user = { city: '2', integration_token: 'foobar' };
// 	context.state.calendar = {}; context.state.chosenHour = {}; context.state.response = { id: '1' }; context.state.sendExtraMessages2 = true;
// 	context.state.preCadastro = { offline_pre_registration_form: 'www.foobar.com/' };
// 	const quota = '0';
// 	await consulta.finalDate(context, quota);

// 	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
// 	await expect(context.setState).toBeCalledWith({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });
// 	await expect(context.setState).toBeCalledWith({
// 		response: await prepApi.postAppointment(
// 			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento',
// 			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
// 		),
// 	});

// 	await expect(context.state.response && context.state.response.id && context.state.response.id.length > 0).toBeTruthy();
// 	let msg = `${flow.consulta.success}`
// 	+ `\n🏠: ${help.cidadeDictionary[context.state.cidade]}`
// 	+ `\n⏰: ${await help.formatDate(context.state.chosenHour.datetime_start, context.state.chosenHour.time)}`
// 	+ `\n📞: ${help.telefoneDictionary[context.state.cidade]}`;
// 	await expect(context.state.user.integration_token && context.state.user.integration_token.length > 0).toBeTruthy();
// 	msg += `\nSeu identificador: ${context.state.user.integration_token}`;
// 	await expect(context.sendText).toBeCalledWith(msg);

// 	await expect(context.state.user && context.state.user.city === '2').toBeTruthy();
// 	await expect(context.sendText).toBeCalledWith(flow.consulta.salvadorMsg);

// 	await expect(context.state.sendExtraMessages2 === true).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ sendExtraMessages2: false });
// 	await expect(context.state.preCadastro && context.state.preCadastro.offline_pre_registration_form && context.state.preCadastro.offline_pre_registration_form.length > 0).toBeTruthy(); // eslint-disable-line
// 	// await expect(context.sendButtonTemplate).toBeCalledWith(flow.quizYes.text2, await buildButton(context.state.preCadastro.offline_pre_registration_form, 'Pré-Cadastro'));
// 	await expect(context.sendText).toBeCalledWith(flow.mainMenu.text1, await checkMainMenu(context));


// 	// await expect(sendMain).toBeCalledWith(context);
// });

// it('finalDate - success with extra message', async () => {
// 	const context = cont.quickReplyContext('showDays', '');
// 	context.state.chosenDay = { hours: [] }; context.state.user = {};
// 	context.state.calendar = {}; context.state.chosenHour = {};	context.state.response = { id: '1' };
// 	context.state.sendExtraMessages = true; context.state.sentAnswer = { offline_pre_registration_form: 'foobar.com' };
// 	const quota = '0';
// 	await consulta.finalDate(context, quota);

// 	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
// 	await expect(context.setState).toBeCalledWith({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });
// 	await expect(context.setState).toBeCalledWith({
// 		response: await prepApi.postAppointment(
// 			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento',
// 			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
// 		),
// 	});

// 	await expect(context.state.response && context.state.response.id && context.state.response.id.length > 0).toBeTruthy();
// 	await expect(context.sendText).toBeCalledWith(`${flow.consulta.success}`
// 		+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
// 		+ `\n⏰: ${await help.formatDate(context.state.chosenHour.datetime_start, context.state.chosenHour.time)}`
// 		+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);

// 	await expect(context.state.user && context.state.user.city === '2').toBeFalsy();

// 	await expect(context.state.sendExtraMessages === true).toBeTruthy();
// 	await expect(context.setState).toBeCalledWith({ sendExtraMessages: false });

// 	await expect(context.state.sentAnswer && context.state.sentAnswer.offline_pre_registration_form && context.state.sentAnswer.offline_pre_registration_form.length > 0).toBeTruthy();
// 	await expect(context.sendButtonTemplate).toBeCalledWith(flow.quizYes.text2, await buildButton(context.state.sentAnswer.offline_pre_registration_form, 'Pré-Cadastro'));

// 	await expect(sendMain).toBeCalledWith(context);
// });

// it('finalDate - error', async () => {
// 	const context = cont.quickReplyContext('showDays', '');
// 	context.state.chosenDay = { hours: [] };
// 	context.state.calendar = {}; context.state.chosenHour = {};	context.state.response = {};
// 	const quota = '0';
// 	await consulta.finalDate(context, quota);

// 	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
// 	await expect(context.setState).toBeCalledWith({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });
// 	await expect(context.setState).toBeCalledWith({
// 		response: await prepApi.postAppointment(
// 			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento',
// 			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
// 		),
// 	});

// 	await expect(context.state.response && context.state.response.id && context.state.response.id.length > 0).toBeFalsy();
// 	await expect(context.sendText).toBeCalledWith(flow.consulta.fail3, opt.consultaFail);
// });
