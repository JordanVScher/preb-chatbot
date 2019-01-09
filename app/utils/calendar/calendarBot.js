const calendar = require('./calendar');
const help = require('../helper');

async function formatEvent(event, UserId = 'xxx') {
	let result = '';
	console.log(UserId);

	if (event.summary) { result += `Título: ${event.summary}\n`; }
	if (event.description) { result += `Descrição: ${event.description.replace(UserId, '')}\n`; }
	if (event.location) { result += `Local: ${event.location}\n`; }
	if (event.start && event.start.dateTime) { result += `Início: ${help.formatDate(event.start.dateTime)}\n`; }
	if (event.end && event.end.dateTime) { result += `Fim: ${help.formatDate(event.end.dateTime)}`; }

	return result;
}

// lists every event on the calendar related to the user, using the userID present in the event description.
async function listUserEvents(context) {
	await context.setState({ searchParams: await calendar.setUserSearchParam(context.session.user.id) });
	await context.setState({ calendarEvents: await calendar.getAllEvents(context.state.searchParams) });

	if (context.state.calendarEvents) {
		let firstMsgTrigger = false;
		for (const event of context.state.calendarEvents) { // eslint-disable-line no-restricted-syntax
			event.summary = event.summary.replace(` - ${context.session.user.id}`, ''); // removing userID from event title
			const text = await formatEvent(event, context.session.user.id);
			if (text && text.length > 0) {
				if (firstMsgTrigger === false) { await context.sendText('Veja seus eventos:'); firstMsgTrigger = true; } // send first msg only once if there's at least one result
				await context.sendText(text);
			}
		}
	} else {
		await context.sendText('Você não tem eventos marcados');
	}
}

// lists every event on the calendar, using the defeault search params and send them to the user.
async function listAllEvents(context) {
	await context.setState({ searchParams: await calendar.setDefaultSearchParam() });
	await context.setState({ calendarEvents: await calendar.getAllEvents(context.state.searchParams) });

	if (context.state.calendarEvents) {
		let firstMsgTrigger = false;
		for (const event of context.state.calendarEvents) { // eslint-disable-line no-restricted-syntax
			const text = await formatEvent(event);
			if (text && text.length > 0) {
				if (firstMsgTrigger === false) { await context.sendText('Veja nossos eventos:'); firstMsgTrigger = true; } // send first msg only once if there's at least one result
				await context.sendText(text);
			}
		}
	} else {
		await context.sendText('Não temos eventos');
	}
}


async function createEvent(context) {
	await context.setState({ eventParams: await calendar.setEvent(context.session.user.id, context.session.user._updatedAt) });
	await context.setState({ createdEvent: await calendar.createEvent(context.state.eventParams) });

	if (context.state.createdEvent && context.state.createdEvent.start && context.state.createdEvent.start.dateTime) {
		await context.sendText(`Criamos o evento para dia ${help.formatDate(context.state.createdEvent.start.dateTime)}`);
	} else {
		await context.sendText('Não deu pra criar o evento!');
	}
}

// builds quick_replies options for the free days we have available
async function sendAvailableDays(context) {
	await context.setState({ freeTime: await calendar.getFreeTime() }); // storing the freeTime for later
	const freeDays = await calendar.getFreeDays(context.state.freeTime); // freeDays just stores day and date
	const quickReplyButtons = [];

	Object.values(freeDays).forEach(async (element) => { // building the quick_replies array
		quickReplyButtons.push({ content_type: 'text', title: `Dia ${element.date} - ${help.weekDayName[element.day]}`, payload: `eventDate${element.date}` });
	});
	// quickReplyButtons.push({ content_type: 'text', title: 'Voltar', payload: 'mainMenu' }); // Voltar button

	await context.sendText('Legal, escolha o dia que você quer marcar:', { quick_replies: quickReplyButtons });
}

// builds quick_replies options for the free hours we have available
async function sendAvailableHours(context) {
	await context.setState({ freeHours: await calendar.getFreeHours(context.state.selectedDate, await calendar.getFreeTime()) }); // full date
	const quickReplyButtons = [];

	Object.values(context.state.freeHours).forEach(async (element, index) => { // building the quick_replies array
		quickReplyButtons.push({ content_type: 'text', title: `Às ${element.getHours()}:00h`, payload: `eventHour${index}` });
	});
	// quickReplyButtons.push({ content_type: 'text', title: 'Voltar', payload: 'mainMenu' }); // Voltar button

	await context.sendText('ok, escolha o horário para o dia que você quer marcar: (das 8h as 21h)', { quick_replies: quickReplyButtons });
}

// async function setEvent(context) {

// }

module.exports.createEvent = createEvent;
module.exports.listAllEvents = listAllEvents;
module.exports.listUserEvents = listUserEvents;
module.exports.sendAvailableDays = sendAvailableDays;
module.exports.sendAvailableHours = sendAvailableHours;
