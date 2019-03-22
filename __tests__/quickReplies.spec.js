require('dotenv').config();

const cont = require('./context');
const flow = require('../app/utils/flow');
const handler = require('../app/handler');
// const MaAPI = require('../app/chatbot_api');
// const desafio = require('../app/utils/desafio');
const quiz = require('../app/utils/quiz');
// const prepAPI = require('../app/utils/prep_api');
// const research = require('../app/utils/research');
// const mainMenu = require('../app/utils/mainMenu');
// const { sendMain } = require('../app/utils/mainMenu');
// const help = require('../app/utils/helper');

jest.mock('../app/utils/helper');
jest.mock('../app/chatbot_api');
jest.mock('../app/utils/flow');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/quiz');
jest.mock('../app/utils/research');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/prep_api'); // mock prep_api tp avoid making the postRecipientPrep request

it('quiz - begin', async () => {
	const context = cont.quickReplyContext('beginQuiz', 'greetings');
	// usual quickReply checking here
	context.state.dialog = context.state.lastQRpayload;
	await handler(context);

	await expect(context.sendText).toBeCalledWith(flow.quiz.beginQuiz);
	await expect(quiz.answerQuizA).toBeCalledWith(context);
});

it('quiz - multiple choice answer', async () => { // user clicked on option 3
	const context = cont.quickReplyContext('quiz3', 'beginQuizA');
	await handler(context);

	await expect(context.event.isQuickReply).toBeTruthy();	// usual quickReply checking
	await expect(context.setState).toBeCalledWith({ lastQRpayload: context.event.quickReply.payload });
	await expect(context.state.lastQRpayload.slice(0, 4) === 'quiz').toBeTruthy();

	await expect(quiz.handleAnswerA).toBeCalledWith(context, context.state.lastQRpayload.replace('quiz', ''));
});

it('quiz - multiple choice extra answer', async () => { // user clicked on extra option
	const context = cont.quickReplyContext('extraQuestion3', 'beginQuizA');
	await handler(context);

	await expect(context.event.isQuickReply).toBeTruthy();	// usual quickReply checking
	await expect(context.setState).toBeCalledWith({ lastQRpayload: context.event.quickReply.payload });
	await expect(context.state.lastQRpayload.slice(0, 4) === 'quiz').toBeFalsy();
	await expect(context.state.lastQRpayload.slice(0, 13) === 'extraQuestion').toBeTruthy();
	await expect(quiz.AnswerExtraQuestion).toBeCalledWith(context);
});
