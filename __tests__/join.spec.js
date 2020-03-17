const cont = require('./context');
const join = require('../app/utils/join');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const { getRecipientPrep } = require('../app/utils/prep_api');
const { linkIntegrationTokenLabel } = require('../app/utils/labels');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/labels');

it('handlePrepToken - success', async () => {
	const context = cont.textContext('123123', 'joinToken');
	await join.handlePrepToken(context, true);

	await expect(context.sendText).toBeCalledWith(flow.joinToken.success);
	await expect(context.setState).toBeCalledWith({ user: await getRecipientPrep(context.session.user.id) });
	await expect(linkIntegrationTokenLabel).toBeCalledWith(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'mainMenu' });
});

it('handlePrepToken - failure', async () => {
	const context = cont.textContext('foobar', 'joinToken');
	await join.handlePrepToken(context, false);

	await expect(context.sendText).toBeCalledWith(flow.joinToken.fail);
	await expect(context.sendText).toBeCalledWith(flow.joinToken.fail2, opt.joinToken);
	await expect(context.setState).toBeCalledWith({ dialog: 'joinTokenErro' });
});
