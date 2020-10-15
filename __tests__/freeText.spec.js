require('dotenv').config();

const handler = require('../index');
const MaAPI = require('../app/chatbot_api');
const cont = require('./context');
const duvidas = require('../app/utils/duvidas');
const research = require('../app/utils/research');
const joinToken = require('../app/utils/joinToken');
const prepAPI = require('../app/utils/prep_api');
const help = require('../app/utils/helper');
const DF = require('../app/dialogFlow');
const quiz = require('../app/utils/quiz');

jest.mock('../app/send_issue');
jest.mock('../app/utils/helper');
jest.mock('../app/utils/duvidas');
jest.mock('../app/utils/research');
jest.mock('../app/utils/joinToken');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/quiz');
jest.mock('../app/chatbot_api');
jest.mock('../app/dialogFlow');

describe('Receive text message', () => {
	it('alarmeAcabar - expect date, runs duvidas.alarmeDate', async () => {
		const context = cont.textContext('foobar', 'alarmeAcabar');
		await handler(context);

		await expect(context.event.isText).toBeTruthy();
		await expect(context.setState).toBeCalledWith({ whatWasTyped: context.event.message.text, lastQRpayload: '', lastPBpayload: '' });
		await expect(duvidas.alarmeDate).toBeCalledWith(context);
	});

	it('notiAlarmeB_Sim - expect date, runs duvidas.alarmeDate', async () => {
		const context = cont.textContext('foobar', 'notiAlarmeB_Sim');
		await handler(context);

		await expect(context.event.isText).toBeTruthy();
		await expect(context.setState).toBeCalledWith({ whatWasTyped: context.event.message.text, lastQRpayload: '', lastPBpayload: '' });
		await expect(duvidas.alarmeDate).toBeCalledWith(context);
	});

	it('leavePhoneTwo - expects phone, runs research.checkPhone', async () => {
		const context = cont.textContext('foobar', 'leavePhoneTwo');
		await handler(context);

		await expect(research.checkPhone).toBeCalledWith(context);
	});

	it('phoneInvalid - expects phone, runs research.checkPhone', async () => {
		const context = cont.textContext('foobar', 'phoneInvalid');
		await handler(context);

		await expect(research.checkPhone).toBeCalledWith(context);
	});

	it('leaveInsta - gets instagram and follows up', async () => {
		const context = cont.textContext('foobar', 'leaveInsta');
		await handler(context);

		await expect(context.setState).toBeCalledWith({ insta: context.state.whatWasTyped, dialog: 'leaveInstaValid' });
	});

	it('autoCorreio - gets endereco and runs handleCorreioEndereco', async () => {
		const context = cont.textContext('foobar', 'autoCorreio');
		await handler(context);

		await expect(duvidas.handleCorreioEndereco).toBeCalledWith(context, await help.checkValidAddress(context.state.whatWasTyped));
	});

	it('autoCorreioContato - gets contato and goes to the end', async () => {
		const context = cont.textContext('foobar', 'autoCorreioContato');
		await handler(context);

		await expect(context.setState).toBeCalledWith({ autoCorreioContato: context.state.whatWasTyped, dialog: 'autoCorreioEnd' });
	});

	it('joinPrep - checks joinPrep token', async () => {
		const context = cont.textContext('foobar', 'joinPrep');
		await handler(context);

		await expect(joinToken.handlePrepToken).toBeCalledWith(context, await prepAPI.postIntegrationPrepToken(context.session.user.id, context.state.whatWasTyped));
	});

	it('joinPrepErro - checks joinPrep token', async () => {
		const context = cont.textContext('foobar', 'joinPrepErro');
		await handler(context);

		await expect(joinToken.handlePrepToken).toBeCalledWith(context, await prepAPI.postIntegrationPrepToken(context.session.user.id, context.state.whatWasTyped));
	});

	it('joinCombinaAsk - checks joinCombina token', async () => {
		const context = cont.textContext('foobar', 'joinCombinaAsk');
		await handler(context);

		await expect(joinToken.handleCombinaToken).toBeCalledWith(context, await prepAPI.putCombinaToken(context.session.user.id, context.state.whatWasTyped));
	});

	it('joinCombinaAskErro - checks joinCombina token', async () => {
		const context = cont.textContext('foobar', 'joinCombinaAskErro');
		await handler(context);

		await expect(joinToken.handleCombinaToken).toBeCalledWith(context, await prepAPI.putCombinaToken(context.session.user.id, context.state.whatWasTyped));
	});

	it('Not handled - goes to dialogflow', async () => {
		const context = cont.textContext('foobar', 'foobar123');
		await handler(context);

		await expect(DF.dialogFlow).toBeCalledWith(context);
	});
});

