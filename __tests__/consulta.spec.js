const cont = require('./context');
const consulta = require('../app/utils/consulta');
const aux = require('../app/utils/consulta-aux');
const opt = require('../app/utils/options');
const flow = require('../app/utils/flow');
const prepApi = require('../app/utils/prep_api');
const help = require('../app/utils/helper');
const { sendMain } = require('../app/utils/mainMenu');

jest.mock('../app/utils/options');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/flow');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/consulta-aux');

describe('sendSalvador', async () => {
	it('city 2 - send salvador msg', async () => {
		const context = cont.quickReplyContext();
		context.state.user = { city: 2 };
		await consulta.sendSalvador(context);

		await expect(context.sendText).toBeCalledWith(flow.consulta.salvadorMsg);
		await expect(flow.consulta.salvadorMsg).toBeTruthy();
	});

	it('city 3 - dont send salvador msg', async () => {
		const context = cont.quickReplyContext();
		context.state.user = { city: 3 };
		await consulta.sendSalvador(context);

		await expect(context.sendText).not.toBeCalledWith(flow.consulta.salvadorMsg);
	});
});

it('loadCalendar', async () => {
	const context = cont.quickReplyContext();
	context.state.calendar = { dates: [] };

	await consulta.loadCalendar(context);

	await expect(context.setState).toBeCalledWith({ paginationDate: 1, paginationHour: 1 });
	await expect(context.setState).toBeCalledWith({ calendar: await prepApi.getAvailableDates(context.session.user.id, context.state.calendarID, context.state.paginationDate) });
	await expect(context.setState).toBeCalledWith({ calendar: await context.state.calendar.dates.sort((obj1, obj2) => new Date(obj1.ymd) - new Date(obj2.ymd)) });
	await expect(context.setState).toBeCalledWith({ calendar: await aux.cleanDates(context.state.calendar) });
	await expect(context.setState).toBeCalledWith({ calendar: await aux.separateDaysIntoPages(context.state.calendar) });
});

describe('startConsulta', async () => {
	it('user is not target_audience - cant schedule consulta', async () => {
		const context = cont.quickReplyContext();
		context.state.user = { is_target_audience: 0 };

		await consulta.startConsulta(context);

		await expect(sendMain).toBeCalledWith(context);
	});

	it('user has left contact info - cant schedule consulta', async () => {
		const context = cont.quickReplyContext();
		context.state.user = { is_target_audience: 1 };
		context.state.leftContact = true;

		await consulta.startConsulta(context);

		await expect(sendMain).toBeCalledWith(context);
	});
});
