require('dotenv').config();

// const flow = require('./flow');
// const opt = require('./options');
const help = require('./helper');

const example = [
	{
		ymd: '2019-01-24',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-01-25',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-01-26',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-01-27',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-01-28',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-01-29',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-01-30',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-01-31',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-02-01',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-02-02',
		hours: ['10:00', '12:00', '16:00'],
	},
	{
		ymd: '2019-02-03',
		hours: ['10:00', '12:00', '16:00'],
	},
];

async function separateDaysQR(dates) {
	if (dates.length <= 10) { // less han 10 options, no need for pagination
		const result = [];
		dates.forEach(async (element) => {
			const date = new Date(`${element.ymd}`); // new date from ymd
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

		const date = new Date(`${element.ymd}T00:00:00`);
		set.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.ymd}` });

		if (set.length % 9 === 0 || (dates.length === (page * 10) + set.length - 0)) { // time to add 'next' button at the 10th position
			// % 9 -> next is the "tenth" position for the set OR what remains before completing 10 positions for the new set (e.g. ->  47 - 40 = 7)
			// console.log('entrei aqui', index + 1);

			if (set.length % 9 === 0) { // the "next" options should only be added on this case
				set.push({ content_type: 'text', title: 'Próximo', payload: `nextDay${page + 1}` }); // adding next button to set
			}

			result[page] = set; // adding set/page to result
			page += 1; // next page
			set = []; // cleaning set
		}
	});

	console.log(result);

	return result;
}

async function nextDay(context, page) {
	await context.sendText('Escolha uma data', { quick_replies: context.state.freeDays[page] });
}

async function separateHoursQR(dates) {
	const result = [];
	dates.forEach(async (element) => {
		result.push({ content_type: 'text', title: `As ${element}`, payload: `hora${element.replace(':', '-')}` });
	});
	return [{ quick_replies: result }];
}

async function marcarConsulta(context) {
	await context.setState({ freeTime: example }); // all the free time slots we have

	await context.setState({ freeDays: await separateDaysQR(context.state.freeTime) });
	if (context.state.freeDays && context.state.freeDays['0'] && context.state.freeDays['0'] && context.state.freeDays['0'].length > 0) {
		await context.sendText('Escolha uma data', { quick_replies: context.state.freeDays['0'] });
	} else {
		await context.sendText('Não temos nenhuma data disponível em um futuro próximo');
	}
}

async function showHours(context, day) {
	// context.state.freeTime -> // all the free time slots we have

	const chosenDay = context.state.freeTime.find(date => date.ymd === day);
	await context.setState({ chosenDay: chosenDay.ymd }); // the day the user chose
	const freeHours = await separateHoursQR(chosenDay.hours);
	if (freeHours && freeHours.quick_replies && freeHours.quick_replies.length > 0) {
		await context.sendText('Escolha um horário', freeHours);
	} else {
		await context.sendText('Não temos nenhum horario disponível nesse dia');
	}
}

async function finalDate(context, hour) {
	await context.setState({ chosenHour: hour });
	await context.sendText(`Você escolheu ${context.state.chosenDay} as ${context.state.chosenHour}`);
}

module.exports.marcarConsulta = marcarConsulta;
module.exports.nextDay = nextDay;
module.exports.showHours = showHours;
module.exports.finalDate = finalDate;
