const help = require('./helper');

async function separateDaysQR(dates, next, pageNumber) {
	const dateOptions = [];

	if (pageNumber > 1) { // if not on the first page, add a button to go back to previous options
		dateOptions.push({ content_type: 'text', title: 'Anterior', payload: 'previousDay' });
	}

	dates.forEach(async (element) => { // add dates (maximum of 8)
		const date = new Date(`${element.hours[0].datetime_start}`);
		dateOptions.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.ymd}` });
	});

	if (next && next.dates && next.dates.length > 0) { // if there's still dates to send, add a button to load them
		dateOptions.push({ content_type: 'text', title: 'Próximo', payload: 'nextDay' });
	} else { // no more dates, show extra option
		dateOptions.push({ content_type: 'text', title: 'Outras Datas', payload: 'outrasDatas' });
	}

	return dateOptions;
}

async function formatHour(hour) {
	let result = hour;
	result = await result.slice(0, 5);
	result = await `${result}${hour.slice(8, 16)}`;
	return result;
}

async function separateHoursQR(dates, ymd, pageNumber) {
	const result = [];

	if (dates.length <= 10) { // less han 10 options, no need for pagination
		for (const element of dates) { // eslint-disable-line
			await result.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });
		}
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

	return result;
}

// removes dates that don't have any available hours
async function cleanDates(dates) {
	const result = [];
	dates.forEach(async (element) => {
		if (element.hours.length !== 0) { result.push(element); }
	});

	return result;
}

module.exports.separateDaysQR = separateDaysQR;
module.exports.separateHoursQR = separateHoursQR;
module.exports.formatHour = formatHour;
module.exports.cleanDates = cleanDates;
