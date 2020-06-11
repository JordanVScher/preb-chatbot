const cont = require('./context');
const research = require('../app/utils/research');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const { getQR } = require('../app/utils/attach');
const { sendMain } = require('../app/utils/mainMenu');
const { falarComHumano } = require('../app/utils/mainMenu');
const { addNewUser } = require('../app/utils/labels');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');
jest.mock('../app/utils/consulta-aux');
jest.mock('../app/utils/prep_api');
jest.mock('../app/utils/labels');
jest.mock('../app/utils/attach');

it('ofertaPesquisaSim - clica meContaDepois - não vê explicação do projeto,  falar com humano', async () => {
	const context = cont.textContext('foobar', 'joinToken');
	context.state.meContaDepois = true;
	await research.ofertaPesquisaSim(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: 'ofertaPesquisaEnd' });
	await expect(context.state.meContaDepois !== true).toBeFalsy();
	await expect(falarComHumano).toBeCalledWith(context, 'ofertaPesquisaEnd');
});

it('ofertaPesquisaSim - não clica em meContaDepois - vê explicação do projeto, falar com humano', async () => {
	const context = cont.textContext('foobar', 'joinToken');
	context.state.meContaDepois = false;
	await research.ofertaPesquisaSim(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: 'ofertaPesquisaEnd' });
	await expect(context.state.meContaDepois !== true).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.ofertaPesquisaSim.text1);
	await expect(context.typing).toBeCalledWith(1000 * 5);
	await expect(context.sendText).toBeCalledWith(flow.ofertaPesquisaSim.text2);

	await expect(falarComHumano).toBeCalledWith(context, 'ofertaPesquisaEnd');
});

it('ofertaPesquisaEnd - não is_target_audience -> vai pro menu', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 0 };
	await research.ofertaPesquisaEnd(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: '', dialog: '' });
	await expect(!context.state.user.is_target_audience).toBeTruthy();
	await expect(sendMain).toBeCalledWith(context);
});

it('ofertaPesquisaEnd - is_target_audience e risk_group -> vai pro recrutamento', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 1, risk_group: 1 }; context.state.recrutamentoEnd = false;
	await research.ofertaPesquisaEnd(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: '', dialog: '' });
	await expect(context.state.user.is_target_audience).toBeTruthy();
	await expect(context.state.user.risk_group).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ nextDialog: 'preTCLE' });
	// await expect(context.sendText).toBeCalledWith(flow.recrutamento.text1, await getQR(flow.recrutamento));
});

it('ofertaPesquisaEnd - is_target_audience e não risk_group -> vai pro pré-TCLE', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 1, risk_group: 0 };
	await research.ofertaPesquisaEnd(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: '', dialog: '' });
	await expect(context.state.user.is_target_audience).toBeTruthy();
	await expect(context.state.user.risk_group).toBeFalsy();
	await expect(addNewUser).toBeCalledWith(context); // from preTCLE
});

it('ofertaPesquisaEnd - is_target_audience e risk_group -> vai pro recrutamento', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 1, risk_group: 1 }; context.state.recrutamentoEnd = false;
	await research.ofertaPesquisaEnd(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: '', dialog: '' });
	await expect(context.state.user.is_target_audience).toBeTruthy();
	await expect(context.state.user.risk_group).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ nextDialog: 'preTCLE' });
	await expect(context.sendText).toBeCalledWith(flow.recrutamento.text1, await getQR(flow.recrutamento)); // recrutamento
});

it('recrutamento - não é target_audience -> não faz recrutamento, vai pro menu', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 0, risk_group: 0 }; context.state.recrutamentoEnd = false;
	await research.recrutamento(context);

	await expect(context.state.user.is_target_audience && context.state.user.risk_group && !context.state.recrutamentoEnd).toBeFalsy();
	await expect(sendMain).toBeCalledWith(context);
});

it('recrutamento - é target_audience, não é grupo de risco -> não faz recrutamento, vai pro menu', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 1, risk_group: 0 }; context.state.recrutamentoEnd = false;
	await research.recrutamento(context);

	await expect(context.state.user.is_target_audience && context.state.user.risk_group && !context.state.recrutamentoEnd).toBeFalsy();
	await expect(sendMain).toBeCalledWith(context);
});

