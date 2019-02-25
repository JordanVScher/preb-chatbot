const help = require('./helper');

async function separateDaysQR(dates) {
	if (dates.length <= 10) { // less han 10 options, no need for pagination
		const result = [];
		dates.forEach(async (element) => {
			const date = new Date(`${element.ymd}T00:00:00`); // new date from ymd
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

		const date = new Date(`${element.hours[0].datetime_start}`);
		set.push({ content_type: 'text', title: `${date.getDate()}/${date.getMonth() + 1} - ${help.weekDayName[date.getDay()]}`, payload: `dia${element.ymd}` });


		if (set.length % 9 === 0) { // time to add 'next' button at the 10th position
		// % 9 -> next is the "tenth" position for the set OR what remains before completing 10 positions for the new set (e.g. ->  47 - 40 = 7)
		// console.log('entrei aqui', index + 1);

			set.push({ content_type: 'text', title: 'Próximo', payload: `nextDay${page + 1}` }); // adding next button to set
			result[page] = set; // adding set/page to result
			page += 1; // next page
			set = []; // cleaning set
		}
	});

	if (set.length > 0) { // check if there's any left over options that didn't make the cut
		result[page] = set; // adding set/page to result
		page += 1; // next page
		set = []; // cleaning set
	}

	return result;
}


async function formatHour(hour) {
	let result = hour;
	result = result.slice(0, 5);
	result = `${result}${hour.slice(8, 16)}`;

	return result;
}

async function separateHoursQR(dates) {
	if (dates.length <= 10) { // less han 10 options, no need for pagination
		const result = [];
		dates.forEach(async (element) => {
			result.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });
		});
		return { 0: result }; // return object with the result array
	} // else

	// more than 10 options, we need pagination
	let page = 0; // the page number
	let set = [];
	const result = {};

	dates.forEach(async (element, index) => {// eslint-disable-line
		if (page > 0 && set.length === 0) {
			set.push({ content_type: 'text', title: 'Anterior', payload: `nextHour${page - 1}` }); // adding previous button to set
		}
		set.push({ content_type: 'text', title: `As ${await formatHour(element.time)}`, payload: `hora${element.quota}` });

		if (set.length % 9 === 0) { // time to add 'next' button at the 10th position
			// % 9 -> next is the "tenth" position for the set OR what remains before completing 10 positions for the new set (e.g. ->  47 - 40 = 7)
			// console.log('entrei aqui', index + 1);

			set.push({ content_type: 'text', title: 'Próximo', payload: `nextHour${page + 1}` }); // adding next button to set
			result[page] = set; // adding set/page to result
			page += 1; // next page
			set = []; // cleaning set
		}
	});
	if (set.length > 0) { // check if there's any left over options that didn't make the cut
		result[page] = set; // adding set/page to result
		page += 1; // next page
		set = []; // cleaning set
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
