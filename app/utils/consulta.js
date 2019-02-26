require('dotenv').config();

const flow = require('./flow');
const opt = require('./options');
const help = require('./helper');
const prepApi = require('./prep_api');
const { checkConsulta } = require('./checkQR');
const { sendMain } = require('./mainMenu');
const aux = require('./consulta-aux');

async function verConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			await context.sendText(''
			+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
			+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
			+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
		}
		await context.sendText(flow.consulta.view);
		await sendMain(context);
	} else {
		await context.sendText(flow.verConsulta.zero, await checkConsulta(context, opt.marcarConsulta));
	}
}


async function nextDay(context, page) {
	await context.sendText(flow.consulta.date, { quick_replies: context.state.freeDays[page] });
}

async function nextHour(context, page) {
	await context.sendText(flow.consulta.hour, { quick_replies: context.state.freeHours[page] });
}


async function showCities(context) {
	if (context.state.sendExtraMessages === true) {
		await context.sendText(flow.quizYes.text3);
	}

	await context.setState({ cities: await prepApi.getAvailableCities() });
	const options = [];

	context.state.cities.calendars.forEach(async (element) => {
		options.push({ content_type: 'text', title: element.city, payload: `city${element.id}` });
	});

	await context.sendText(flow.consulta.city, { quick_replies: options });
}

async function showDays(context) { // shows available days
	// await context.setState({ freeTime: example }); // all the free time slots we have
	await context.setState({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.cityId) }); // getting whole calendar
	// console.log('Calendário Carregado', JSON.stringify(context.state.calendar, undefined, 2));
	// await context.setState({ timezone: context.state.calendar.time_zone });

	await context.setState({ freeTime: await aux.cleanDates(context.state.calendar.dates) }); // all the free time slots we have

	await context.setState({ freeDays: await aux.separateDaysQR(context.state.freeTime) });
	if (context.state.freeDays && context.state.freeDays['0'] && context.state.freeDays['0'].length > 0) {
		await context.sendText(flow.consulta.date, { quick_replies: context.state.freeDays['0'] });
	} else {
		await context.sendText(flow.consulta.fail1, opt.consultaFail);
	}
}

async function showHours(context, ymd) {
	// context.state.freeTime -> // all the free time slots we have
	await context.setState({ chosenDay: context.state.freeTime.find(date => date.ymd === ymd) });
	await context.setState({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours) });
	if (context.state.freeHours && context.state.freeHours['0'] && context.state.freeHours['0'].length > 0) {
		await context.sendText(flow.consulta.hours, { quick_replies: context.state.freeHours['0'] });
	} else {
		await context.sendText(flow.consulta.fail2, opt.consultaFail);
	}
}

async function finalDate(context, quota) { // where we actually schedule the consulta
	await context.setState({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });

	const response = await prepApi.postAppointment(
		context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento', context.state.chosenDay.appointment_window_id,
		context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
	);

	console.log('postAppointment', response);

	if (response.id) {
		await context.sendText(`${flow.consulta.success}`
			+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
			+ `\n⏰: ${await help.formatDate(context.state.chosenHour.datetime_start, context.state.chosenHour.time)}`
			+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);

		if (context.state.sendExtraMessages === true) {
			await context.sendButtonTemplate(flow.quizYes.text2, opt.questionario);
		}
		await context.setState({ sendExtraMessages: false });
		await sendMain(context);
	} else {
		await context.sendText(flow.consulta.fail3, opt.consultaFail);
	}
}

async function checarConsulta(context) {
	await context.setState({ sendExtraMessages: false });
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
	console.log('CONSULTA', context.state.consulta);

	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		await context.sendText(flow.consulta.checar1);
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			await context.sendText(''
				+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
				+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
				+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
		}
		await sendMain(context);
	} else {
		await context.sendText(flow.consulta.checar2);
		await showCities(context);
	}
}

module.exports.verConsulta = verConsulta;
module.exports.showDays = showDays;
module.exports.showCities = showCities;
module.exports.nextDay = nextDay;
module.exports.nextHour = nextHour;
module.exports.showHours = showHours;
module.exports.finalDate = finalDate;
module.exports.checarConsulta = checarConsulta;
