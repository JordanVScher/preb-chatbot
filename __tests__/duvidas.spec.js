const cont = require('./context');
const duvidas = require('../app/utils/duvidas');
const flow = require('../app/utils/flow');
const { sendMain } = require('../app/utils/mainMenu');
const { getQR } = require('../app/utils/attach');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/attach');

describe('prepFollowUp - Dúvidas para PrER seguimento', async () => {
	it('SUS - MG', async () => {
		const context = cont.quickReplyContext('duvidasPrep', 'duvidasPrep');
		context.state.user.voucher_type = 'sus';
		context.state.user.city = '1';
		await duvidas.prepFollowUp(context);

		await expect(context.sendText).toBeCalledWith(flow.duvidasPrep.prefixSUS + flow.duvidasPrep.textosSUS[context.state.user.city]);
		await expect(sendMain).toBeCalledWith(context);
	});

	it('SUS - BA', async () => {
		const context = cont.quickReplyContext('duvidasPrep', 'duvidasPrep');
		context.state.user.voucher_type = 'sus';
		context.state.user.city = 2;
		await duvidas.prepFollowUp(context);

		await expect(context.sendText).toBeCalledWith(flow.duvidasPrep.prefixSUS + flow.duvidasPrep.textosSUS[context.state.user.city]);
		await expect(sendMain).toBeCalledWith(context);
	});

	it('SUS - SP', async () => {
		const context = cont.quickReplyContext('duvidasPrep', 'duvidasPrep');
		context.state.user.voucher_type = 'sus';
		context.state.user.city = 2;
		await duvidas.prepFollowUp(context);

		await expect(context.sendText).toBeCalledWith(flow.duvidasPrep.prefixSUS + flow.duvidasPrep.textosSUS[context.state.user.city]);
		await expect(sendMain).toBeCalledWith(context);
	});

	it('SUS - No city', async () => {
		const context = cont.quickReplyContext('duvidasPrep', 'duvidasPrep');
		context.state.user.voucher_type = 'sus';
		context.state.user.city = 10;
		await duvidas.prepFollowUp(context);

		await expect(context.sendText).toBeCalledWith(flow.duvidasPrep.prefixSUS + flow.duvidasPrep.demaisLocalidades);
		await expect(sendMain).toBeCalledWith(context);
	});

	it('Not SUS - No city', async () => {
		const context = cont.quickReplyContext('duvidasPrep', 'duvidasPrep');
		context.state.user.voucher_type = 'combina';
		await duvidas.prepFollowUp(context);

		await expect(context.setState).toBeCalledWith({ nextDialog: '' });
		await expect(context.sendText).toBeCalledWith(flow.duvidasPrep.notSUS, await getQR(flow.ofertaPesquisaSim));
	});
});

describe('deuRuimPrepFollowUp', async () => {
	it('SUS - vê mensagem e vai pro menu', async () => {
		const context = cont.quickReplyContext('deuRuimPrepFollowUp', 'deuRuimPrepFollowUp');
		context.state.user.voucher_type = 'sus';

		await duvidas.deuRuimPrepFollowUp(context);

		await expect(context.sendText).toBeCalledWith(flow.deuRuimPrep.followUpSUS);
		await expect(sendMain).toBeCalledWith(context);
	});

	it('Not SUS - fluxo falar com humano', async () => {
		const context = cont.quickReplyContext('deuRuimPrepFollowUp', 'deuRuimPrepFollowUp');
		context.state.user.voucher_type = 'combina';

		await duvidas.deuRuimPrepFollowUp(context);

		await expect(context.setState).toBeCalledWith({ nextDialog: '' });
		await expect(context.sendText).toBeCalledWith(flow.deuRuimPrep.notSUS, await getQR(flow.ofertaPesquisaSim));
	});

	it('Efeito - SUS - vê mensagem incial, vê mensagem e vai pro menu', async () => {
		const context = cont.quickReplyContext('deuRuimPrepFollowUp', 'deuRuimPrepFollowUp');
		context.state.user.voucher_type = 'sus';
		const msgExtra = 'foobar';

		await duvidas.deuRuimPrepFollowUp(context, msgExtra);

		await expect(context.sendText).toBeCalledWith(msgExtra);
		await expect(context.sendText).toBeCalledWith(flow.deuRuimPrep.followUpSUS);
		await expect(sendMain).toBeCalledWith(context);
	});

	it('Efeito - Not SUS - vê mensagem incial, fluxo falar com humano', async () => {
		const context = cont.quickReplyContext('deuRuimPrepFollowUp', 'deuRuimPrepFollowUp');
		context.state.user.voucher_type = 'combina';
		const msgExtra = 'foobar';

		await duvidas.deuRuimPrepFollowUp(context, msgExtra);

		await expect(context.sendText).toBeCalledWith(msgExtra);
		await expect(context.setState).toBeCalledWith({ nextDialog: '' });
		await expect(context.sendText).toBeCalledWith(flow.deuRuimPrep.notSUS, await getQR(flow.ofertaPesquisaSim));
	});

	it('Efeito - SUS - vê mensagem incial, vê mensagem e vai pro menu', async () => {
		const context = cont.quickReplyContext('deuRuimPrepFollowUp', 'deuRuimPrepFollowUp');
		context.state.user.voucher_type = 'sus';
		const msgExtra = 'foobar';

		await duvidas.deuRuimPrepFollowUp(context, msgExtra);

		await expect(context.sendText).toBeCalledWith(msgExtra);
		await expect(context.sendText).toBeCalledWith(flow.deuRuimPrep.followUpSUS);
		await expect(sendMain).toBeCalledWith(context);
	});

	it('Não manda mensagem inicial se não for string', async () => {
		const context = cont.quickReplyContext('deuRuimPrepFollowUp', 'deuRuimPrepFollowUp');
		context.state.user.voucher_type = 'sus';
		const msgExtra = {};

		await duvidas.deuRuimPrepFollowUp(context, msgExtra);

		await expect(context.sendText).not.toBeCalledWith(msgExtra);
		await expect(context.sendText).toBeCalledWith(flow.deuRuimPrep.followUpSUS);
		await expect(sendMain).toBeCalledWith(context);
	});
});

describe('alarmeOK', async () => {
	it('combina', async () => {
		const context = cont.quickReplyContext('alarmeOK', 'alarmeOK');
		context.state.user.voucher_type = 'combina';

		await duvidas.alarmeOK(context);
		await expect(context.sendText).toBeCalledWith(flow.alarmePrep.comoTomando.text1, await getQR(flow.alarmePrep.comoTomando));
	});

	it('sisprep', async () => {
		const context = cont.quickReplyContext('alarmeOK', 'alarmeOK');
		context.state.user.voucher_type = 'sisprep';

		await duvidas.alarmeOK(context);
		await expect(context.sendText).toBeCalledWith(flow.alarmePrep.comoAjudo.text1, await getQR(flow.alarmePrep.comoAjudo));
	});
});
