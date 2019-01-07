require('dotenv').config();

const MaAPI = require('../app/chatbot_api');
const cont = require('./context');
const { createIssue } = require('../app/send_issue');
const { sendAnswer } = require('../app/utils/sendAnswer');

jest.mock('../app/send_issue');
jest.mock('../app/chatbot_api');

it('send Answer - answer and image', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.knowledge = cont.knowledgeBase;
	context.state.currentTheme = context.state.knowledge.knowledge_base[0]; // eslint-disable-line
	await sendAnswer(context);
	await expect(context.typingOn);
	await expect(context.setState).toBeCalledWith({ currentTheme: await context.state.knowledge.knowledge_base[0] });
	await expect(context.state.currentTheme && (context.state.currentTheme.answer
        || (context.state.currentTheme.saved_attachment_type !== null && context.state.currentTheme.saved_attachment_id !== null))).toBeTruthy();

	await expect(MaAPI.setIntentStatus).toBeCalledWith(context.state.politicianData.user_id, context.session.user.id, context.state.currentIntent, 1);
	await expect(MaAPI.logAskedEntity).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id, context.state.currentTheme.entities[0].id);

	await expect(context.state.currentTheme.answer).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.currentTheme.answer);

	await expect(context.state.currentTheme.saved_attachment_type === 'image').toBeTruthy();
	await expect(context.sendImage).toBeCalledWith({ attachment_id: context.state.currentTheme.saved_attachment_id });
	await expect(context.state.currentTheme.saved_attachment_type === 'video').toBeFalsy();
	await expect(context.state.currentTheme.saved_attachment_type === 'audio').toBeFalsy();

	await expect(context.typingOff);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('send Answer - no answer text and video', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.knowledge = cont.knowledgeBase;
    context.state.currentTheme = context.state.knowledge.knowledge_base[0]; // eslint-disable-line
	context.state.currentTheme.answer = undefined;
	context.state.currentTheme.saved_attachment_type = 'video';
	await sendAnswer(context);
	await expect(context.state.currentTheme && (context.state.currentTheme.answer
        || (context.state.currentTheme.saved_attachment_type !== null && context.state.currentTheme.saved_attachment_id !== null))).toBeTruthy();
	// skipping MaAPI
	await expect(context.state.currentTheme.answer).toBeFalsy();

	await expect(context.state.currentTheme.saved_attachment_type === 'image').toBeFalsy();
	await expect(context.state.currentTheme.saved_attachment_type === 'video').toBeTruthy();
	await expect(context.sendVideo).toBeCalledWith({ attachment_id: context.state.currentTheme.saved_attachment_id });
	await expect(context.state.currentTheme.saved_attachment_type === 'audio').toBeFalsy();

	await expect(context.typingOff);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});


it('send Answer - error case', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.knowledge = cont.knowledgeBase;

	await sendAnswer(context);
	// skipping preparation
	await expect(context.state.currentTheme && (context.state.currentTheme.answer
        || (context.state.currentTheme.saved_attachment_type !== null && context.state.currentTheme.saved_attachment_id !== null))).toBeFalsy();
	await expect(createIssue).toBeCalledWith(context);
});
