require('dotenv').config();

const cont = require('./context');
const handler = require('../app/handler');
const flow = require('../app/utils/flow');
const MaAPI = require('../app/chatbot_api');

jest.mock('../app/chatbot_api');
jest.mock('../app/utils/flow');

it('Voltar para o inicio - menu', async () => {
	const context = cont.postbackContext('greetings', 'Voltar para o inicio');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id) });
	await expect(MaAPI.postRecipientMA).toBeCalledWith(`${context.session.user.first_name} ${context.session.user.last_name}`, context.session.user.id, context.state.politicianData.user_id);
	await expect(context.setState).toBeCalledWith({ lastPBpayload: context.event.postback.payload });
	await expect(context.state.lastPBpayload === 'greetings').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'greetings' });
	await expect(MaAPI.logFlowChange).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id,
		context.event.postback.payload, context.event.postback.title);
});

it('Notifications on - menu', async () => {
	const context = cont.postbackContext('notificationOn', 'Ligar Notificacoes', 'notificationOn');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ lastPBpayload: context.event.postback.payload });
	await expect(context.event.postback && context.event.postback.payload === 'greetings').toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: context.state.lastPBpayload });
	await expect(MaAPI.updateBlacklistMA).toBeCalledWith(context.session.user.id, 1);
	await expect(MaAPI.logNotification).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id, 3);
	await expect(context.sendText).toBeCalledWith(flow.notifications.on);
});

it('Notifications off - menu', async () => {
	const context = cont.postbackContext('notificationOff', 'Ligar Notificacoes', 'notificationOff');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ lastPBpayload: context.event.postback.payload });
	await expect(context.event.postback && context.event.postback.payload === 'greetings').toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: context.state.lastPBpayload });
	await expect(MaAPI.updateBlacklistMA).toBeCalledWith(context.session.user.id, 0);
	await expect(MaAPI.logNotification).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id, 4);
	await expect(context.sendText).toBeCalledWith(flow.notifications.off);
});
