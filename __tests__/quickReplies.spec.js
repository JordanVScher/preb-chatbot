const cont = require('./context');
const flow = require('../app/utils/flow');
const handler = require('../app/handler');
const MaAPI = require('../app/chatbot_api');
const quiz = require('../app/utils/quiz');
const prepAPI = require('../app/utils/prep_api');
const consulta = require('../app/utils/consulta');
const mainMenu = require('../app/utils/mainMenu');

jest.mock('../app/utils/helper');
jest.mock('../app/chatbot_api');
jest.mock('../app/utils/flow');
jest.mock('../app/utils/consulta');
jest.mock('../app/utils/quiz');
jest.mock('../app/utils/research');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/prep_api'); // mock prep_api tp avoid making the postRecipientPrep request

it('quiz - begin', async () => {
	const context = cont.quickReplyContext('beginQuiz', 'greetings');
	// usual quickReply checking here
	context.state.dialog = context.state.lastQRpayload;
	await handler(context);

	await expect(context.setState).toBeCalledWith({ startedQuiz: true });
	await expect(context.sendText).toBeCalledWith(flow.quiz.beginQuiz);
	await expect(quiz.answerQuizA).toBeCalledWith(context);
});

it('quiz - multiple choice answer', async () => {
	const context = cont.quickReplyContext('quiz3', 'beginQuizA');
	await handler(context);

	await expect(context.event.isQuickReply).toBeTruthy();
	await expect(context.state.lastQRpayload !== context.event.quickReply.payload).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ lastQRpayload: context.event.quickReply.payload });
	await expect(MaAPI.logFlowChange).toBeCalledWith(context.session.user.id, context.state.politicianData.user_id,
		context.event.message.quick_reply.payload, context.event.message.quick_reply.payload);
	await expect(context.state.lastQRpayload.slice(0, 4) === 'quiz').toBeTruthy();

	await expect(quiz.handleAnswerA).toBeCalledWith(context, context.state.lastQRpayload.replace('quiz', ''));
});

it('quiz - multiple choice extra answer', async () => {
	const context = cont.quickReplyContext('extraQuestion3', 'beginQuizA');
	await handler(context);

	await expect(context.event.isQuickReply).toBeTruthy();	// usual quickReply checking
	await expect(context.setState).toBeCalledWith({ lastQRpayload: context.event.quickReply.payload });
	await expect(context.state.lastQRpayload.slice(0, 4) === 'quiz').toBeFalsy();
	await expect(context.state.lastQRpayload.slice(0, 13) === 'extraQuestion').toBeTruthy();
	await expect(quiz.AnswerExtraQuestion).toBeCalledWith(context);
});

it('termos - aceitaTermos - has registrationForm', async () => {
	const context = cont.quickReplyContext('aceitaTermos', 'aceitaTermos');
	context.state.registrationForm = 'foobar.com';
	await handler(context);

	await expect(context.setState).toBeCalledWith({ preCadastro: await prepAPI.postSignature(context.session.user.id, 1) });
	await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
	await expect(context.state.registrationForm).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryConsulta: 'recrutamento' });
	await expect(context.setState).toBeCalledWith({ sendExtraMessages: true });
	await expect(consulta.checarConsulta).toBeCalledWith(context);
});

it('termos - aceitaTermos2 - not registrationForm', async () => {
	const context = cont.quickReplyContext('aceitaTermos2', 'aceitaTermos2');

	await handler(context);

	await expect(context.setState).toBeCalledWith({ preCadastro: await prepAPI.postSignature(context.session.user.id, 1) });
	await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
	await expect(context.state.registrationForm).toBeFalsy();
	await expect(mainMenu.sendMain).toBeCalledWith(context);
});

it('termos - naoAceitaTermos - is_eligible_for_research', async () => {
	const context = cont.quickReplyContext('naoAceitaTermos', 'naoAceitaTermos');
	context.state.registrationForm = 'foobar.com';
	await handler(context);

	await expect(context.setState).toBeCalledWith({ preCadastro: await prepAPI.postSignature(context.session.user.id, 1) });
	await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
	await expect(context.state.registrationForm).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ categoryConsulta: 'recrutamento' });
	await expect(context.setState).toBeCalledWith({ sendExtraMessages: true });
	await expect(consulta.checarConsulta).toBeCalledWith(context);
});

it('termos - naoAceitaTermos - not eligible_for_research', async () => {
	const context = cont.quickReplyContext('naoAceitaTermos', 'naoAceitaTermos');
	context.state.user = { is_eligible_for_research: 0 };
	await handler(context);

	await expect(context.setState).toBeCalledWith({ preCadastro: await prepAPI.postSignature(context.session.user.id, 0) });
	await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.naoAceitaTermos);
	await expect(context.state.user.is_eligible_for_research === 1).toBeFalsy();
	await expect(mainMenu.sendMain).toBeCalledWith(context);
});

it('joinResearchAfter', async () => {
	const context = cont.quickReplyContext('joinResearchAfter', 'joinResearchAfter');
	context.state.user = { is_eligible_for_research: 0 };
	await handler(context);

	await expect(prepAPI.putUpdatePartOfResearch).toBeCalledWith(context.session.user.id, 1);
	await expect(context.setState).toBeCalledWith({ categoryConsulta: 'recrutamento', sendExtraMessages: true });
	await expect(consulta.checarConsulta).toBeCalledWith(context);
});
