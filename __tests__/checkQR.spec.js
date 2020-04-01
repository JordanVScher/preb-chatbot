const cont = require('./context');
const checkQR = require('../app/utils/checkQR');
const { getQR } = require('../app/utils/attach'); // dont mock
const { deuRuimPrep } = require('../app/utils/flow'); // dont mock
const opt = require('../app/utils/options');
const { checkAppointment } = require('../app/utils/consulta-aux');

jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/consulta');
jest.mock('../app/utils/consulta-aux');

describe('checkMainMenu', async () => {
	it('não acabou publico_interesse, não tem Token de integração -> Vê botões Quiz e Já Tomo PrEP', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 0 }; context.state.currentQuestion = { code: 'a5' };
		context.state.publicoInteresseEnd = false;
		const result = await checkQR.checkMainMenu(context);

		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
		await expect(result.quick_replies[1].payload === 'beginQuiz').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('não acabou publico_interesse, tem Token de integração -> Vê botão Quiz e Ver meu Voucher', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 0, integration_token: 'foobar' };
		context.state.publicoInteresseEnd = false;
		const result = await checkQR.checkMainMenu(context);

		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
		await expect(result.quick_replies[1].payload === 'beginQuiz').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Ver meu Voucher').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});


	it('não é publico_interesse, não acabou brincadeira -> Vê Quiz', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 0, is_prep: undefined };
		context.state.publicoInteresseEnd = true;
		const result = await checkQR.checkMainMenu(context);

		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
		await expect(result.quick_replies[1].payload === 'querBrincadeira').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('não é publico_interesse, já acabou brincadeira mas não assinou termos -> não vê Quiz mas vê Termos', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 0, is_prep: null };
		context.state.publicoInteresseEnd = true; context.state.quizBrincadeiraEnd = true;
		const result = await checkQR.checkMainMenu(context);

		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Termos').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('não é publico_interesse, já acabou brincadeira e assinou termos -> Menu Normal', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 0 }; context.state.preCadastroSignature = true;
		context.state.publicoInteresseEnd = true; context.state.quizBrincadeiraEnd = true;
		const result = await checkQR.checkMainMenu(context);

		await expect(result.quick_replies.length === 4).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, não marcou consulta nem deixou contato -> vê Bate Papo presencial e virtual', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1 };
		context.state.publicoInteresseEnd = true;
		context.state.temConsulta = false; context.state.leftContact = false;
		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });

		await expect(result.quick_replies.length === 6).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Bate papo presencial').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Bate papo virtual').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[5].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, marcou consulta, não deixou contato e não acabou recrutamento, é grupo de risco -> vê Quiz e Ver Consulta', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 1 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = false;
		context.state.temConsulta = true; context.state.leftContact = false;
		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });

		await expect(result.quick_replies.length === 6).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
		await expect(result.quick_replies[1].payload === 'recrutamento').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Ver Consulta').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[5].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, marcou consulta, não deixou contato, não é grupo de risco, não assinou os termos -> Não vê Quiz mas vê Termos e Ver Consulta', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 0 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = false;
		context.state.temConsulta = true; context.state.leftContact = false; context.state.preCadastroSignature = false;
		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });

		await expect(result.quick_replies.length === 6).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Termos').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Ver Consulta').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[5].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, marcou consulta, não deixou contato, não é grupo de risco, assinou os termos -> Não vê Quiz mas vê Ver Consulta', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 0 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = false;
		context.state.temConsulta = true; context.state.leftContact = false; context.state.preCadastroSignature = true;
		const result = await checkQR.checkMainMenu(context);

		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });

		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Ver Consulta').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, não marcou consulta, deixou contato e não acabou recrutamento, é grupo de risco -> vê Quiz', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 1 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = false;
		context.state.temConsulta = false; context.state.leftContact = true;
		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });

		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Quiz').toBeTruthy();
		await expect(result.quick_replies[1].payload === 'recrutamento').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, marcou consulta, acabou recrutamento mas não assinou termos -> vê Termos e Ver Consulta', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 1 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = true;
		context.state.temConsulta = true; context.state.preCadastroSignature = false;

		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });
		await expect(result.quick_replies.length === 6).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Termos').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Ver Consulta').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[5].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, deixou contato e acabou recrutamento mas não assinou termos -> vê Termos', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 1 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = true;
		context.state.temConsulta = false; context.state.leftContact = true; context.state.preCadastroSignature = false;

		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });
		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Termos').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, marcou consulta, acabou recrutamento e assinou termos -> vê Menu Normal e Ver Consulta', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 1 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = true;
		context.state.temConsulta = true; context.state.preCadastroSignature = true;

		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });
		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Ver Consulta').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, marcou consulta, acabou recrutamento e assinou termos -> vê Menu Normal e Ver Consulta', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 1 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = true;
		context.state.temConsulta = true; context.state.preCadastroSignature = true;

		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });
		await expect(result.quick_replies.length === 5).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Ver Consulta').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[4].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é publico_interesse, deixou contato, acabou recrutamento e assinou termos -> vê Menu Normal', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_target_audience: 1, risk_group: 1 };
		context.state.publicoInteresseEnd = true; context.state.recrutamentoEnd = true;
		context.state.temConsulta = false; context.state.leftContact = true; context.state.preCadastroSignature = true;

		const result = await checkQR.checkMainMenu(context);
		await expect(context.setState).toBeCalledWith({ temConsulta: await checkAppointment(context.session.user.id) });
		await expect(result.quick_replies.length === 4).toBeTruthy();
		await expect(result.quick_replies[0].title === 'Bater Papo').toBeTruthy();
		await expect(result.quick_replies[1].title === 'Prevenções').toBeTruthy();
		await expect(result.quick_replies[2].title === 'Já Tomo PrEP').toBeTruthy();
		await expect(result.quick_replies[3].title === 'Sobre a Amanda').toBeTruthy();
	});

	it('é prep -> vê Bater Papo, Dúvidas, Deu Ruim, Voltar a Tomar e Alarme para PREPs', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_prep: 1 };

		const result = await checkQR.checkMainMenu(context);
		await expect(result.quick_replies.length === 6).toBeTruthy();

		await expect(result.quick_replies[0].payload === 'baterPapo').toBeTruthy();
		await expect(result.quick_replies[1].payload === 'duvidasPrep').toBeTruthy();
		await expect(result.quick_replies[2].payload === 'deuRuimPrep').toBeTruthy();
		await expect(result.quick_replies[3].payload === 'voltarTomarPrep').toBeTruthy();
		await expect(result.quick_replies[4].payload === 'alarmePrep').toBeTruthy();
		await expect(result.quick_replies[5].payload === 'tomeiPrep').toBeTruthy();
	});

	it('não é prep -> vê Bater Papo, Dúvidas e Deu Ruim', async () => {
		const context = cont.quickReplyContext('greetings', 'greetings');
		context.state.user = { is_prep: 0 };

		const result = await checkQR.checkMainMenu(context);
		await expect(result.quick_replies.length === 3).toBeTruthy();

		await expect(result.quick_replies[0].payload === 'baterPapo').toBeTruthy();
		await expect(result.quick_replies[1].payload === 'duvidasNaoPrep').toBeTruthy();
		await expect(result.quick_replies[2].payload === 'deuRuimNaoPrep').toBeTruthy();
	});
});

