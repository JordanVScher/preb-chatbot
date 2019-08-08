const cont = require('./context');
const research = require('../app/utils/research');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const { getRecipientPrep } = require('../app/utils/prep_api');
const { linkIntegrationTokenLabel } = require('../app/utils/labels');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/consulta');
jest.mock('../app/utils/labels');

it('handleToken - success', async () => {
	const context = cont.textContext('123123', 'joinToken');
	await research.handleToken(context, true);

	await expect(context.sendText).toBeCalledWith(flow.joinToken.success);
	await expect(context.setState).toBeCalledWith({ user: await getRecipientPrep(context.session.user.id) });
	await expect(linkIntegrationTokenLabel).toBeCalledWith(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('handleToken - failure', async () => {
	const context = cont.textContext('foobar', 'joinToken');
	await research.handleToken(context, false);

	await expect(context.sendText).toBeCalledWith(flow.joinToken.fail);
	await expect(context.sendText).toBeCalledWith(flow.joinToken.fail2, opt.joinToken);
	await expect(context.setState).toBeCalledWith({ dialog: 'joinTokenErro' });
});
