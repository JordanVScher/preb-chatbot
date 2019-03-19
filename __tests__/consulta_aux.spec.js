require('dotenv').config();
// const help = require('../app/utils/helper');
const aux = require('../app/utils/consulta-aux');
const mockDates = require('./dates');

// jest.mock('../app/utils/helper');

it('cleanDates', async () => {
	const result = await aux.cleanDates(mockDates.emptyHour);
	await expect(result.length === 1).toBeTruthy();
});

it('formatHour', async () => {
	const result = await aux.formatHour('08:00:00 - 08:30:00');
	await expect(result === '08:00 - 08:30').toBeTruthy();
});

it('separateDaysQR - less than 8', async () => {
	const original = await mockDates.generateDate(4);
	const result = await aux.separateDaysQR(original, [], 1);

	await expect(original.length + 1 === result.length).toBeTruthy(); // + 1 -> "outrasDatas" button
	await expect(result[result.length - 1].payload === 'outrasDatas').toBeTruthy();
});

it('separateDaysQR - less than 8 with previous', async () => {
	const original = await mockDates.generateDate(4);
	const result = await aux.separateDaysQR(original, [], 2);

	await expect(result[0].payload === 'previousDay').toBeTruthy();
	await expect(original.length + 2 === result.length).toBeTruthy();// + 2 -> "outrasDatas" and "previousDay" button
	await expect(result[result.length - 1].payload === 'outrasDatas').toBeTruthy();
});

it('separateDaysQR - with pagination next', async () => {
	const original = await mockDates.generateDate(8);
	const result = await aux.separateDaysQR(original, { dates: await mockDates.generateDate(4) }, 1);

	await expect(original.length + 1 === result.length).toBeTruthy(); // + 1 -> "nextDay" button
	await expect(result[result.length - 1].payload === 'nextDay').toBeTruthy();
});

it('separateDaysQR - with pagination next and previous', async () => {
	const original = await mockDates.generateDate(8);
	const result = await aux.separateDaysQR(original, { dates: await mockDates.generateDate(4) }, 2);

	await expect(result[0].payload === 'previousDay').toBeTruthy();
	await expect(original.length + 2 === result.length).toBeTruthy(); // + 2 -> "nextDay" and "previousDay" button
	await expect(result[result.length - 1].payload === 'nextDay').toBeTruthy();
});

const ymd = '20190312';

it('separateHoursQR - less than 10 hours', async () => {
	const original = await mockDates.generateHour(5);
	const result = await aux.separateHoursQR(original, ymd, 1);

	await expect(original.length === result.length).toBeTruthy();
});

it('separateHoursQR - more than 10, on the first page', async () => {
	const original = await await mockDates.generateHour(15);
	const result = await aux.separateHoursQR(original, ymd, 1);

	await expect(result.length === 10).toBeTruthy();
	await expect(result[result.length - 1].payload === `nextHour${ymd}`).toBeTruthy();
});

it('separateHoursQR - more than 10, on the second page', async () => {
	const pageNumber = 2;
	const original = await await mockDates.generateHour(15);
	const result = await aux.separateHoursQR(original, ymd, pageNumber);

	await expect(result[0].payload === `previousHour${ymd}`).toBeTruthy();
	await expect((result.length - 1) <= original.length - (9 * (pageNumber - 1))).toBeTruthy();
	await expect(result[result.length - 1].payload === `nextHour${ymd}`).toBeFalsy();
});

it('separateHoursQR - more than 10, on the second page', async () => {
	const pageNumber = 2;
	const original = await await mockDates.generateHour(18);
	const result = await aux.separateHoursQR(original, ymd, pageNumber);

	await expect(result[0].payload === `previousHour${ymd}`).toBeTruthy();
	await expect((result.length - 1) <= original.length - (9 * (pageNumber - 1))).toBeTruthy();
	await expect(result[result.length - 1].payload === `nextHour${ymd}`).toBeTruthy();
});
