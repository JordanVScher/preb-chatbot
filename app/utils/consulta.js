require('dotenv').config();

const flow = require('./flow');
const opt = require('./options');
const help = require('./helper');
const prepApi = require('./prep_api');
const { checkConsulta } = require('./checkQR');
const { sendMain } = require('./mainMenu');

async function verConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			await context.sendText(''
			+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
			+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
			+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
		}
		await context.sendText('Não falte!');
		await sendMain(context);
	} else {
		await context.sendText(flow.verConsulta.zero, await checkConsulta(context, opt.marcarConsulta));
	}
}

async function separateDaysQR(dates) {
	if (dates.length <= 10) { // less han 10 options, no need for pagination
		const result = [];
		dates.forEach(async (element) => {
			const date = new Date(`${element.ymd}T00:00:00`); // new date from ymd
			result.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.ymd}` });
		});
		return { 0: result }; // return object with the result array
	} // else

	// more than 10 options, we need pagination
	let page = 0; // the page number
	let set = [];
	const result = {};

	dates.forEach(async (element, index) => {// eslint-disable-line
		if (page > 0 && set.length === 0) {
			set.push({ content_type: 'text', title: 'Anterior', payload: `nextDay${page - 1}` }); // adding previous button to set
		}

		const date = new Date(`${element.hours[0].datetime_start}`);
		set.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.ymd}` });


		if (set.length % 9 === 0) { // time to add 'next' button at the 10th position
		// % 9 -> next is the "tenth" position for the set OR what remains before completing 10 positions for the new set (e.g. ->  47 - 40 = 7)
		// console.log('entrei aqui', index + 1);

			set.push({ content_type: 'text', title: 'Próximo', payload: `nextDay${page + 1}` }); // adding next button to set
			result[page] = set; // adding set/page to result
			page += 1; // next page
			set = []; // cleaning set
		}
	});

	if (set.length > 0) { // check if there's any left over options that didn't make the cut
		result[page] = set; // adding set/page to result
		page += 1; // next page
		set = []; // cleaning set
	}

	return result;
}

async function nextDay(context, page) {
	await context.sendText(flow.consulta.date, { quick_replies: context.state.freeDays[page] });
}

async function nextHour(context, page) {
	await context.sendText(flow.consulta.hour, { quick_replies: context.state.freeHours[page] });
}

async function formatHour(hour) {
	let result = hour;
	result = result.slice(0, 5);
	result = `${result}${hour.slice(8, 16)}`;

	return result;
}

async function separateHoursQR(dates) {
	if (dates.length <= 10) { // less han 10 options, no need for pagination
		const result = [];
		dates.forEach(async (element) => {
			result.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });
		});
		return { 0: result }; // return object with the result array
	} // else

	// more than 10 options, we need pagination
	let page = 0; // the page number
	let set = [];
	const result = {};

	dates.forEach(async (element, index) => {// eslint-disable-line
		if (page > 0 && set.length === 0) {
			set.push({ content_type: 'text', title: 'Anterior', payload: `nextHour${page - 1}` }); // adding previous button to set
		}
		set.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });

		if (set.length % 9 === 0) { // time to add 'next' button at the 10th position
			// % 9 -> next is the "tenth" position for the set OR what remains before completing 10 positions for the new set (e.g. ->  47 - 40 = 7)
			// console.log('entrei aqui', index + 1);

			set.push({ content_type: 'text', title: 'Próximo', payload: `nextHour${page + 1}` }); // adding next button to set
			result[page] = set; // adding set/page to result
			page += 1; // next page
			set = []; // cleaning set
		}
	});
	if (set.length > 0) { // check if there's any left over options that didn't make the cut
		result[page] = set; // adding set/page to result
		page += 1; // next page
		set = []; // cleaning set
	}

	return result;
}


// removes dates that don't have any available hours
async function cleanDates(dates) {
	const result = [];
	dates.forEach(async (element) => {
		if (element.hours.length !== 0) { result.push(element); }
	});

	return result;
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

	await context.setState({ freeTime: await cleanDates(context.state.calendar.dates) }); // all the free time slots we have

	await context.setState({ freeDays: await separateDaysQR(context.state.freeTime) });
	if (context.state.freeDays && context.state.freeDays['0'] && context.state.freeDays['0'] && context.state.freeDays['0'].length > 0) {
		await context.sendText(flow.consulta.date, { quick_replies: context.state.freeDays['0'] });
	} else {
		await context.sendText(flow.consulta.fail1, opt.consultaFail);
	}
}

async function showHours(context, ymd) {
	// context.state.freeTime -> // all the free time slots we have
	await context.setState({ chosenDay: context.state.freeTime.find(date => date.ymd === ymd) });
	await context.setState({ freeHours: await separateHoursQR(context.state.chosenDay.hours) });
	if (context.state.freeHours && context.state.freeHours['0'] && context.state.freeHours['0'] && context.state.freeHours['0'].length > 0) {
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
		await context.sendText('Você já tem consulta marcada:');
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			await context.sendText(''
				+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
				+ `\n⏰: ${await help.formatDate(iterator.datetime_start, iterator.time)}`
				+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
		}
		await sendMain(context);
	} else {
		await context.sendText('Então, vamos marcar uma nova consulta:');
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
