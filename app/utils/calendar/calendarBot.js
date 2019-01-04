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
	console.log(context.state.eventParams);

	await context.setState({ createdEvent: await calendar.createEvent(context.state.eventParams) });
	console.log(context.state.createdEvent);

	if (context.state.createdEvent && context.state.createdEvent.start && context.state.createdEvent.start.dateTime) {
		await context.sendText(`Criamos o evento para dia ${help.formatDate(context.state.createdEvent.start.dateTime)}`);
	} else {
		await context.sendText('Não deu pra criar o evento!');
	}
}

module.exports.createEvent = createEvent;
module.exports.listAllEvents = listAllEvents;
module.exports.listUserEvents = listUserEvents;


async function getFreeTime() {
	const timeMin = new Date();
	const timeMax = new Date(Date.now() + 12096e5);

	const slicedRange = await calendar.divideTimeRange(timeMin, timeMax);
	console.log(slicedRange);


	const busyTimes = await calendar.checkFreeBusy(timeMin, timeMax);
	console.log('List of busy timings with events within defined time range: ');
	console.log(busyTimes);
}

getFreeTime();
