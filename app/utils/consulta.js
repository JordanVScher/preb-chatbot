require('dotenv').config();

// const flow = require('./flow');
// const opt = require('./options');
const help = require('./helper');
const prepApi = require('../prep_api');

async function separateDaysQR(dates) {
	if (dates.length <= 10) { // less han 10 options, no need for pagination
		const result = [];
		dates.forEach(async (element) => {
			const date = new Date(`${element.ymd}`); // new date from ymd
			result.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.appointment_window_id}` });
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

		const date = new Date(`${element.ymd}T00:00:00`);
		set.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.appointment_window_id}` });


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
	await context.sendText('Escolha uma data', { quick_replies: context.state.freeDays[page] });
}

async function nextHour(context, page) {
	await context.sendText('Escolha um horário', { quick_replies: context.state.freeHours[page] });
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

async function marcarConsulta(context) {
	// await context.setState({ freeTime: example }); // all the free time slots we have
	await context.setState({ calendar: await prepApi.getAvailableDates(context.session.user.id) });
	await context.setState({ freeTime: context.state.calendar.dates }); // all the free time slots we have

	await context.setState({ freeDays: await separateDaysQR(context.state.freeTime) });
	if (context.state.freeDays && context.state.freeDays['0'] && context.state.freeDays['0'] && context.state.freeDays['0'].length > 0) {
		await context.sendText('Escolha uma data', { quick_replies: context.state.freeDays['0'] });
	} else {
		await context.sendText('Não temos nenhuma data disponível em um futuro próximo');
	}
}

async function showHours(context, windowId) {
	// context.state.freeTime -> // all the free time slots we have

	await context.setState({ chosenDay: context.state.freeTime.find(date => date.appointment_window_id === parseInt(windowId, 10)) });
	await context.setState({ freeHours: await separateHoursQR(context.state.chosenDay.hours) });
	if (context.state.freeHours && context.state.freeHours['0'] && context.state.freeHours['0'] && context.state.freeHours['0'].length > 0) {
		await context.sendText('Escolha um horário', { quick_replies: context.state.freeHours['0'] });
	} else {
		await context.sendText('Não temos nenhum horario disponível nesse dia');
	}
}

async function finalDate(context, quota) {
	await context.setState({ chosenHour: context.state.chosenDay.hours.find(hour => hour.quota === parseInt(quota, 10)) });
	const response = await prepApi.postAppointment(
		context.session.user.id, context.state.calendar.google_id, context.state.chosenDay.appointment_window_id, context.state.chosenHour.quota,
	);

	if (response.id) {
		await context.sendText('Marcamos a consulta com sucesso');
	} else {
		await context.sendText('Ocorreu um erro');
	}
}

module.exports.marcarConsulta = marcarConsulta;
module.exports.nextDay = nextDay;
module.exports.nextHour = nextHour;
module.exports.showHours = showHours;
module.exports.finalDate = finalDate;
