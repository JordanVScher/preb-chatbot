const MaAPI = require('../app/chatbot_api');
const cont = require('./context');
const { createIssue } = require('../app/send_issue');
const { sendAnswer } = require('../app/utils/sendAnswer');
const { separateString } = require('../app/utils/helper');

jest.mock('../app/send_issue');
jest.mock('../app/chatbot_api');

it('send Answer - answer and image', async () => {
	const context = cont.textContext('oi, isso é um teste', 'test');
	context.state.knowledge = cont.knowledgeBase;
	context.state.currentTheme = context.state.knowledge.knowledge_base[0]; // eslint-disable-line
	context.state.resultTexts = { firstString: 'foo', secondString: 'bar' };

	await sendAnswer(context);
	await expect(context.typingOn);
	await expect(context.setState).toBeCalledWith({ currentTheme: await context.state.knowledge.knowledge_base[0] });
	await expect(context.state.currentTheme && (context.state.currentTheme.answer
  || (context.state.currentTheme.saved_attachment_type !== null && context.state.currentTheme.saved_attachment_id !== null))).toBeTruthy();
	await expect(MaAPI.logAskedEntity).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id, context.state.currentTheme.entities[0].id);

	await expect(context.state.currentTheme.answer).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ resultTexts: await separateString(context.state.currentTheme.answer) });
	await expect(context.state.resultTexts && context.state.resultTexts.firstString).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.resultTexts.firstString);
	await expect(context.state.resultTexts.secondString).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(context.state.resultTexts.secondString);

	await expect(context.state.currentTheme.saved_attachment_type === 'image').toBeTruthy();
	await expect(context.Image).toBeCalledWith({ attachment_id: context.state.currentTheme.saved_attachment_id });
	await expect(context.state.currentTheme.saved_attachment_type === 'video').toBeFalsy();
	await expect(context.state.currentTheme.saved_attachment_type === 'audio').toBeFalsy();
	await expect(context.state.currentTheme.saved_attachment_type === 'file').toBeFalsy();

	await expect(context.typingOff);
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
	await expect(context.Video).toBeCalledWith({ attachment_id: context.state.currentTheme.saved_attachment_id });
	await expect(context.state.currentTheme.saved_attachment_type === 'audio').toBeFalsy();
	await expect(context.state.currentTheme.saved_attachment_type === 'file').toBeFalsy();

	await expect(context.typingOff);
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
