const cont = require('./context');
const research = require('../app/utils/research');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const checkQR = require('../app/utils/checkQR');
const { checarConsulta } = require('../app/utils/consulta');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/consulta');

it('onTheResearch', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.onTheResearch(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'onTheResearch' });
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.text2);

	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.AC5);
	await expect(context.sendButtonTemplate).toBeCalledWith(flow.quizYes.text1, opt.artigoLink);
	await expect(context.sendText).toBeCalledWith(flow.onTheResearch.extra, opt.onTheResearch);
});

it('notEligible', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.notEligible(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'NotEligible' });
	await expect(context.sendText).toBeCalledWith(flow.notEligible.text1, await checkQR.checkMainMenu(context, opt.mainMenu));
});

it('researchSaidYes', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.researchSaidYes(context);

	await context.setState({ categoryConsulta: 'recrutamento' });
	await expect(context.setState).toBeCalledWith({ sendExtraMessages: true });
	await expect(checarConsulta).toBeCalledWith(context);
});

it('notPart', async () => {
	const context = cont.quickReplyContext('0', 'prompt');
	await research.notPart(context);

	await expect(context.setState).toBeCalledWith({ dialog: 'noResearch' });
	await expect(context.sendText).toBeCalledWith(flow.foraPesquisa.text1, await checkQR.checkMainMenu(context, opt.mainMenu));
});
