module.exports.emptyHour = [
	{
		appointment_window_id: 1,
		hours: [
			{
				datetime_end: '2019-03-12T08:30:00',
				datetime_start: '2019-03-12T08:00:00',
				quota: 1,
				time: '08:00:00 - 08:30:00',
			},
		],
		ymd: '2019-03-12',
	},
	{
		appointment_window_id: 2,
		hours: [],
		ymd: '2019-03-13',
	},
	{
		appointment_window_id: 3,
		hours: [],
		ymd: '2019-03-14',
	},
];

module.exports.generateDate = async (howMany) => {
	const result = [];
	let index = 1;
	while (index <= howMany) {
		result.push({
			appointment_window_id: index,
			hours: [
				{
					datetime_end: '2019-03-12T08:30:00',
					datetime_start: '2019-03-12T08:00:00',
					quota: index,
					time: '08:00:00 - 08:30:00',
				},
			],
			ymd: '2019-03-12',
		});
		index += 1;
	}

	return result;
};


module.exports.generateHour = async (howMany) => {
	const result = [];
	let index = 1;
	while (index <= howMany) {
		result.push({
			datetime_end: '2019-03-12T08:30:00',
			datetime_start: '2019-03-12T08:00:00',
			quota: index,
			time: '08:00:00 - 08:30:00',
		});
		index += 1;
	}

	return result;
};
