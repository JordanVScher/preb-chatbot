const cont = require('./context');
const research = require('../app/utils/research');
const flow = require('../app/utils/flow');
const opt = require('../app/utils/options');
const { getRecipientPrep } = require('../app/utils/prep_api');
const { linkIntegrationTokenLabel } = require('../app/utils/labels');
const { sendMain } = require('../app/utils/mainMenu');
const { loadCalendar } = require('../app/utils/consulta');
const { checkAppointment } = require('../app/utils/consulta');

jest.mock('../app/utils/flow');
jest.mock('../app/utils/options');
jest.mock('../app/utils/desafio');
jest.mock('../app/utils/checkQR');
jest.mock('../app/utils/mainMenu');
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
	context.state.user = { is_target_audience: 1, risk_group: 1 };
	await research.ofertaPesquisaEnd(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: '', dialog: '' });
	await expect(context.state.user.is_target_audience).toBeTruthy();
	await expect(context.state.user.risk_group).toBeTruthy();
	await expect(context.setState).toBeCalledWith({ nextDialog: 'preTCLE' });
	await expect(context.sendText).toBeCalledWith('Manda pro recrutamento e dps pro pre-tcle');
});

it('ofertaPesquisaEnd - is_target_audience e não risk_group -> vai pro pré-TCLE', async () => {
	const context = cont.quickReplyContext('ofertaPesquisaEnd', 'ofertaPesquisaEnd');
	context.state.user = { is_target_audience: 1, risk_group: 0 };
	await research.ofertaPesquisaEnd(context);

	await expect(context.setState).toBeCalledWith({ nextDialog: '', dialog: '' });
	await expect(context.state.user.is_target_audience).toBeTruthy();
	await expect(context.state.user.risk_group).toBeFalsy();
	await expect(checkAppointment).toBeCalledWith(context); // from preTCLE
});

it('TCLE - escolheu meContaDepois -> recebe mensagem da pesquisa', async () => {
	const context = cont.quickReplyContext('TCLE', 'TCLE');
	context.state = { meContaDepois: true };
	await research.TCLE(context);

	await expect(context.setState).toBeCalledWith({ dialog: '' });
	await expect(context.state.meContaDepois).toBeTruthy();
	await expect(context.sendText).toBeCalledWith('..... (introdução)');

	await expect(context.sendButtonTemplate).toBeCalledWith(flow.TCLE.text2, opt.Research_TCLE);
	await expect(context.sendText).toBeCalledWith(flow.TCLE.text3, opt.Research_Termos);
});

it('TCLE -  não escolheu meContaDepois -> recebe calma aí', async () => {
	const context = cont.quickReplyContext('TCLE', 'TCLE');
	context.state = { meContaDepois: false };
	await research.TCLE(context);

	await expect(context.setState).toBeCalledWith({ dialog: '' });
	await expect(context.state.meContaDepois).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.TCLE.text1);

	await expect(context.sendButtonTemplate).toBeCalledWith(flow.TCLE.text2, opt.Research_TCLE);
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

it('Pré-TCLE - não is_eligible_for_research e não is_target_audience e não deixou contato nem marcou consulta -> recebe msg 2 e cai na consulta', async () => {
	const context = cont.quickReplyContext('preTCLE', 'preTCLE');
	context.state.user = { is_eligible_for_research: 0, is_target_audience: 1 };
	context.state.leftContact = false;
	await research.preTCLE(context);

	await expect(context.state.user.is_eligible_for_research).toBeFalsy();
	await expect(context.sendText).toBeCalledWith(flow.preTCLE.not_eligible);

	await expect(!context.state.user.is_target_audience).toBeFalsy();
	await expect(context.state.leftContact).toBeFalsy();
	await expect(context.setState).toBeCalledWith({ nextDialog: 'TCLE', dialog: '' });
	await loadCalendar(context);
});

// async function preTCLE(context) {
// 	if (context.state.user.is_eligible_for_research) { // é elegível pra pesquisa
// 		await context.sendText(flow.preTCLE.eligible);
// 	} else { // não é elegivel pra pesquisa
// 		await context.sendText(flow.preTCLE.not_eligible);
// 	}

// 	if (!context.state.user.is_target_audience) { // não é público de interesse
// 		await TCLE(context);
// 	} else if (context.state.leftContact || await checkAppointment(context) === true) { // é público de interesse, já fez agendamento ou deixou contato
// 		await TCLE(context);
// 	} else { // é público de interesse, não fez agendamento nem deixou contato
// 		await context.setState({ nextDialog: 'TCLE', dialog: '' });
// 		await loadCalendar(context);
// 	}
// }