describe('Dev Keywords', () => {
	it('GET_PERFILDATA - Reset Data', async () => {
		const context = cont.textContext(process.env.GET_PERFILDATA, 'mainMenu');
		await handler(context);

		await expect(prepAPI.deleteQuizAnswer).toBeCalledWith(context.session.user.id);
		await expect(context.resetState).toBeCalled();
		await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
		await expect(context.setState).toBeCalledWith({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id), ignore: false });
		await expect(context.setState).toBeCalledWith({ dialog: 'greetings' });
	});

	it('TEST_KEYWORD - change state', async () => {
		const context = cont.textContext(process.env.TEST_KEYWORD, 'mainMenu');
		await handler(context);

		await expect(context.setState).toBeCalled();
	});

	it('PREP_TEST - Turns into Prep Enabled', async () => {
		const context = cont.textContext(process.env.PREP_TEST, 'mainMenu');
		await handler(context);

		await expect(prepAPI.postTestPrep).toBeCalledWith(context.session.user.id, true);
		await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id), dialog: 'mainMenu' });
	});

	it('N_PREP_TEST - Turns into Prep Disaled', async () => {
		const context = cont.textContext(process.env.N_PREP_TEST, 'mainMenu');
		await handler(context);

		await expect(prepAPI.postTestPrep).toBeCalledWith(context.session.user.id, false);
		await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id), dialog: 'mainMenu' });
	});

	it('SISPREP_TEST - Turns into sisprep', async () => {
		const context = cont.textContext(process.env.SISPREP_TEST, 'mainMenu');
		await handler(context);

		await expect(prepAPI.putUpdateVoucherFlag).toBeCalledWith(context.session.user.id, 'sisprep');
		await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id), dialog: 'mainMenu' });
	});

	it('SUS_TEST - Turns into sus', async () => {
		const context = cont.textContext(process.env.SUS_TEST, 'mainMenu');
		await handler(context);

		await expect(prepAPI.putUpdateVoucherFlag).toBeCalledWith(context.session.user.id, 'sus');
		await expect(context.setState).toBeCalledWith({ user: await prepAPI.getRecipientPrep(context.session.user.id), dialog: 'mainMenu' });
	});
});

describe('Quiz Text', () => {
	describe('onTextQuiz - converts to integer', () => {
		it('Valid - goes to quiz', async () => {
			const context = cont.textContext(10, 'quiz');
			context.state.onTextQuiz = true;
			await handler(context);

			await expect(context.setState).toBeCalledWith({ whatWasTyped: parseInt(context.state.whatWasTyped, 10) });
			await expect(Number.isInteger(context.state.whatWasTyped, 10)).toBeTruthy();
			await expect(quiz.handleAnswer).toBeCalledWith(context, context.state.whatWasTyped);
		});

		it('Invalid - sees message and tries again', async () => {
			const context = cont.textContext('foobar', 'quiz');
			context.state.onTextQuiz = true;
			await handler(context);

			await expect(context.setState).toBeCalledWith({ whatWasTyped: parseInt(context.state.whatWasTyped, 10) });
			await expect(Number.isInteger(context.state.whatWasTyped, 10)).toBeFalsy();
			await expect(context.sendText).toBeCalledWith('Formato inválido, digite só um número, exemplo 24');
			await expect(context.setState).toBeCalledWith({ dialog: 'startQuiz' });
		});
	});
});
