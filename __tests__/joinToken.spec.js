const cont = require('./context');
const joinToken = require('../app/utils/joinToken');
const { join } = require('../app/utils/flow');
const { getQR } = require('../app/utils/attach');
const { getRecipientPrep } = require('../app/utils/prep_api');
const { linkIntegrationTokenLabel } = require('../app/utils/labels');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/labels');
jest.mock('../app/utils/attach');

it('handlePrepToken - success', async () => {
	const context = cont.textContext('123123', 'joinToken');
	await joinToken.handlePrepToken(context, true);

	await expect(context.sendText).toBeCalledWith(join.askPrep.success);
	await expect(context.setState).toBeCalledWith({ user: await getRecipientPrep(context.session.user.id) });
	await expect(linkIntegrationTokenLabel).toBeCalledWith(context);
	await expect(context.setState).toBeCalledWith({ dialog: 'tokenConfirma' });
});

it('handlePrepToken - failure', async () => {
	const context = cont.textContext('foobar', 'joinToken');
	await joinToken.handlePrepToken(context, false);

	await expect(context.sendText).toBeCalledWith(join.askPrep.fail1);
	await expect(context.sendText).toBeCalledWith(join.askPrep.fail2, await getQR(join.askPrep));
	await expect(context.setState).toBeCalledWith({ dialog: 'joinPrepErro' });
});
