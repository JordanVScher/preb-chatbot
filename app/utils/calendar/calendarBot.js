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

// Compares every hour that may be free with known busy time ranges from the api. Returns a list with free times, divided by hour.
async function getFreeTime() {
	const timeMin = help.formatInitialDate(new Date());
	const timeMax = new Date(Date.now() + 12096e5); // two weeks from now

	const slicedRange = await calendar.divideTimeRange(timeMin, timeMax); // List of every hour that may be free in the range
	const busyTimes = await calendar.checkFreeBusy(timeMin, timeMax); // List of busy timings with events within defined time range

	const freeTimeSlots = {};
	let count = 0; // freeTimeSlots keys counter

	Object.values(slicedRange).forEach(async (timeSlot) => { // check if each of the timeSlots are free or busy
		let countInside = 0;
		let addToResult = true;

		// obs: timeSlot === busyTimes[countInside].end doesn't mean busy (altoughtimeSlot === busyTimes[countInside].start means it's busy time)
		while (countInside < busyTimes.length && addToResult === true) {
			if (timeSlot >= busyTimes[countInside].start && timeSlot < busyTimes[countInside].end) { // check if timeSlot is in a 'busy' timerange
				addToResult = false; // if it is a busy timeslot, we don't add it to the results array (we can also stop looping because we know the time is busy already)
			}

			// if the current range end has happened before the current timeSlot the next ranges aren't going to include timeSlot so we can stop the loop
			if (busyTimes[countInside].end > timeSlot) { countInside = busyTimes.length; }

			countInside += 1; // next step for countInside
		} // --while end

		if (addToResult === true) { // add free timeSlot to end result (as date instead of timestamp)
			freeTimeSlots[count] = new Date(timeSlot * 1000);
			count += 1; // next step for slicedRange
		}
	});

	// console.log(Object.keys(slicedRange).length);
	// console.log(Object.keys(freeTimeSlots).length);
	console.log(freeTimeSlots);

	return freeTimeSlots;
}

module.exports.createEvent = createEvent;
module.exports.listAllEvents = listAllEvents;
module.exports.listUserEvents = listUserEvents;
module.exports.getFreeTime = getFreeTime;

getFreeTime();
