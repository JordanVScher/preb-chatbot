const help = require('./helper');

function formatDate(date) {
	let day = date.getDate();
	if (day && day.toString().length === 1) { day = `0${day}`; }

	let month = date.getMonth() + 1;
	if (month && month.toString().length === 1) { month = `0${month}`; }

	return `${day}/${month} - ${help.weekDayName[date.getDay()]}`;
}


async function separateDaysQR(dates, next, pageNumber) {
	const dateOptions = [];

	if (pageNumber > 1) { // if not on the first page, add a button to go back to previous options
		dateOptions.push({ content_type: 'text', title: 'Anterior', payload: 'previousDay' });
	}

	dates.forEach(async (element) => { // add dates (maximum of 8)
		const date = new Date(`${element.hours[0].datetime_start}`);
		dateOptions.push({ content_type: 'text', title: formatDate(date), payload: `dia${element.ymd}` });
	});

	if (next && next && next.length > 0) { // if there's still dates to send, add a button to load them
		dateOptions.push({ content_type: 'text', title: 'Próximo', payload: 'nextDay' });
	} else { // no more dates, show extra option
		dateOptions.push({ content_type: 'text', title: 'Outras Datas', payload: 'outrasDatas' });
	}

	return dateOptions;
}

async function separateDaysIntoPages(dates) {
	const result = {};
	let pageNumber = 1;

	result[pageNumber] = [];
	dates.forEach(async (element) => {
		result[pageNumber].push(element);
		if (pageNumber === 1 && result[pageNumber].length === 9) { // first page can have more options (no "Anterior" button)
			pageNumber += 1;
			result[pageNumber] = [];
		} else if (result[pageNumber].length === 8) {
			pageNumber += 1;
			result[pageNumber] = [];
		}
	});

	return result;
}


async function formatHour(hour) {
	let result = hour;
	result = await result.slice(0, 5);
	result = await `${result}${hour.slice(8, 16)}`;
	return result;
}

async function separateHoursQR(dates, ymd, pageNumber) {
	const result = [];

	if (dates.length < 10) { // less han 10 options, no need for pagination
		for (const element of dates) { // eslint-disable-line
			await result.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });
		}
		result.push({ content_type: 'text', title: 'Outros Horários', payload: 'outrosHorarios' });
		return result; // return object with the result array
	} // pagination

	if (!pageNumber || pageNumber === 1) { // on the first page
		for (const element of dates) { // eslint-disable-line
			if (result.length <= 8) { // grab only the first 9 elements
				await result.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });
			}
		}
		result.push({ content_type: 'text', title: 'Próximo', payload: `nextHour${ymd}` }); // add next button
	} else { // if not on the first page, add a button to go back to previous options
		result.push({ content_type: 'text', title: 'Anterior', payload: `previousHour${ymd}` }); // add Anterior button
		let lastQuota;
		let index = 0;
		for (const element of dates) { // eslint-disable-line
			// get the index of only the elements after the first 9 elements (multiplied by the page number) and limit the number of elements in the array
			if (index >= 9 * (pageNumber - 1) && result.length <= 8) {
				result.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });
				lastQuota = element.quota; // update added last quota
			}
			index += 1;
		}

		// if the last quota added is not the same as the last quota present in the dates array there's still some options to add
		if (dates[dates.length - 1].quota !== lastQuota) {
			result.push({ content_type: 'text', title: 'Próximo', payload: `nextHour${ymd}` });
		}
	}

	if (result[result.length - 1].title !== 'Próximo') { // no more dates, show extra option
		result.push({ content_type: 'text', title: 'Outros Horários', payload: 'outrosHorarios' });
	}

	return result;
}

// removes dates that don't have any available hours
async function cleanDates(dates) {
	const result = [];
	if (dates && dates.length > 0) {
		dates.forEach(async (element) => {
			if (element.hours.length !== 0) { result.push(element); }
		});
	}

	return result;
}

async function formatPayload(date) {
	return date.replace('dia', '').replace(/-/g, '');
}

async function orderByDate(original) {
	const dates = original;
	let aux = [];

	// get only the options with actual dates
	for (let i = 0; i < dates.length; i++) { // eslint-disable-line no-plusplus
		const element = dates[i];
		if (element.payload && element.payload.slice(0, 3) === 'dia') {
			aux.push({ date: await formatPayload(element.payload), title: element.title, payload: element.payload	});
		}
	}
	aux = await aux.sort((obj1, obj2) => obj1.date - obj2.date); // order from closest to fartest

	// replace date options
	for (let i = 0; i < dates.length; i++) { // eslint-disable-line no-plusplus
		if (dates[i].payload && dates[i].payload.slice(0, 3) === 'dia') {
			const aux2 = aux.shift();
			dates[i].title = aux2.title;
			dates[i].payload = aux2.payload;
		}
	}

	return dates;
}

module.exports.separateDaysQR = separateDaysQR;
module.exports.separateHoursQR = separateHoursQR;
module.exports.formatHour = formatHour;
module.exports.cleanDates = cleanDates;
module.exports.orderByDate = orderByDate;
module.exports.separateDaysIntoPages = separateDaysIntoPages;
