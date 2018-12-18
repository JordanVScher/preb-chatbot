require('dotenv').config();

const handler = require('../app/handler');
const MaAPI = require('../app/chatbot_api.js');
// const flow = require('../app/utils/flow');
const cont = require('./context');
const timer = require('../app/utils/timer');
const { createIssue } = require('../app/send_issue');
const { apiai } = require('../app/utils/helper');
const { checkPosition } = require('../app/dialogFlow');

jest.mock('../app/send_issue');
jest.mock('../app/utils/helper');
jest.mock('../app/chatbot_api.js');
jest.mock('../app/utils/timer');
jest.mock('../app/dialogFlow');


it('Loading data and Free text - DF disabled', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.politicianData.use_dialogflow = 0; // test text with use_dialogflow === 0
	await handler(context);
	await expect(timer.createFollowUpTimer).toBeCalledWith(context.session.user.id, context);
	await expect(context.setState).toBeCalledWith({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id) });
	await expect(context.setState).toBeCalledWith({ whatWasTyped: context.event.message.text });
	await expect(context.state.politicianData.use_dialogflow === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });
	await expect(createIssue).toBeCalledWith(context);
});

it('Free text - DF enabled', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ whatWasTyped: context.event.message.text });
	await expect(context.state.politicianData.use_dialogflow === 1).toBeTruthy();
	await expect(context.state.whatWasTyped.length <= 255).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ toSend: context.state.whatWasTyped });
	await expect(context.setState).toBeCalledWith({ apiaiResp: await apiai.textRequest(context.state.toSend, { sessionId: context.session.user.id }) });
	await expect(context.setState).toBeCalledWith({ intentName: context.state.apiaiResp.result.metadata.intentName });
	await expect(checkPosition).toBeCalledWith(context);
});

it('Free text - Too many characters', async () => {
	const largetext = 'Estou sentado num escritório, cercado de cabeças e corpos. Minha postura está conscientemente moldada ao formato da cadeira dura. '
	+ 'Trata-se de uma sala fria da Administração da Universidade, com paredes revestidas de madeira e enfeitadas com Remingtons, janelas duplas contra o calor '
	+ 'de novembro, insulada dos sons administrativos pela área da recepção à sua frente, onde o Tio Charles, o sr.deLint e eu tínhamos sido recebidos um pouco antes.';

	const context = cont.textContext(largetext, 'test');
	await handler(context);
	await expect(context.setState).toBeCalledWith({ whatWasTyped: context.event.message.text });
	await expect(context.state.politicianData.use_dialogflow === 1).toBeTruthy();
	await expect(context.state.whatWasTyped.length <= 255).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ toSend: context.state.whatWasTyped.slice(0, 255) });
	await expect(context.setState).toBeCalledWith({ apiaiResp: await apiai.textRequest(context.state.toSend, { sessionId: context.session.user.id }) });
	await expect(context.setState).toBeCalledWith({ intentName: context.state.apiaiResp.result.metadata.intentName });
	await expect(checkPosition).toBeCalledWith(context);
});
