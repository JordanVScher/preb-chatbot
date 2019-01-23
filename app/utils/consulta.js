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
	const resultDay = [];
	dates.forEach(async (element) => {
		const date = new Date(element.ymd);
		resultDay.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.ymd}` });
	});

	return { quick_replies: resultDay };
}

async function marcarConsulta(context) {
	await context.setState({ freeTime: example });
	const freeDays = await separateDaysQR(context.state.freeTime);
	if (freeDays && freeDays.quick_replies && freeDays.quick_replies.length > 0) {
		await context.sendText('Escolha um horário', freeDays);
	} else {
		await context.sendText('Não temos nenhuma data disponível em um futuro próximo');
	}
}

module.exports.marcarConsulta = marcarConsulta;