it('checkMedication - less than four months', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { prep_since: Date.now() };
	const result = await checkQR.checkMedication(context.state.user.prep_since);

	await expect(result.quick_replies.length === 3).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Acabou o Remédio').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Esqueci de tomar').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Dúvida com o Remédio').toBeTruthy();
});

it('checkMedication - more than four months', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.user = { prep_since: 155208009 };
	const result = await checkQR.checkMedication(context.state.user.prep_since);

	await expect(result.quick_replies.length === 4).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Sintomas').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Acabou o Remédio').toBeTruthy();
	await expect(result.quick_replies[2].title === 'Esqueci de tomar').toBeTruthy();
	await expect(result.quick_replies[3].title === 'Dúvida com o Remédio').toBeTruthy();
});

it('autotesteOption - city 1', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.autotesteOption = '1';
	const result = await checkQR.autotesteOption(opt.autoteste, context.state.autotesteOption);

	await expect(result.quick_replies.length === 2).toBeTruthy();
	await expect(result.quick_replies[0].title === 'Autoteste').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Serviço').toBeTruthy();
});

it('autotesteOption - city 2 as number', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.autotesteOption = 2;
	const result = await checkQR.autotesteOption(opt.autoteste, context.state.autotesteOption);

	await expect(result.quick_replies.length === 2).toBeTruthy();
	await expect(result.quick_replies[0].title === 'ONG').toBeTruthy();
	await expect(result.quick_replies[1].title === 'Serviço').toBeTruthy();
});

