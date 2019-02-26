const cont = require('./context');
const research = require('../app/utils/research');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const checkQR = require('../app/utils/checkQR');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/checkQR');

it('onTheResearch', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.onTheResearch(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'onTheResearch' });
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text1);
	await expect(context.sendImage).toBeCalledWith(flow.onTheResearch.gif);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text2);
});

it('notEligible', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.notEligible(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'NotEligible' });
	await expect(context.sendText).toBeCalledWith(flow.notEligible.text1, await checkQR.checkMainMenu(context, opt.mainMenu));
});

it('researchSaidNo', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.researchSaidNo(context);

	await expect(context.sendText).toBeCalledWith(flow.notEligible.saidNo);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('researchSaidYes', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.researchSaidYes(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'researchSaidYes' });
	await expect(context.setState).toBeCalledWith({ sendExtraMessages: true });

	await expect(context.sendButtonTemplate).toBeCalledWith(flow.quizYes.text15, opt.TCLE);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.saidYes, await checkQR.checkConsulta(context, opt.saidYes));
});

it('notPart', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.notPart(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'noResearch' });
	await expect(context.sendText).toBeCalledWith(flow.foraPesquisa.text1, await checkQR.checkMainMenu(context, opt.mainMenu));
});
