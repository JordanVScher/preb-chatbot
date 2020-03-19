const MaAPI = require('./chatbot_api.js');
const prepAPI = require('./utils/prep_api.js');
const DF = require('./dialogFlow');
const flow = require('./utils/flow');
const opt = require('./utils/options');
const help = require('./utils/helper');
const quiz = require('./utils/quiz');
const desafio = require('./utils/desafio');
const consulta = require('./utils/consulta');
const mainMenu = require('./utils/mainMenu');
const research = require('./utils/research');
const timer = require('./utils/timer');
const triagem = require('./utils/triagem');
const checkQR = require('./utils/checkQR');
const joinToken = require('./utils/joinToken');
const duvidas = require('./utils/duvidas');
const { sendMail } = require('./utils/mailer');
const { getQR } = require('./utils/attach');
const { addNewUser } = require('./utils/labels');
const { sentryError } = require('./utils/error');
const { buildNormalErrorMsg } = require('./utils/error');

async function vouPensarMelhorFollowUp(context) {
	if (context.state.nextDialog === 'ofertaPesquisaEnd') {
		await research.ofertaPesquisaEnd(context);
	} else {
		await mainMenu.sendMain(context);
	}
}

async function meContaDepoisFollowUp(context) {
	if (context.state.nextDialog === 'ofertaPesquisaEnd') {
		await context.setState({ meContaDepois: true });
		await research.ofertaPesquisaSim(context);
	} else {
		await mainMenu.sendMain(context);
	}
}

async function contactFollowUp(context) {
	if (context.state.nextDialog === 'ofertaPesquisaEnd') {
		await research.ofertaPesquisaEnd(context);
	} else if (context.state.nextDialog === 'calendario') {
		await consulta.startConsulta(context);
	} else {
		await mainMenu.sendMain(context);
	}
}

const inicioAutoTeste = async (context) => context.sendText(flow.autoTeste.start, await checkQR.autoTesteOption(opt.autoteste, context.state.user.city));
const inicioJoin = async (context) => context.sendText(flow.join.intro.text1, await getQR(flow.join.intro));
const inicioDuvidasNaoPrep = async (context) => context.sendText(flow.duvidasNaoPrep.text1, await getQR(flow.duvidasNaoPrep));

const drnpFollowUpTriagem = async (context) => {
	await context.setState({ nextDialog: '' });
	context.sendText(flow.deuRuimNaoPrep.followUpTriagem, await getQR(flow.ofertaPesquisaSim));
};
const drnpFollowUpAgendamento = async (context) => {
	await context.setState({ nextDialog: '' });
	context.sendText(flow.deuRuimNaoPrep.drnpPEPNao.followUpAgendamento, await getQR(flow.ofertaPesquisaSim));
};


async function startInteration(fbID) {
	const status = await prepAPI.getRecipientInteraction(fbID);
	if (!status || !status[0] || status[0].closed_at !== null) await prepAPI.postRecipientInteraction(fbID);
}

