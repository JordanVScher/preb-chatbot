require('dotenv').config();

const MaAPI = require('../app/chatbot_api.js');
const cont = require('./context');
const { createIssue } = require('../app/send_issue');
const { checkPosition } = require('../app/dialogFlow');
const { sendAnswer } = require('../app/utils/sendAnswer');
const desafio = require('../app/utils/desafio');

jest.mock('../app/send_issue');
jest.mock('../app/chatbot_api');
jest.mock('../app/utils/sendAnswer');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/helper');

it('checkPosition - question with answer', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.knowledge = cont.knowledgeBase;
	await checkPosition(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'checkPositionFunc' });
	await expect(context.state.intentName === 'Fallback').toBeFalsy();
	await context.setState({ knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp) });
	await expect(context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1).toBeTruthy();
	await expect(sendAnswer).toBeCalledWith(context);
	await expect(desafio.followUpIntent).toBeCalledWith(context);
});

it('checkPosition - question with no answer', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	await checkPosition(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'checkPositionFunc' });
	await expect(context.state.intentName === 'Fallback').toBeFalsy();
	await context.setState({ knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp) });
	await expect(context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1).toBeFalsy();
	await expect(createIssue).toBeCalledWith(context);
	await expect(desafio.followUpIntent).toBeCalledWith(context);
});

it('checkPosition - Fallback case', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.intentName = 'Fallback';
	await checkPosition(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'checkPositionFunc' });
	await expect(context.state.intentName === 'Fallback').toBeTruthy();
	await expect(createIssue).toBeCalledWith(context);
	await expect(desafio.followUpIntent).toBeCalledWith(context);
});
