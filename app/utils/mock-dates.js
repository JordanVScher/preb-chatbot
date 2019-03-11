const mockDates = {
	1: {
		dates: [
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 5,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 6,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 7,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 8,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 9,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 10,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 11,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 12,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 13,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 14,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 15,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 16,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 17,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 18,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 19,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 20,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 21,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 22,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 23,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 24,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 25,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 26,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 27,
						time: '09:30:00 - 10:00:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 28,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 29,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 30,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-11',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-12T08:30:00',
						datetime_start: '2019-03-12T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-12T09:00:00',
						datetime_start: '2019-03-12T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-12T09:30:00',
						datetime_start: '2019-03-12T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-12T10:00:00',
						datetime_start: '2019-03-12T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-12',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-13T08:30:00',
						datetime_start: '2019-03-13T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-13T09:00:00',
						datetime_start: '2019-03-13T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-13T09:30:00',
						datetime_start: '2019-03-13T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-13T10:00:00',
						datetime_start: '2019-03-13T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-13',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-11',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-12T08:30:00',
						datetime_start: '2019-03-12T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-12T09:00:00',
						datetime_start: '2019-03-12T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-12T09:30:00',
						datetime_start: '2019-03-12T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-12T10:00:00',
						datetime_start: '2019-03-12T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-12',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-13T08:30:00',
						datetime_start: '2019-03-13T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-13T09:00:00',
						datetime_start: '2019-03-13T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-13T09:30:00',
						datetime_start: '2019-03-13T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-13T10:00:00',
						datetime_start: '2019-03-13T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-13',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-11',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-12T08:30:00',
						datetime_start: '2019-03-12T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-12T09:00:00',
						datetime_start: '2019-03-12T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-12T09:30:00',
						datetime_start: '2019-03-12T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-12T10:00:00',
						datetime_start: '2019-03-12T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-12',
			},
		],
	},
	2: {
		dates: [
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-11',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-12T08:30:00',
						datetime_start: '2019-03-12T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-12T09:00:00',
						datetime_start: '2019-03-12T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-12T09:30:00',
						datetime_start: '2019-03-12T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-12T10:00:00',
						datetime_start: '2019-03-12T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-12',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-13T08:30:00',
						datetime_start: '2019-03-13T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-13T09:00:00',
						datetime_start: '2019-03-13T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-13T09:30:00',
						datetime_start: '2019-03-13T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-13T10:00:00',
						datetime_start: '2019-03-13T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-13',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-11',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-12T08:30:00',
						datetime_start: '2019-03-12T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-12T09:00:00',
						datetime_start: '2019-03-12T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-12T09:30:00',
						datetime_start: '2019-03-12T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-12T10:00:00',
						datetime_start: '2019-03-12T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-12',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-13T08:30:00',
						datetime_start: '2019-03-13T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-13T09:00:00',
						datetime_start: '2019-03-13T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-13T09:30:00',
						datetime_start: '2019-03-13T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-13T10:00:00',
						datetime_start: '2019-03-13T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-13',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-11',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-12T08:30:00',
						datetime_start: '2019-03-12T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-12T09:00:00',
						datetime_start: '2019-03-12T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-12T09:30:00',
						datetime_start: '2019-03-12T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-12T10:00:00',
						datetime_start: '2019-03-12T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-12',
			},

		],
	},
	3: {
		dates: [
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-11T08:30:00',
						datetime_start: '2019-03-11T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-11T09:00:00',
						datetime_start: '2019-03-11T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-11T09:30:00',
						datetime_start: '2019-03-11T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-11T10:00:00',
						datetime_start: '2019-03-11T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-11',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-12T08:30:00',
						datetime_start: '2019-03-12T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-12T09:00:00',
						datetime_start: '2019-03-12T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-12T09:30:00',
						datetime_start: '2019-03-12T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-12T10:00:00',
						datetime_start: '2019-03-12T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-12',
			},
			{
				appointment_window_id: 1,
				hours: [
					{
						datetime_end: '2019-03-13T08:30:00',
						datetime_start: '2019-03-13T08:00:00',
						quota: 1,
						time: '08:00:00 - 08:30:00',
					},
					{
						datetime_end: '2019-03-13T09:00:00',
						datetime_start: '2019-03-13T08:30:00',
						quota: 2,
						time: '08:30:00 - 09:00:00',
					},
					{
						datetime_end: '2019-03-13T09:30:00',
						datetime_start: '2019-03-13T09:00:00',
						quota: 3,
						time: '09:00:00 - 09:30:00',
					},
					{
						datetime_end: '2019-03-13T10:00:00',
						datetime_start: '2019-03-13T09:30:00',
						quota: 4,
						time: '09:30:00 - 10:00:00',
					},
				],
				ymd: '2019-03-13',
			},

		],
	},
};

module.exports.mockDates = mockDates;
