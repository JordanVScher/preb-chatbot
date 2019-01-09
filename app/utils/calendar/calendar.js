const CalendarAPI = require('node-google-calendar');

const KEY = require('../../googleapi-key.json').private_key;
const SERVICE_ACCT_ID = require('../../googleapi-key.json').client_email;

const CONFIG = {
	key: KEY,
	serviceAcctId: SERVICE_ACCT_ID,
	calendarId: process.env.CALENDAR_ID, // ID da agenda
	timezone: process.env.TIMEZONE, // sp: UTC+02:00
	calendarUrl: process.env.CALENDAR_URL, // ical format (use the secret ical to avoid turning the calendar public)
};

const calendar = new CalendarAPI(CONFIG);
const { calendarId } = CONFIG;

module.exports.calendarMain = calendar;
module.exports.calendarId = calendarId; // the id of the requested calendar

// don't forget to get the googleapi-key.json from the project Console and add it to gitIgnore.
// you can also get the values from the json and add then to the .env file

const help = require('../helper'); // unreleated to the google-calendar api

// helper functions

// Gets every event EXCEPT events with Fechado in the name.
// "Fechada" -> hospital is not open
async function getAllEvents(param = {}) {
	const result = await calendar.Events.list(calendarId, param)
		.then((allEvents) => {
			console.log('List of events on calendar within time-range:');
			const events = allEvents.filter(event => event.summary.includes('Fechado') === false);
			return events;
		}).catch((err) => {
			console.log(`Error: listSingleEvents -${err.message}`);
		});

	return result;
}

// Configures the default search param for calendar events.
// timeMin: the first date we should look for (The day the user is interacting)
// timemax: the limit of time
function setDefaultSearchParam() {
	const timeMin = new Date();
	const paramObj = {
		timeMin: timeMin.toISOString(),
		timeMax: '2019-12-31T23:55:00+08:00',
		//   q: 'query-string',
		singleEvents: true,
		orderBy: 'startTime',
	};

	return paramObj;
}

// Uses the userID to find events related only to that user. UsedID can be at the event summary (title) or description
function setUserSearchParam(userID) {
	const timeMin = new Date();
	const paramObj = {
		timeMin: timeMin.toISOString(),
		timeMax: '2019-12-31T23:55:00+08:00',
		q: userID,
		singleEvents: true,
		orderBy: 'startTime',
	};

	return paramObj;
}

// creates a new event
// Obs: your app needs write permission to do that, maybe your g-suite domain won't let you. Talk to your g-suite admin or use a different e-mail.
async function createEvent(event) {
	const result = await calendar.Events.insert(calendarId, event)
		.then((resp) => {
			console.log('inserted event:');
			return resp;
		})
		.catch((err) => {
			console.log(`Error: insertEvent-${err.message}`);
		});

	return result;
}

function setEvent(usedID) {
	const timeMin = new Date();
	const timeMax = new Date();
	timeMax.setHours(timeMax.getHours() + 1);

	const paramObj = {
		start: { dateTime: timeMin.toISOString() },
		end: { dateTime: timeMax.toISOString() },
		location: 'Eokoe',
		summary: `Evento do ${usedID}`,
		status: 'confirmed',
		description: 'teste teste teste',
		colorId: 6,
	};

	return paramObj;
}

async function checkFreeBusy(timeMin, timeMax) {
	const params = { timeMin, timeMax, items: [{ id: calendarId }] };

	const dateStringRsult = await calendar.FreeBusy.query(calendarId, params)
		.then(resp => resp)
		.catch((err) => {
			console.log(`Error: checkBusy - ${err.message}`);
		});

	// converting the result dates to timestamps
	const timestampResult = [];
	dateStringRsult.forEach(async (element) => {
		timestampResult.push({
			start: help.moment(element.start).unix(),
			end: help.moment(element.end).unix(),
		});
	});

	return timestampResult;
}

// divide the time range in blocks of 1 hour
async function divideTimeRange(timeMin, finalData) {
	let currentDate = timeMin;
	const slices = {};
	let count = 0;

	while (finalData >= currentDate) { // while currentDate is not out of bounds
		currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60)); // jump to the next hour

		if (currentDate.getDay() === 0) { // check if day is Sunday
			currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60 * 24)); // skip one day to get to Monday
		} else if (currentDate.getDay() === 6) { // check if day is Saturday
			currentDate = new Date(currentDate.getTime() + (1000 * 60 * 60 * 24 * 2)); // skip two days to get to Monday
		} else if ((currentDate.getHours() >= 0 && currentDate.getHours() < 6)) { // skip "closed" hours 0-6 and go to "open" hour 7
			currentDate.setHours(7);
		}

		if (currentDate.getHours() < 22) { // simply ignore "closed hours" in the night (22, 23)
			slices[count] = help.moment(currentDate).unix();
			// slices[count] = `${currentDate}`;
			count += 1;
		}
	}

	return slices;
}

// Compares every hour that may be free with known busy time ranges from the api. Returns a list with free times, divided by hour.
async function getFreeTime() {
	const timeMin = help.formatInitialDate(new Date());
	const timeMax = new Date(Date.now() + 12096e5); // two weeks from now
	timeMax.setDate(timeMax.getDate() - 1); // we remove one day to make room for the "voltar button"

	const slicedRange = await divideTimeRange(timeMin, timeMax); // List of every hour that may be free in the range
	const busyTimes = await checkFreeBusy(timeMin, timeMax); // List of busy timings with events within defined time range

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
	// console.log(freeTimeSlots);

	return freeTimeSlots;
}

// get every day available from the "free" time slots
async function listFreeDays(timeSlots) {
	const freeDays = []; // array of free days (month day and week day)
	freeDays.push({ date: timeSlots[0].getDate(), day: timeSlots[0].getDay() }); // starting the list with the first element

	Object.values(timeSlots).forEach(async (element) => {
		if (freeDays[freeDays.length - 1].date !== element.getDate()) { // check if we already added that day
			freeDays.push({ date: element.getDate(), day: element.getDay() }); // add day and date
		}
	});

	return freeDays;
}

module.exports.getAllEvents = getAllEvents;
module.exports.setDefaultSearchParam = setDefaultSearchParam;
module.exports.setUserSearchParam = setUserSearchParam;
module.exports.createEvent = createEvent;
module.exports.setEvent = setEvent;
module.exports.checkFreeBusy = checkFreeBusy;

module.exports.divideTimeRange = divideTimeRange;
module.exports.getFreeTime = getFreeTime;
module.exports.listFreeDays = listFreeDays;
