require('dotenv').config();

const flow = require('./flow');
const opt = require('./options');
const help = require('./helper');
const prepApi = require('./prep_api');
const { checkConsulta } = require('./checkQR');
const { sendMain } = require('./mainMenu');
const aux = require('./consulta-aux');

// const { mockDates } = require('./mock-dates');

async function verConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			await context.sendText(''
			+ `\n🏠: ${help.cidadeDictionary[context.state.cidade]}`
			+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
			+ `\n📞: ${help.telefoneDictionary[context.state.cidade]}`);
		}
		await context.sendText(flow.consulta.view);
		await sendMain(context);
	} else {
		await context.sendText(flow.verConsulta.zero, await checkConsulta(context, opt.marcarConsulta));
	}
}

async function showDays(context) { // shows available days
	await context.setState({ paginationDate: 1, paginationHour: 1 }); // resetting pagination
	await context.setState({ cidade: context.state.user.city }); // getting location id
	if (context.state.sendExtraMessages === true) {
		await context.sendText(flow.quizYes.text3);
	} else {
		await context.sendText(flow.consulta.checar2);
	}

	await context.setState({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.cidade, context.state.paginationDate) }); // getting calendar
	await context.setState({ calendarNext: await prepApi.getAvailableDates(context.session.user.id, context.state.cidade, context.state.paginationDate + 1) }); // getting next page
	// console.log('Calendário Carregado', JSON.stringify(context.state.calendar, undefined, 2));
	// await context.setState({ calendar: mockDates[context.state.paginationDate] });
	// await context.setState({ calendarNext: mockDates[context.state.paginationDate + 1] }); // getting next page

	await context.setState({ freeTime: await aux.cleanDates(context.state.calendar.dates) }); // all the free time slots we have

	await context.setState({ freeDays: await aux.separateDaysQR(context.state.freeTime, context.state.calendarNext, context.state.paginationDate) }); // builds buttons options
	if (context.state.freeDays && context.state.freeDays.length > 0) {
		await context.sendText(flow.consulta.date, { quick_replies: context.state.freeDays });
	} else {
		await context.sendText(flow.consulta.fail1, opt.consultaFail); // Eita! Bb, parece que ocorreu um erro. Você pode tentar novamente mais tarde.
	}
}

async function showHours(context, ymd) {
	// context.state.freeTime -> // all the free time slots we have
	// await context.setState({ calendar: mockDates[context.state.paginationDate] }); // for testing
	// await context.setState({ freeTime: await aux.cleanDates(context.state.calendar.dates) }); // all the free time slots we have

	await context.setState({ chosenDay: context.state.freeTime.find(date => date.ymd === ymd) });
	await context.setState({ freeHours: await aux.separateHoursQR(context.state.chosenDay.hours, ymd, context.state.paginationHour) });
	// console.log(context.state.freeHours);

	if (context.state.freeHours && context.state.freeHours.length > 0) {
		await context.sendText(flow.consulta.hours, { quick_replies: context.state.freeHours });
	} else {
		await context.sendText(flow.consulta.fail2, opt.consultaFail);
	}
}

async function finalDate(context, quota) { // where we actually schedule the consulta
	await context.setState({ paginationDate: 1, paginationHour: 1 }); // resetting pagination
	await context.setState({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });

	await context.setState({
		response: await prepApi.postAppointment(
			context.session.user.id, context.state.calendar.google_id, context.state.categoryConsulta && context.state.categoryConsulta.length > 0 ? context.state.categoryConsulta : 'recrutamento',
			context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota, context.state.chosenHour.datetime_start, context.state.chosenHour.datetime_end,
		),
	});

	// console.log('postAppointment', context.state.response);

	if (context.state.response && context.state.response.id && context.state.response.id.toString().length > 0) {
		await context.sendText(`${flow.consulta.success}`
		+ `\n🏠: ${help.cidadeDictionary[context.state.cidade]}`
		+ `\n⏰: ${await help.formatDate(context.state.chosenHour.datetime_start, context.state.chosenHour.time)}`
		+ `\n📞: ${help.telefoneDictionary[context.state.cidade]}`);
		if (context.state.sendExtraMessages === true) {
			await context.setState({ sendExtraMessages: false });
			await context.sendButtonTemplate(flow.quizYes.text2, opt.questionario);
		} else {
			await context.setState({ sendExtraMessages: false });
			await sendMain(context);
		}
	} else {
		await context.sendText(flow.consulta.fail3, opt.consultaFail);
	}
}

async function checarConsulta(context) {
	// await context.setState({ sendExtraMessages: false });
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id), cidade: context.state.user.city });
	console.log('CONSULTA', context.state.consulta);

	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		await context.sendText(flow.consulta.checar1);
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			await context.sendText(''
			+ `\n🏠: ${help.cidadeDictionary[context.state.cidade]}`
			+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
			+ `\n📞: ${help.telefoneDictionary[context.state.cidade]}`);
		}
		await sendMain(context);
	} else {
		await showDays(context);
	}
}

module.exports.verConsulta = verConsulta;
module.exports.showDays = showDays;
module.exports.showHours = showHours;
module.exports.finalDate = finalDate;
module.exports.checarConsulta = checarConsulta;