it('autotesteOption - city 3 - nothing changes', async () => {
	const context = cont.quickReplyContext('greetings', 'greetings');
	context.state.autotesteOption = 3;
	const result = await checkQR.autotesteOption(opt.autoteste, context.state.autotesteOption);

	await expect(result.quick_replies === opt.autoteste.quick_replies).toBeTruthy();
});


describe('checkDeuRuimPrep', async () => {
	const options = deuRuimPrep;

	it('on sisprep - see Não Tomei option', async () => {
		const context = cont.quickReplyContext('deuRuimPrep', 'deuRuimPrep');
		context.state.user.voucher_type = 'sisprep';

		let result = await checkQR.checkDeuRuimPrep(context, await getQR(options));
		result = result.quick_replies;

		await expect(result).toBeTruthy();
		await expect(result.length === 6).toBeTruthy();
		const found = result.find((x) => x.payload === 'drpNaoTomei');
		await expect(found && found.title).toBeTruthy();
	});

	it('on combina - see Não Tomei option', async () => {
		const context = cont.quickReplyContext('deuRuimPrep', 'deuRuimPrep');
		context.state.user.voucher_type = 'combina';

		let result = await checkQR.checkDeuRuimPrep(context, await getQR(options));
		result = result.quick_replies;

		await expect(result).toBeTruthy();
		await expect(result.length === 6).toBeTruthy();
		const found = result.find((x) => x.payload === 'drpNaoTomei');
		await expect(found && found.title).toBeTruthy();
	});

	it('on sus - dont see Não Tomei option', async () => {
		const context = cont.quickReplyContext('deuRuimPrep', 'deuRuimPrep');
		context.state.user.voucher_type = 'sus';

		let result = await checkQR.checkDeuRuimPrep(context, await getQR(options));
		result = result.quick_replies;

		await expect(result).toBeTruthy();
		await expect(result.length === 5).toBeTruthy();
		const found = result.find((x) => x.payload === 'drpNaoTomei');
		await expect(found && found.title).toBeFalsy();
	});
});

describe('buildAlarmeBtn', async () => {
	it('Has Alarm - Sees Config and Cancel', async () => {
		let result = await checkQR.buildAlarmeBtn(true);
		result = result.quick_replies;

		await expect(result.length).toBe(2);
		await expect(result[0].payload).toBe('alarmeConfigurar');
		await expect(result[1].payload).toBe('alarmeCancelar');
	});

	it('Doesnt have Alarm - Sees Depois and Config', async () => {
		let result = await checkQR.buildAlarmeBtn(false);
		result = result.quick_replies;

		await expect(result.length).toBe(2);
		await expect(result[0].payload).toBe('mainMenu');
		await expect(result[1].payload).toBe('alarmeConfigurar');
	});
});