module.exports = async (context) => {
	try {
		await context.setState({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id), ignore: false });
		await addNewUser(context);
		await startInteration(context.session.user.id);
		// console.log(context.state.politicianData);
		// we update context data at every interaction (post ony on the first time)
		await MaAPI.postRecipientMA(context.state.politicianData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			gender: context.session.user.gender === 'male' ? 'M' : 'F',
			origin_dialog: 'greetings',
			picture: context.session.user.profile_pic,
			extra_fields: await help.buildLabels(context.state.user.system_labels),
		});

		// console.log('context.state.user', context.state.user);
		// console.log('context.state.user.system_labels', await help.buildLabels(context.state.user.system_labels));
		await timer.deleteTimers(context.session.user.id);

		// we need to check the key on the api to know if the timer was sent already
		if (context.state.recrutamentoTimer === true) {
			await context.setState({ recipientAPI: await MaAPI.getRecipient(context.state.politicianData.user_id, context.session.user.id) });
			const { session } = context.state.recipientAPI;
			if (session && session.recrutamentoTimer === false) {
				await context.setState({ recrutamentoTimer: false }); // already sent and api key was updated on the timer
			} else if (!context.state.preCadastroSignature) {
				await timer.createRecrutamentoTimer(context.session.user.id, context); // create recrutamento timer if it wasn't created already (and if TCLE was never sent)
			}
		}

		if (context.event.isPostback) {
			await context.setState({ lastPBpayload: context.event.postback.payload, lastQRpayload: '' });
			await context.setState({ onTextQuiz: false, sendExtraMessages: false, paginationDate: 1, paginationHour: 1, goBackToQuiz: false, goBackToTriagem: false}); // eslint-disable-line
			if (!context.state.dialog || context.state.dialog === '' || context.state.lastPBpayload === 'greetings') { // because of the message that comes from the comment private-reply
				await context.setState({ dialog: 'greetings' });
				// await context.setState({ dialog: 'showDays' });
				// await context.setState({ dialog: 'verConsulta' });
				// await context.setState({ dialog: 'leavePhone' });
				// await context.setState({ dialog: 'calendarTest' });
				// await context.setState({ dialog: 'addRecrutamentoTimer' });
			} else {
				await context.setState({ dialog: context.state.lastPBpayload });
			}
			await MaAPI.logFlowChange(context.session.user.id, context.state.politicianData.user_id, context.event.postback.payload, context.event.postback.title);
			await prepAPI.logFlowChange(context.session.user.id, context.event.postback.payload, context.event.postback.title);
		} else if (context.event.isQuickReply) {
			// console.log(context.session.user.first_name, 'clicks lastQRpayload => new payload:', `${context.state.lastQRpayload} => ${context.event.quickReply.payload}`);

			if (context.state.lastQRpayload || context.state.lastQRpayload !== context.event.quickReply.payload) { // check if last clicked button is the same as the new one
				await context.setState({ lastQRpayload: context.event.quickReply.payload }); // update last quick reply chosen
				await MaAPI.logFlowChange(context.session.user.id, context.state.politicianData.user_id, context.event.message.quick_reply.payload, context.event.message.quick_reply.payload); // eslint-disable-line max-len
				await prepAPI.logFlowChange(context.session.user.id, context.event.message.quick_reply.payload, context.event.message.quick_reply.payload);

				if (context.state.lastQRpayload.slice(0, 9) === 'eventDate') { // handling user clicking on a date in setEvent
					await context.setState({ selectedDate: context.state.lastQRpayload.slice(9, -1) });
					await context.setState({ dialog: 'setEventHour' });
				} else if (context.state.lastQRpayload.slice(0, 9) === 'eventHour') {
					await context.setState({ selectedHour: context.state.lastQRpayload.slice(9, -1) });
					await context.setState({ dialog: 'setEvent' });
				} else if (context.state.lastQRpayload.slice(0, 4) === 'quiz') {
					await quiz.handleAnswer(context, context.state.lastQRpayload.charAt(4));
				} else if (context.state.lastQRpayload.slice(0, 4) === 'tria') {
					await triagem.handleAnswer(context, context.state.lastQRpayload.charAt(4));
				} else if (context.state.lastQRpayload.slice(0, 13) === 'extraQuestion') {
					await quiz.AnswerExtraQuestion(context);
				} else if (context.state.lastQRpayload.slice(0, 3) === 'dia') {
					await context.setState({ showHours: context.state.lastQRpayload.replace('dia', '') });
					await context.setState({ dialog: 'showHours' });
				} else if (context.state.lastQRpayload.slice(0, 12) === 'horaConsulta') {
					await context.setState({ finalDate: context.state.lastQRpayload.replace('horaConsulta', '').replace(':', '-') });
					await consulta.finalDate(context, context.state.finalDate);
				} else if (context.state.lastQRpayload.slice(0, 8) === 'nextHour') {
					await context.setState({ dialog: 'nextHour', lastQRpayload: '' });
				} else if (context.state.lastQRpayload.slice(0, 12) === 'previousHour') {
					await context.setState({ dialog: 'previousHour' });
				} else if (context.state.lastQRpayload.slice(0, 7) === 'nextDay') {
					await context.setState({ dialog: 'nextDay' });
				} else if (context.state.lastQRpayload.slice(0, 11) === 'previousDay') {
					await context.setState({ dialog: 'previousDay' });
				} else if (context.state.lastQRpayload.slice(0, 9) === 'askTypeSP') {
					await context.setState({ calendarID: await context.state.lastQRpayload.replace('askTypeSP', '') });
					await consulta.loadCalendar(context);
					await context.setState({ dialog: 'showDate' });
				} else if (context.state.lastQRpayload.slice(0, 4) === 'city') {
					await context.setState({ cityId: await context.state.lastQRpayload.replace('city', '') });
					await context.setState({ dialog: 'showDays' });
				} else if (context.state.lastQRpayload === 'joinNaoToma') {
					await context.setState({ dialog: 'greetings', askDesafio: false });
				} else if (context.state.lastQRpayload.slice(0, 11) === 'pageHorario') {
					await context.setState({ alarmePage: await context.state.lastQRpayload.replace('pageHorario', ''), dialog: 'pageHorario' });
				} else if (context.state.lastQRpayload.slice(0, 10) === 'horaAlarme') {
					await context.setState({ alarmeHora: await context.state.lastQRpayload.replace('horaAlarme', ''), dialog: 'alarmeMinuto' });
				} else if (context.state.lastQRpayload.slice(0, 11) === 'alarmeFinal') {
					await context.setState({ alarmeMinuto: await context.state.lastQRpayload.replace('alarmeFinal', ''), dialog: 'alarmeFinal' });
				} else if (context.state.lastQRpayload.slice(0, 11) === 'alarmeTempo') {
					await context.setState({ alarmeTempo: `${await context.state.lastQRpayload.replace('alarmeTempo', '')} minutes`, dialog: 'alarmeTempoFinal' });
				} else { // regular quick_replies
					await context.setState({ dialog: context.state.lastQRpayload });
				}
			} else {
				await context.setState({ ignore: true });
			}
		} else if (context.event.isText) {
			console.log('--------------------------');
			console.log(`${context.session.user.first_name} ${context.session.user.last_name} digitou ${context.event.message.text}`);
			console.log('Usa dialogflow?', context.state.politicianData.use_dialogflow);
			await context.setState({ whatWasTyped: context.event.message.text, lastQRpayload: '' });
			if (context.state.dialog === 'leavePhoneTwo' || context.state.dialog === 'phoneInvalid') {
				await research.checkPhone(context);
			} else if (context.state.dialog === 'leaveInsta') {
				await context.setState({ insta: context.state.whatWasTyped, dialog: 'leaveInstaValid' });
			} else if (context.state.onTextQuiz === true) {
				await context.setState({ whatWasTyped: parseInt(context.state.whatWasTyped, 10) });
				if (Number.isInteger(context.state.whatWasTyped, 10) === true) {
					await quiz.handleAnswer(context, context.state.whatWasTyped);
				} else {
					await context.sendText('Formato inválido, digite só um número, exemplo 24');
					await context.setState({ dialog: 'startQuiz' });
				}
			} else if (context.state.onButtonQuiz === true) {
				const quizOpt = await quiz.handleText(context);
				if (quizOpt === null) {
					await DF.dialogFlow(context);
				} else {
					await quiz.handleAnswer(context, quizOpt);
				}
			} else if (context.state.dialog === 'joinPrep' || context.state.dialog === 'joinPrepErro') {
				await joinToken.handlePrepToken(context, await prepAPI.postIntegrationToken(context.session.user.id, context.state.whatWasTyped));
			} else if (context.state.whatWasTyped.toLowerCase() === process.env.GET_PERFILDATA && process.env.ENV !== 'prod2') {
				console.log('Deletamos o quiz?', await prepAPI.deleteQuizAnswer(context.session.user.id));
				await context.resetState();
				await context.setState({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
				console.log('Recipient atual', context.state.user);
				await context.setState({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id), ignore: false });
				console.log(`Imprimindo os dados do perfil: \n${JSON.stringify(context.state.politicianData, null, 2)}`);
				await context.setState({ dialog: 'greetings' });
			} else if (context.state.whatWasTyped === process.env.TEST_KEYWORD) {
				await context.setState({ selectedDate: 11 });
				await context.setState({ dialog: 'setEventHour' });
			} else {
				await DF.dialogFlow(context);
			}
		} // -- end text


		if (context.state.ignore === false) {
			switch (context.state.dialog) {
			case 'greetings':
				await context.sendText(flow.greetings.text1);
				await context.sendText(flow.greetings.text2);
				await context.sendText(flow.greetings.text3);
				await desafio.asksDesafio(context);
				break;
			case 'medicaçao':
				await context.sendText(flow.medication.text1, await checkQR.checkMedication(context.state.user.prep_since));
				break;
			case 'sintomas':
			// await context.sendText('<começa o quiz>');
				break;
			case 'acabouRemedio':
				await context.sendText(flow.medication.acabouRemedio1);
				await context.sendText(flow.medication.acabouRemedio2);
				await mainMenu.sendMain(context);
				break;
			case 'esqueciDeTomar':
				await context.sendText(flow.medication.esqueci1);
				await context.sendText(flow.medication.esqueci2);
				// await context.sendText('<começa o quiz>');
				break;
			case 'duvidaComRemedio':
				await context.sendButtonTemplate(flow.medication.duvidaRemedio, opt.duvidaRemedio);
				await mainMenu.sendMain(context);
				break;
			case 'desafio':
				await context.sendText(flow.desafio.text1, opt.desafio);
				break;
			case 'mainMenu':
				await mainMenu.sendMain(context);
				break;
			case 'desafioRecusado':
				await desafio.desafioRecusado(context);
				break;
			case 'beginQuiz':
				await context.setState({ startedQuiz: true });
				await context.sendText(flow.quiz.beginQuiz);
				if (process.env.ENV !== 'local') await context.typing(1000 * 3);
				// falls throught
			case 'startQuiz': // this is the quiz-type of questionario
				await quiz.answerQuiz(context);
				break;
			case 'join':
				await inicioJoin(context);
				break;
			case 'joinPrep':
				await context.sendText(flow.join.joinPrep.text1);
				await context.sendText(flow.join.askPrep.text1, await getQR(flow.join.askPrep));
				break;
			case 'seePrepToken':
				await context.sendText(`${flow.join.askPrep.view} ${context.state.user.integration_token}`);
				await mainMenu.sendMain(context);
				break;
			case 'joinCombina':
				await context.sendText(flow.join.joinCombina.text1);
				await context.sendText(flow.join.joinCombina.text2, await getQR(flow.join.joinCombina));
				break;
			case 'joinCombinaSim':
				await prepAPI.putUpdateVoucherFlag(context.session.user.id, 'combina');
				await context.sendText(flow.join.joinCombina.fim);
				await mainMenu.sendMain(context);
				break;
			case 'joinSUS':
				await context.sendText(flow.join.joinSUS.text1);
				await context.sendText(flow.join.joinSUS.text2, await getQR(flow.join.joinSUS));
				break;
			case 'joinSUSSim':
				await prepAPI.putUpdateVoucherFlag(context.session.user.id, 'sus');
				await context.sendText(flow.join.joinSUS.fim);
				await mainMenu.sendMain(context);
				break;
			case 'joinNaoSabe':
				await context.sendText(flow.join.joinNaoSabe.text1);
				await context.sendText(flow.join.joinNaoSabe.prep);
				await context.sendText(flow.join.joinNaoSabe.combina);
				await context.sendText(flow.join.joinNaoSabe.sus);
				await inicioJoin(context);
				break;
			case 'duvidasPrep':
				await context.sendText(flow.duvidasPrep.text1, await getQR(flow.duvidasPrep));
				break;
			case 'dpEfeitos':
				await context.sendText(flow.duvidasPrep.dpEfeitos);
				await duvidas.prepFollowUp(context);
				break;
			case 'dpDrogas':
				await context.sendText(flow.duvidasPrep.dpDrogas);
				await duvidas.prepFollowUp(context);
				break;
			case 'dpHormonios':
				await context.sendText(flow.duvidasPrep.dpHormonios);
				await duvidas.prepFollowUp(context);
				break;
			case 'dpEsqueci':
				await context.sendText(flow.duvidasPrep.dpEsqueci);
				await duvidas.prepFollowUp(context);
				break;
			case 'dpInfo':
				await context.sendText(flow.duvidasPrep.dpInfo1);
				await context.sendText(flow.duvidasPrep.dpInfo2);
				await duvidas.prepFollowUp(context);
				break;
			case 'duvidasNaoPrep':
				await inicioDuvidasNaoPrep(context);
				break;
			case 'dnpDrogas':
				await context.sendText(flow.duvidasNaoPrep.dnpDrogas);
				await inicioDuvidasNaoPrep(context);
				break;
			case 'dnpHormonios':
				await context.sendText(flow.duvidasNaoPrep.dnpHormonios);
				await inicioDuvidasNaoPrep(context);
				break;
			case 'dnpParaMim':
				await context.sendText(flow.duvidasNaoPrep.dnpParaMim);
				await context.setState({ nextDialog: '' });
				await context.sendText(flow.ofertaPesquisaSim.text2, await getQR(flow.ofertaPesquisaSim));
				break;
			case 'dnpMeTestar':
				await context.sendText(flow.duvidasNaoPrep.dnpMeTestar);
				await inicioAutoTeste(context);
				break;
			case 'deuRuimPrep':
				await context.sendText(flow.deuRuimPrep.text1, await checkQR.checkDeuRuimPrep(context, await getQR(flow.deuRuimPrep)));
				break;
			case 'drpFamilia':
				await context.sendText(flow.deuRuimPrep.drpFamilia);
				await duvidas.deuRuimPrepFollowUp(context);
				break;
			case 'drpParceiros':
				await context.sendText(flow.deuRuimPrep.drpParceiros);
				await duvidas.deuRuimPrepFollowUp(context);
				break;
			case 'drpAmigos':
				await context.sendText(flow.deuRuimPrep.drpAmigos);
				await duvidas.deuRuimPrepFollowUp(context);
				break;
			case 'drpEfeitos':
				await context.sendText(flow.deuRuimPrep.drpEfeitos.text1, await getQR(flow.deuRuimPrep.drpEfeitos));
				break;
			case 'drpEnjoo':
				await context.sendText(flow.deuRuimPrep.drpEfeitos.drpEnjoo);
				await duvidas.deuRuimPrepFollowUp(context, flow.deuRuimPrep.drpEfeitos.followUp);
				break;
			case 'drpGases':
				await context.sendText(flow.deuRuimPrep.drpEfeitos.drpGases);
				await duvidas.deuRuimPrepFollowUp(context, flow.deuRuimPrep.drpEfeitos.followUp);
				break;
			case 'drpDiarreia':
				await context.sendText(flow.deuRuimPrep.drpEfeitos.drpDiarreia);
				await duvidas.deuRuimPrepFollowUp(context, flow.deuRuimPrep.drpEfeitos.followUp);
				break;
			case 'drpDorCabeca':
				await context.sendText(flow.deuRuimPrep.drpEfeitos.drpDorCabeca);
				await duvidas.deuRuimPrepFollowUp(context, flow.deuRuimPrep.drpEfeitos.followUp);
				break;
			case 'drpMoleza':
				await context.sendText(flow.deuRuimPrep.drpEfeitos.drpMoleza);
				await duvidas.deuRuimPrepFollowUp(context, flow.deuRuimPrep.drpEfeitos.followUp);
				break;
			case 'drpIST':
				await context.sendText(flow.deuRuimPrep.drpIST.text1, await getQR(flow.deuRuimPrep.drpIST));
				break;
			case 'drpBolhas':
				await context.sendText(flow.deuRuimPrep.drpIST.drpBolhas);
				await duvidas.deuRuimPrepFollowUp(context);
				break;
			case 'drpFeridas':
				await context.sendText(flow.deuRuimPrep.drpIST.drpFeridas);
				await duvidas.deuRuimPrepFollowUp(context);
				break;
			case 'drpVerrugas':
				await context.sendText(flow.deuRuimPrep.drpIST.drpVerrugas);
				await duvidas.deuRuimPrepFollowUp(context);
				break;
			case 'drpCorrimento':
				await context.sendText(flow.deuRuimPrep.drpIST.drpCorrimento);
				await duvidas.deuRuimPrepFollowUp(context);
				break;
			case 'drpNaoTomei':
				await context.sendText('TODO');
				// await duvidas.deuRuimQuiz(context);
				break;
			case 'deuRuimNaoPrep':
				await context.sendText(flow.deuRuimNaoPrep.text1, await getQR(flow.deuRuimNaoPrep));
				break;
			case 'drnpParaMim':
				await context.sendText(flow.deuRuimNaoPrep.drnpParaMim);
				await drnpFollowUpTriagem(context);
				break;
			case 'drnpMedoTestar':
				await context.sendText(flow.deuRuimNaoPrep.drnpMedoTestar);
				await drnpFollowUpTriagem(context);
				break;
			case 'drnpFeridas':
				await context.sendText(flow.deuRuimNaoPrep.drnpFeridas);
				await drnpFollowUpTriagem(context);
				break;
			case 'drnpPEPNao':
				await context.sendText(flow.deuRuimNaoPrep.drnpPEPNao.text1, await getQR(flow.deuRuimNaoPrep.drnpPEPNao));
				break;
			case 'drnpParou28':
				await context.sendText(flow.deuRuimNaoPrep.drnpPEPNao.drnpParou28);
				await drnpFollowUpAgendamento(context);
				break;
			case 'drnpEfeito':
				await context.sendText(flow.deuRuimNaoPrep.drnpPEPNao.drnpEfeito);
				await drnpFollowUpAgendamento(context);
				break;
			case 'drnpPerdeu':
				await context.sendText(flow.deuRuimNaoPrep.drnpPEPNao.drnpPerdeu);
				await drnpFollowUpAgendamento(context);
				break;
			case 'drnpExposicao':
				await context.sendText(flow.deuRuimNaoPrep.drnpPEPNao.drnpExposicao);
				await drnpFollowUpAgendamento(context);
				break;
			case 'drnpTomei28':
				await context.sendText(flow.deuRuimNaoPrep.drnpPEPNao.drnpTomei28);
				await drnpFollowUpAgendamento(context);
				break;
			case 'alarmePrep':
				await context.sendText(flow.alarmePrep.text1, await getQR(flow.alarmePrep));
				break;
			case 'alarmeOK':
				await duvidas.alarmeOK(context);
				break;
			case 'alarmeSobDemanda':
				await context.sendText(flow.alarmePrep.comoTomando.sobDemanda);
				await mainMenu.sendMain(context);
				break;
			case 'alarmeDiaria':
				await context.sendText(flow.alarmePrep.comoAjudo.text1, await getQR(flow.alarmePrep.comoAjudo));
				break;
			case 'alarmeCancelar':
				await context.sendText(flow.alarmePrep.alarmeCancelar);
				await mainMenu.sendMain(context);
				break;
			case 'alarmeNaHora':
				await context.setState({ alarmePage: 1 });
				// fallthrough
			case 'pageHorario':
				await context.sendText(flow.alarmePrep.alarmeNaHora1, await duvidas.alarmeHorario(context.state.alarmePage));
				break;
			case 'alarmeMinuto':
				await context.sendText(flow.alarmePrep.alarmeNaHora2, await duvidas.alarmeMinuto(context.state.alarmeHora));
				break;
			case 'alarmeFinal':
				await prepAPI.putUpdateReminderBefore(context.session.user.id, 1, await duvidas.buildChoiceTimeStamp(context.state.alarmeHora, context.state.alarmeMinuto));
				await context.sendText(flow.alarmePrep.alarmeFinal);
				await mainMenu.sendMain(context);
				break;
			case 'alarmeJaTomei':
				await context.sendText(flow.alarmePrep.alarmeJaTomei.text1, await getQR(flow.alarmePrep.alarmeJaTomei));
				break;
			case 'alarmeTempoFinal':
				await prepAPI.putUpdateReminderAfter(context.session.user.id, 1, context.state.alarmeTempo);
				await context.sendText(flow.alarmePrep.alarmeJaTomei.text2);
				await mainMenu.sendMain(context);
				break;
			case 'TCLE':
				await research.TCLE(context);
				break;
			case 'preTCLE':
				await research.preTCLE(context, await consulta.checkAppointment(context.session.user.id));
				break;
			case 'termosAccept':
				await timer.deleteRecrutamento(context.session.user.id);
				await MaAPI.postRecipientMA(context.state.politicianData.user_id, { fb_id: context.session.user.id, session: { recrutamentoTimer: false } }); // update key on the api
				await context.setState({ preCadastroSignature: await prepAPI.postSignature(context.session.user.id, 1), userAnsweredTermos: true, recrutamentoTimer: false });
				await context.sendText(flow.onTheResearch.termosAfter);
				await mainMenu.sendMain(context);
				break;
			case 'termosDontAccept':
				await timer.deleteRecrutamento(context.session.user.id);
				await MaAPI.postRecipientMA(context.state.politicianData.user_id, { fb_id: context.session.user.id, session: { recrutamentoTimer: false } }); // update key on the api
				await context.setState({ preCadastroSignature: await prepAPI.postSignature(context.session.user.id, 0), userAnsweredTermos: true, recrutamentoTimer: false });
				await context.sendText(flow.onTheResearch.termosAfter);
				await mainMenu.sendMain(context);
				break;
			case 'ofertaPesquisaStart':
				await research.ofertaPesquisaStart(context);
				break;
			case 'pesquisaSim':
			case 'ofertaPesquisaSim':
				await context.setState({ meContaDepois: false });
				await research.ofertaPesquisaSim(context);
				break;
			case 'meContaDepois':
				await meContaDepoisFollowUp(context);
				break;
			case 'pesquisaPresencial':
				// await context.setState({ categoryConsulta: 'BATE PAPO PRESENCIAL' });
				await consulta.startConsulta(context);
				break;
			case 'pesquisaNao':
			case 'ofertaPesquisaEnd':
				await vouPensarMelhorFollowUp(context);
				break;
			case 'pesquisaVirtual':
			case 'leavePhone':
				await context.sendText(flow.leavePhone.opening, await getQR(flow.leavePhone));
				break;
			case 'leavePhoneTwo':
				await context.sendText(flow.leavePhone.phone);
				break;
			case 'leaveInsta':
				await context.sendText(flow.leavePhone.insta);
				break;
			case 'leaveInstaValid':
				await prepAPI.putRecipientPrep(context.session.user.id, { instagram: context.state.insta });
				await context.setState({ leftContact: true });
				await context.sendText(flow.leavePhone.success);
				await sendMail('AMANDA - Novo instagram de contato', await help.buildMail(context, 'Instagram', context.state.insta), context.state.user.city);
				await contactFollowUp(context);
				break;
			case 'phoneValid': {
				const res = await prepAPI.putRecipientPrep(context.session.user.id, { phone: context.state.phone });
				if (!res || !res.id || !res.error) { sentryError('Erro ao salvar telefone do recipient no prep', { res, phone: context.state.phone, user: context.state.user }); }
				await context.setState({ leftContact: true });
				await context.sendText(flow.leavePhone.success);
				await sendMail('AMANDA - Novo telefone de contato', await help.buildMail(context, 'Whatsapp', context.state.phone), context.state.user.city);
				await contactFollowUp(context);
				break;
			}
			case 'phoneInvalid':
				await context.sendText(flow.leavePhone.failure);
				// await context.sendText(flow.leavePhone.failure, opt.leavePhone2);
				break;
			case 'dontLeaveContact':
				await contactFollowUp(context);
				break;
			case 'getContact':
				await context.setState({ contatoMsg: await help.buildContatoMsg(context.state.user.city) });
				if (context.state.contatoMsg) {
					await context.sendText(context.state.contatoMsg);
					await context.typing(1000 * 5);
					await mainMenu.sendMain(context);
				} else {
					await mainMenu.sendMain(context);
				}
				break;
			case 'offerConversar':
			case 'recrutamento':
				await research.recrutamento(context);
				break;
			case 'recrutamentoQuiz':
				await context.setState({ categoryQuestion: 'recrutamento' });
				await quiz.answerQuiz(context);
				break;
			case 'offerBrincadeira':
				await context.sendText(flow.offerBrincadeira.text1, await getQR(flow.offerBrincadeira));
				break;
			case 'querBrincadeira':
				await context.setState({ categoryQuestion: 'quiz_brincadeira' });
				await quiz.answerQuiz(context);
				break;
			case 'checarConsulta':
				await context.setState({ categoryConsulta: 'emergencial' });
				await consulta.checarConsulta(context);
				break;
			case 'getCity':
			case 'showDays':
			case 'loadCalendar':
				await context.setState({ categoryConsulta: 'recrutamento' }); // on end quiz
				await consulta.startConsulta(context);
				break;
			case 'showDate':
				await consulta.showDays(context, true);
				break;
			case 'showHours':
				await consulta.showHours(context, context.state.showHours);
				break;
			// case 'finalDate':
			// moved up, to send user to ofertaPesquisaEnd by changing the dialog state and avoiding cross importing
			// 	break;
			case 'nextDay':
				await context.setState({ paginationDate: context.state.paginationDate + 1, lastQRpayload: '' });
				await consulta.showDays(context);
				break;
			case 'previousDay':
				await context.setState({ paginationDate: context.state.paginationDate - 1, lastQRpayload: '' });
				await consulta.showDays(context);
				break;
			case 'nextHour':
				await context.setState({ paginationHour: context.state.paginationHour + 1, lastQRpayload: '' });
				await consulta.showHours(context, context.state.lastQRpayload.replace('nextHour', ''));
				break;
			case 'previousHour':
				await context.setState({ paginationHour: context.state.paginationHour - 1, lastQRpayload: '' });
				await consulta.showHours(context, context.state.lastQRpayload.replace('previousHour', ''));
				break;
			case 'verConsulta':
				await consulta.verConsulta(context);
				break;
			case 'outrasDatas':
			case 'outrosHorarios':
				await context.sendText(await help.buildPhoneMsg(context.state.user.city, flow.consulta.outrasDatas, help.emergenciaDictionary, flow.consulta.askContato),
					opt.outrasDatas);
				break;
			case 'listaDatas':
				await context.setState({ paginationDate: 1, paginationHour: 1 });
				await consulta.showDays(context);
				break;
			case 'askResearch':
				await context.sendText(flow.desafio.text2, opt.answer.sendResearch); // send research
				break;
			case 'firstNoResearch': // voce gostaria de saber mais sobre o nosso projeto - não
				await context.sendButtonTemplate(flow.onTheResearch.buildTermos, opt.TCLE);
				await context.sendText(flow.onTheResearch.saidYes, opt.termos2);
				break;
			case 'firstJoinResearch': // voce gostaria de saber mais sobre o nosso projeto - sim
			// await prepAPI.postParticipar(context.session.user.id, 1);
				await context.sendText(flow.quizYes.text15);
				await context.sendButtonTemplate(flow.onTheResearch.buildTermos, opt.TCLE);
				await context.sendText(flow.onTheResearch.saidYes, opt.termos);
				break;
			case 'noResearchAfter':
				await mainMenu.sendMain(context, flow.foraPesquisa.text1);
				break;
			case 'joinResearchAfter':
				await prepAPI.putUpdatePartOfResearch(context.session.user.id, 1);
				await context.setState({ categoryConsulta: 'recrutamento', sendExtraMessages: true }); // sendExtraMessages: used only to show a few different messages on consulta
				await consulta.checarConsulta(context);
				break;
			case 'seePreventions':
				await context.sendText(flow.prevention.text1);
				await context.sendText(flow.prevention.text2);
				await context.sendText(flow.prevention.text3);
				await desafio.followUp(context);
				break;
			case 'retryTriagem':
				await context.sendText(flow.triagem.retryTriagem, opt.triagem2);
				break;
			case 'autoTeste':
				await inicioAutoTeste(context);
				break;
			case 'auto':
				if (flow.autoTeste.auto3[context.state.user.city]) {
					await context.sendText(flow.autoTeste.auto1);
					await context.sendText(flow.autoTeste.auto2);
					await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.auto3[context.state.user.city],
						await checkQR.autoTesteOption(opt.autotesteEnd, context.state.user.city));
				} else {
					await context.sendText(flow.autoTeste.auto1);
					await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.auto2,
						await checkQR.autoTesteOption(opt.autotesteEnd, context.state.user.city));
				}
				break;
			case 'ong':
				await context.sendText(flow.autoTeste.ong1);
				await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.ong2[context.state.user.city],
					await checkQR.autoTesteOption(opt.ong, context.state.user.city));
				break;
			case 'rua':
				await context.sendText(flow.autoTeste.rua1);
				await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.rua2[context.state.user.city],
					await checkQR.autoTesteOption(opt.rua, context.state.user.city));
				break;
			case 'servico':
				await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.servico1,
					await checkQR.autoTesteOption(opt.servico, context.state.user.city));
				break;
			case 'sendToTriagem':
			case 'triagem': // this is the triagem-type of questionario
				await triagem.getTriagem(context);
				break;
			case 'aboutAmanda':
				await context.sendImage(flow.aboutAmanda.gif);
				await context.sendText(flow.aboutAmanda.msgOne);
				await context.sendText(flow.aboutAmanda.msgTwo);
				await desafio.followUp(context);
				// await mainMenu.sendMain(context);
				break;
			case 'baterPapo':
				await context.sendText(flow.baterPapo.text1);
				await timer.createBaterPapoTimer(context.session.user.id, context);
				break;
			case 'notificationOn':
				await MaAPI.updateBlacklistMA(context.session.user.id, 1);
				await prepAPI.putRecipientNotification(context.session.user.id, 1);
				await MaAPI.logNotification(context.session.user.id, context.state.politicianData.user_id, 3);
				await context.sendText(flow.notifications.on);
				break;
			case 'notificationOff':
				await MaAPI.updateBlacklistMA(context.session.user.id, 0);
				await prepAPI.putRecipientNotification(context.session.user.id, 0);
				await MaAPI.logNotification(context.session.user.id, context.state.politicianData.user_id, 4);
				await context.sendText(flow.notifications.off);
				break;
			case 'addRecrutamentoTimer': // user clicked "no" on recrutamento, we might have to create a timer
				if (!context.state.preCadastroSignature) { // garantee we won't send TCLE more than once
					await context.setState({ recrutamentoTimer: true }); // store this key in both local state and api
					await MaAPI.postRecipientMA(context.state.politicianData.user_id, { fb_id: context.session.user.id, session: { recrutamentoTimer: context.state.recrutamentoTimer } });
					await timer.createRecrutamentoTimer(context.session.user.id, context); // create recrutamento timer if it wasn't created already (and if TCLE was never sent)
				}
				await mainMenu.sendMain(context);
				break;
			} // end switch case
		}
	} catch (error) {
		await context.sendText(flow.error.text1, await checkQR.getErrorQR(context.state.lastQRpayload)); // warning user
		await sentryError(await buildNormalErrorMsg(`${context.session.user.first_name} ${context.session.user.last_name}`, error.stack, context.state));
		if (process.env.ENV !== 'local') {
			await help.Sentry.configureScope(async (scope) => { // sending to sentry
				scope.setUser({ username: `${context.session.user.first_name} ${context.session.user.last_name}` });
				scope.setExtra('state', context.state);
				throw error;
			});
		}
	} // catch
}; // handler function