it('recrutamento - é target_audience, é grupo de risco, ainda não acabou recrutamento -> faz recrutamento', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 1, risk_group: 1 }; context.state.recrutamentoEnd = false;
	await research.recrutamento(context);

	await expect(context.state.user.is_target_audience && context.state.user.risk_group && !context.state.recrutamentoEnd).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.recrutamento.text1, await getQR(flow.recrutamento));
});

it('recrutamento - é target_audience, é grupo de risco, já acabou recrutamento -> não faz recrutamento, vai pro menu', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 1, risk_group: 1 }; context.state.recrutamentoEnd = true;
	await research.recrutamento(context);

	await expect(context.state.user.is_target_audience && context.state.user.risk_group && !context.state.recrutamentoEnd).toBeFalsy();
	await expect(sendMain).toBeCalledWith(context);
});


it('TCLE - escolheu meContaDepois -> recebe mensagem da pesquisa', async () => {
	const context = cont.quickReplyContext('TCLE', 'TCLE');
	context.state = { meContaDepois: true };
	await research.TCLE(context);

	await expect(context.setState).toBeCalledWith({ dialog: '' });
	await expect(context.state.meContaDepois).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.ofertaPesquisaSim.text0);
	await expect(context.sendText).toBeCalledWith(flow.ofertaPesquisaSim.text1);
	await expect(context.typing).toBeCalledWith(1000 * 20);

	await expect(context.sendText).toBeCalledWith(flow.TCLE.text2a);
	await expect(context.typing).toBeCalledWith(1000 * 5);
	await expect(context.sendButtonTemplate).toBeCalledWith(flow.TCLE.text2b, opt.Research_TCLE);

	await expect(context.sendText).toBeCalledWith(flow.TCLE.text3, opt.Research_Termos);
});

it('TCLE -  não escolheu meContaDepois -> recebe calma aí', async () => {
	const context = cont.quickReplyContext('TCLE', 'TCLE');
	context.state = { meContaDepois: false };
	await research.TCLE(context);

	await expect(context.setState).toBeCalledWith({ dialog: '' });
	await expect(context.state.meContaDepois).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.TCLE.text1);

	await expect(context.sendText).toBeCalledWith(flow.TCLE.text2a);
	await expect(context.typing).toBeCalledWith(1000 * 5);
	await expect(context.sendButtonTemplate).toBeCalledWith(flow.TCLE.text2b, opt.Research_TCLE);

	await expect(context.sendText).toBeCalledWith(flow.TCLE.text3, opt.Research_Termos);
});

it('Pré-TCLE - is_eligible_for_research e não is_target_audience -> recebe msg 1 e TCLE', async () => {
	const context = cont.quickReplyContext('preTCLE', 'preTCLE');
	context.state.user = { is_eligible_for_research: 1, is_target_audience: 0 };
	await research.preTCLE(context);

	await expect(context.state.user.is_eligible_for_research).toBeTruthy();
	await expect(context.sendText).toBeCalledWith(flow.preTCLE.eligible);

	await expect(!context.state.user.is_target_audience).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: '' }); // await TCLE(context);
});

it('Pré-TCLE - não is_eligible_for_research e não is_target_audience mas já deixou contato -> recebe msg 2 e TCLE', async () => {
	const context = cont.quickReplyContext('preTCLE', 'preTCLE');
	context.state.user = { is_eligible_for_research: 0, is_target_audience: 1 };
	context.state.leftContact = true;	const marcouConsulta = false;
	await research.preTCLE(context, marcouConsulta);

	await expect(context.state.user.is_eligible_for_research).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.preTCLE.not_eligible);

	await expect(!context.state.user.is_target_audience).toBeFalsy();
	await expect(context.state.leftContact || marcouConsulta).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: '' }); // await TCLE(context);
});

it('Pré-TCLE - não is_eligible_for_research e não is_target_audience mas já marcou consulta -> recebe msg 2 e TCLE', async () => {
	const context = cont.quickReplyContext('preTCLE', 'preTCLE');
	context.state.user = { is_eligible_for_research: 0, is_target_audience: 1 };
	context.state.leftContact = false; const marcouConsulta = true;
	await research.preTCLE(context, marcouConsulta);

	await expect(context.state.user.is_eligible_for_research).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.preTCLE.not_eligible);

	await expect(!context.state.user.is_target_audience).toBeFalsy();
	await expect(context.state.leftContact || marcouConsulta).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ dialog: '' }); // await TCLE(context);
});
