require('dotenv').config();

const MaAPI = require('../app/chatbot_api.js');
const cont = require('./context');
const { createIssue } = require('../app/send_issue');
const { checkPosition } = require('../app/dialogFlow');
const { sendAnswer } = require('../app/utils/sendAnswer');
const desafio = require('../app/utils/desafio');
// const { getRecipientPrep } = require('../app/utils/prep_api');
const flow = require('../app/utils/flow');
const timer = require('../app/utils/timer');
const { sendMain } = require('../app/utils/mainMenu');

jest.mock('../app/send_issue');
jest.mock('../app/chatbot_api');
jest.mock('../app/utils/sendAnswer');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/flow');
jest.mock('../app/utils/timer');
jest.mock('../app/utils/mainMenu');

it('checkPosition - question with answer', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.knowledge = cont.knowledgeBase;
	await checkPosition(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'checkPositionFunc' });
	await expect(context.state.intentName === 'Fallback').toBeFalsy();
	await context.setState({ knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp) });
	await expect(context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1).toBeTruthy();
	await expect(sendAnswer).toBeCalledWith(context);
});

it('checkPosition - question with no answer', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.user = {};
	await checkPosition(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'checkPositionFunc' });
	await expect(context.state.intentName === 'Fallback').toBeFalsy();
	await context.setState({ knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp) });
	await expect(context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1).toBeFalsy();
	await expect(createIssue).toBeCalledWith(context);
	await expect(sendMain).toBeCalledWith(context);
});

it('checkPosition - Fallback case', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.intentName = 'Fallback';
	await checkPosition(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'checkPositionFunc' });
	await expect(context.state.intentName === 'Fallback').toBeTruthy();
	await expect(createIssue).toBeCalledWith(context);
});

it('checkPosition - quiz case - not finished', async () => {
	const context = cont.textContext('oi, quero fazer o quiz', 'test');
	context.state.user = {};
	context.state.intentName = 'Quiz';
	await checkPosition(context);
	await expect(context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: 'beginQuiz' });
});

it('checkPosition - quiz case - finished', async () => {
	const context = cont.textContext('oi, quero fazer o quiz', 'test');
	context.state.user = { finished_quiz: 1 };
	context.state.intentName = 'Quiz';
	await checkPosition(context);
	await expect(context.state.user.finished_quiz === 1).toBeTruthy();
	await context.sendText(flow.quiz.done);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('checkPosition - quiz case - not finished', async () => {
	const context = cont.textContext('oi, quero fazer o quiz', 'test');
	context.state.user = {};
	context.state.intentName = 'Quiz';
	await checkPosition(context);
	await expect(context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: 'beginQuiz' });
});

it('checkPosition - Inserir Token - no token', async () => {
	const context = cont.textContext('oi, quero ver meu token', 'test');
	context.state.user = {};
	context.state.intentName = 'Inserir Token';
	await checkPosition(context);
	await expect(context.state.user.integration_token && context.state.user.is_part_of_research === 1).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ dialog: 'joinToken' });
});

it('checkPosition - Inserir Token - with token', async () => {
	const context = cont.textContext('oi, quero ver meu token', 'test');
	context.state.user = { integration_token: '123', is_part_of_research: 1 };
	context.state.intentName = 'Inserir Token';
	await checkPosition(context);
	await expect(context.state.user.integration_token && context.state.user.is_part_of_research === 1).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: 'seePrepToken' });
});
