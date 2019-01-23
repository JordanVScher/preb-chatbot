const flow = require('./flow');
const opt = require('./options');
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
];


async function separateDaysQR(dates) {
	const result = [];
	dates.forEach(async (element) => {
		const date = new Date(element.ymd);
		result.push({ content_type: 'text', title: `${date.getDate() + 1}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.ymd}` });
	});

	return { quick_replies: result };
}

async function separateHoursQR(dates) {
	const result = [];
	dates.forEach(async (element) => {
		result.push({ content_type: 'text', title: `As ${element}`, payload: `hora${element.replace(':', '-')}` });
	});
	return { quick_replies: result };
}

async function marcarConsulta(context) {
	await context.setState({ freeTime: example }); // all the free time slots we have
	const freeDays = await separateDaysQR(context.state.freeTime);
	if (freeDays && freeDays.quick_replies && freeDays.quick_replies.length > 0) {
		await context.sendText('Escolha uma data', freeDays);
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
module.exports.showHours = showHours;
module.exports.finalDate = finalDate;
