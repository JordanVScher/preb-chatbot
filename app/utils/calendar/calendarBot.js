const calendar = require('./calendar');
const help = require('../helper');

async function formatEvent(event) {
	let result = '';
	if (event.summary) { result += `Título: ${event.summary}\n`; }
	if (event.description) { result += `Descrição: ${event.description}\n`; }
	if (event.location) { result += `Local: ${event.location}\n`; }
	if (event.start && event.start.dateTime) { result += `Início: ${help.formatDate(event.start.dateTime)}\n`; }
	if (event.end && event.end.dateTime) { result += `Fim: ${help.formatDate(event.end.dateTime)}`; }

	return result;
}


async function listAllEvents(context) {
	await context.setState({ searchParams: await calendar.setDefaultSearchParam() });
	await context.setState({ calendarEvents: await calendar.getAllEvents(context.state.searchParams) });

	if (context.state.calendarEvents) {
		await context.sendText('Veja nossos eventos:');
		for (const event of context.state.calendarEvents) { // eslint-disable-line no-restricted-syntax
			const text = await formatEvent(event);
			if (text && text.length > 0) {
				await context.sendText(text);
			}
		}
	} else {
		await context.sendText('Não temos eventos');
	}
}

module.exports.listAllEvents = listAllEvents;


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
