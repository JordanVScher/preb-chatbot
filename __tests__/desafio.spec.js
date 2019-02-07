const cont = require('./context');
const desafio = require('../app/utils/desafio');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
// const { checkAnsweredQuiz } = require('../app/utils/checkQR');
const prepApi = require('../app/utils/prep_api');
const { sendMain } = require('../app/utils/mainMenu');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');

it('desafioAceito', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await desafio.desafioAceito(context);

	await expect(context.sendText).toBeCalledWith(flow.desafioAceito.text1);
	await expect(context.sendText).toBeCalledWith(flow.desafioAceito.text2, opt.desafioAceito);
});

it('desafioRecusado', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await desafio.desafioRecusado(context);

	await expect(context.sendText).toBeCalledWith(flow.desafioRecusado.text1);
	await expect(sendMain).toBeCalledWith(context);
});

it('asksDesafio - user finished quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { finished_quiz: 1 };
	await desafio.asksDesafio(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.finished_quiz === 1).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('asksDesafio - user finished quiz ', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	context.state.user = { finished_quiz: 0 };
	await desafio.asksDesafio(context);

	await expect(context.setState).toBeCalledWith({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	await expect(context.state.user.finished_quiz === 1).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.asksDesafio.text1, opt.asksDesafio);
});
