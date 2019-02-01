require('dotenv').config();

const handler = require('../app/handler');
const MaAPI = require('../app/chatbot_api');
// const flow = require('../app/utils/flow');
const cont = require('./context');
// const timer = require('../app/utils/timer');
const help = require('../app/utils/helper');
const { createIssue } = require('../app/send_issue');
const { apiai } = require('../app/utils/helper');
const { checkPosition } = require('../app/dialogFlow');

jest.mock('../app/send_issue');
jest.mock('../app/utils/helper');
jest.mock('../app/chatbot_api');
// jest.mock('../app/utils/timer');
jest.mock('../app/dialogFlow');
jest.mock('../app/utils/prep_api'); // mock prep_api tp avoid making the postRecipientPrep request

it('Loading data and Free text - DF disabled', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.politicianData.use_dialogflow = 0; // test text with use_dialogflow === 0
	await handler(context);
	// await expect(timer.createFollowUpTimer).toBeCalledWith(context.session.user.id, context);
	await expect(context.setState).toBeCalledWith({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id) });
	await expect(context.setState).toBeCalledWith({ whatWasTyped: context.event.message.text });
	await expect(context.state.whatWasTyped === process.env.GET_PERFILDATA).toBeFalsy();
	await expect(context.state.whatWasTyped === process.env.TEST_KEYWORD).toBeFalsy();
	await expect(context.state.politicianData.use_dialogflow === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: 'prompt' });
	await expect(createIssue).toBeCalledWith(context);
});

it('Free text - DF enabled', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.politicianData.use_dialogflow = 1; // default
	await handler(context);
	await expect(context.setState).toBeCalledWith({ whatWasTyped: context.event.message.text });
	await expect(context.state.whatWasTyped === process.env.GET_PERFILDATA).toBeFalsy();
	await expect(context.state.whatWasTyped === process.env.TEST_KEYWORD).toBeFalsy();
	await expect(context.state.politicianData.use_dialogflow === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({
		apiaiResp: await apiai.textRequest(
			await help.formatDialogFlow(context.state.whatWasTyped), { sessionId: context.session.user.id },
		),
	});
	await expect(context.setState).toBeCalledWith({ intentName: context.state.apiaiResp.result.metadata.intentName });
	await expect(checkPosition).toBeCalledWith(context);
});
