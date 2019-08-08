require('dotenv').config();

const cont = require('./context');
const handler = require('../app/handler');
const flow = require('../app/utils/flow');
const MaAPI = require('../app/chatbot_api');
const prepAPI = require('../app/utils/prep_api');
const desafio = require('../app/utils/desafio');
// const help = require('../app/utils/helper');
const timer = require('../app/utils/timer');
const { addNewUser } = require('../app/utils/labels');

jest.mock('../app/chatbot_api');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/timer');
jest.mock('../app/utils/labels');

it('Voltar para o inicio - menu', async () => {
	const context = cont.postbackContext('greetings', 'Voltar para o inicio', 'greetings');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id), ignore: false });
	await expect(MaAPI.postRecipientMA).toBeCalledWith(context.state.politicianData.user_id, {
		fb_id: context.session.user.id,
		name: `${context.session.user.first_name} ${context.session.user.last_name}`,
		gender: context.session.user.gender === 'male' ? 'M' : 'F',
		origin_dialog: 'greetings',
		picture: context.session.user.profile_pic,
		// session: JSON.stringify(context.state),
	});

	await expect(addNewUser).toBeCalledWith(context, prepAPI);
	await expect(timer.deleteTimers).toBeCalledWith(context.session.user.id);

	await expect(context.event.isPostback).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ lastPBpayload: context.event.postback.payload, lastQRpayload: '' });
	await expect(context.setState).toBeCalledWith({ onTextQuiz: false, sendExtraMessages: false, paginationDate: 1, paginationHour: 1, goBackToQuiz: false, goBackToTriagem: false }); // eslint-disable-line
	await expect(context.state.lastPBpayload === 'greetings').toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'greetings' });
	await expect(MaAPI.logFlowChange).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id,
		context.event.postback.payload, context.event.postback.title);

	await expect(context.sendText).toBeCalledWith(flow.greetings.text1);
	await expect(context.sendText).toBeCalledWith(flow.greetings.text2);
	await expect(desafio.asksDesafio).toBeCalledWith(context);
});

it('Notifications on - menu', async () => {
	const context = cont.postbackContext('notificationOn', 'Ligar Notificacoes', 'notificationOn');
	context.state.sentPrepPost = true;
	await handler(context);

	await expect(context.event.isPostback).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ lastPBpayload: context.event.postback.payload, lastQRpayload: '' });
	await expect(context.event.postback && context.event.postback.payload === 'greetings').toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: context.state.lastPBpayload });
	await expect(MaAPI.updateBlacklistMA).toBeCalledWith(context.session.user.id, 1);
	await expect(prepAPI.putRecipientNotification).toBeCalledWith(context.session.user.id, 1);
	await expect(MaAPI.logNotification).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id, 3);
	await expect(context.sendText).toBeCalledWith(flow.notifications.on);
});

it('Notifications off - menu', async () => {
	const context = cont.postbackContext('notificationOff', 'Ligar Notificacoes', 'notificationOff');
	await handler(context);

	await expect(context.event.isPostback).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ lastPBpayload: context.event.postback.payload, lastQRpayload: '' });
	await expect(context.event.postback && context.event.postback.payload === 'greetings').toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: context.state.lastPBpayload });
	await expect(MaAPI.updateBlacklistMA).toBeCalledWith(context.session.user.id, 0);
	await expect(prepAPI.putRecipientNotification).toBeCalledWith(context.session.user.id, 0);
	await expect(MaAPI.logNotification).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id, 4);
	await expect(context.sendText).toBeCalledWith(flow.notifications.off);
});
