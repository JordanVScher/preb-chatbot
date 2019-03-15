const MaAPI = require('./chatbot_api.js');
const prepAPI = require('./utils/prep_api.js');
const { createIssue } = require('./send_issue');
const { checkPosition } = require('./dialogFlow');
const { apiai } = require('./utils/helper');
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
const { endQuiz } = require('./utils/quiz_aux');

module.exports = async (context) => {
	try {
		// we reload politicianData on every useful event
		await context.setState({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id) });
		// console.log(context.state.politicianData);
		// we update context data at every interaction (post ony on the first time)
		await MaAPI.postRecipientMA(context.state.politicianData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			gender: context.session.user.gender === 'male' ? 'M' : 'F',
			origin_dialog: 'greetings',
			picture: context.session.user.profile_pic,
			// session: JSON.stringify(context.state),
		});

		await help.addNewUser(context, prepAPI);
		await timer.deleteTimers(context.session.user.id);
		// await context.setState({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
		// console.log(context.state.user);

		if (context.event.isPostback) {
			await context.setState({ lastPBpayload: context.event.postback.payload });
			if (!context.state.dialog || context.state.dialog === '' || context.state.lastPBpayload === 'greetings') { // because of the message that comes from the comment private-reply
				await context.setState({ dialog: 'greetings' });
				// await context.setState({ dialog: 'checarConsulta' });
				// await context.setState({ dialog: 'showDays' });
				// await context.setState({ dialog: 'verConsulta' });
				// await context.setState({ dialog: 'beginQuiz' });
				// await context.setState({ dialog: 'triagem' });
				await context.setState({ onTextQuiz: false, sendExtraMessages: false, paginationDate: 1, paginationHour: 1 }); // eslint-disable-line
			} else {
				await context.setState({ dialog: context.state.lastPBpayload });
			}
			await MaAPI.logFlowChange(context.session.user.id, context.state.politicianData.user_id,
				context.event.postback.payload, context.event.postback.title);
		} else if (context.event.isQuickReply) {
			await context.setState({ lastQRpayload: context.event.quickReply.payload });
			if (context.state.lastQRpayload.slice(0, 9) === 'eventDate') { // handling user clicking on a date in setEvent
				await context.setState({ selectedDate: context.state.lastQRpayload.slice(9, -1) });
				await context.setState({ dialog: 'setEventHour' });
			} else if (context.state.lastQRpayload.slice(0, 9) === 'eventHour') {
				await context.setState({ selectedHour: context.state.lastQRpayload.slice(9, -1) });
				await context.setState({ dialog: 'setEvent' });
			} else if (context.state.lastQRpayload.slice(0, 4) === 'quiz') {
				await quiz.handleAnswerA(context, context.state.lastQRpayload.replace('quiz', ''));
			} else if (context.state.lastQRpayload.slice(0, 4) === 'tria') {
				await triagem.handleAnswer(context, context.state.lastQRpayload.replace('tria', ''));
			} else if (context.state.lastQRpayload.slice(0, 13) === 'extraQuestion') {
				await quiz.AnswerExtraQuestion(context);
			} else if (context.state.lastQRpayload.slice(0, 12) === 'optAutoTeste') {
				await context.setState({ cidade: await context.state.lastQRpayload.replace('optAutoTeste', '') });
				await context.setState({ dialog: 'optAutoTeste' });
			} else if (context.state.lastQRpayload.slice(0, 3) === 'dia') {
				await context.setState({ dialog: 'showHours' });
			} else if (context.state.lastQRpayload.slice(0, 4) === 'hora') {
				await context.setState({ dialog: 'finalDate' });
			} else if (context.state.lastQRpayload.slice(0, 8) === 'nextHour') {
				await context.setState({ dialog: 'nextHour' });
			} else if (context.state.lastQRpayload.slice(0, 12) === 'previousHour') {
				await context.setState({ dialog: 'previousHour' });
			} else if (context.state.lastQRpayload.slice(0, 4) === 'city') {
				await context.setState({ cityId: await context.state.lastQRpayload.replace('city', '') });
				await context.setState({ dialog: 'showDays' });
			} else if (context.state.lastQRpayload.slice(0, 5) === 'Sign-') {
				await prepAPI.postSignature(context.session.user.id, opt.TCLE[0].url);
				await context.setState({ dialog: await context.state.lastQRpayload.replace('Sign-', '') });
			} else if (context.state.lastQRpayload.slice(0, 7) === 'NoSign-') {
				await context.setState({ dialog: await context.state.lastQRpayload.replace('NoSign-', '') });
			} else { // regular quick_replies
				await context.setState({ dialog: context.state.lastQRpayload });
				await MaAPI.logFlowChange(context.session.user.id, context.state.politicianData.user_id,
					context.event.message.quick_reply.payload, context.event.message.quick_reply.payload);
			}
		} else if (context.event.isText) {
			await context.setState({ whatWasTyped: `${context.event.message.text}` });
			if (context.state.onTextQuiz === true) {
				await quiz.handleAnswerA(context, context.state.whatWasTyped);
			} else if (context.state.dialog === 'joinToken') {
				await research.handleToken(context);
			} else if (context.state.whatWasTyped === process.env.GET_PERFILDATA && process.env.ENV !== 'prod') {
				console.log('Deletamos o quiz?', await prepAPI.deleteQuizAnswer(context.session.user.id));
				await context.setState({ startedQuiz: false, is_eligible_for_research: 0, is_target_audience: 0 });
				await context.setState({ is_target_audience: false, is_prep: false });
				console.log('Recipient atual', await prepAPI.getRecipientPrep(context.session.user.id));
				console.log(`Imprimindo os dados do perfil: \n${JSON.stringify(context.state.politicianData, undefined, 2)}`);
				await context.setState({ is_eligible_for_research: null, is_part_of_research: null, finished_quiz: null });
				await context.setState({ dialog: 'greetings' });
			} else if (context.state.whatWasTyped === process.env.TEST_KEYWORD) {
				await context.setState({ selectedDate: 11 });
				await context.setState({ dialog: 'setEventHour' });
			} else if (context.state.politicianData.use_dialogflow === 1) { // check if politician is using dialogFlow
				await context.setState({ apiaiResp: await apiai.textRequest(await help.formatDialogFlow(context.state.whatWasTyped), { sessionId: context.session.user.id }) });
				// await context.setState({ resultParameters: context.state.apiaiResp.result.parameters }); // getting the entities
				await context.setState({ intentName: context.state.apiaiResp.result.metadata.intentName }); // getting the intent
				await checkPosition(context);
			} else { // not using dialogFlow
				await context.setState({ dialog: 'prompt' });
				await createIssue(context);
			}
			// await createIssue(context, 'Não entendi sua mensagem pois ela é muito complexa. Você pode escrever novamente, de forma mais direta?');
		} // -- end text

		switch (context.state.dialog) {
		case 'greetings':
			await context.sendText(flow.greetings.text1);
			await context.sendText(flow.greetings.text2);
			await desafio.asksDesafio(context);
			// await timer.sendCarouselSus(context, opt.sus);
			// await consulta.getCity(context);
			// await quiz.answerQuizA(context);
			break;
		case 'medicaçao':
			await context.sendText(flow.medication.text1, await checkQR.checkMedication(context));
			break;
		case 'sintomas':
			await context.sendText('<começa o quiz>');
			break;
		case 'acabouRemedio':
			await context.sendText(flow.medication.acabouRemedio1);
			await context.sendText(flow.medication.acabouRemedio2);
			await mainMenu.sendMain(context);
			break;
		case 'esqueciDeTomar':
			await context.sendText(flow.medication.esqueci1);
			await context.sendText(flow.medication.esqueci2);
			await context.sendText('<começa o quiz>');
			break;
		case 'duvidaComRemedio':
			await context.sendButtonTemplate(flow.medication.duvidaRemedio, opt.duvidaRemedio);
			await mainMenu.sendMain(context);
			break;
		case 'desafio':
			await context.sendText(flow.desafio.text1, opt.desafio);
			break;
		case 'sendFollowUp':
			await mainMenu.sendFollowUp(context);
		// falls throught
		case 'mainMenu':
			await mainMenu.sendMain(context);
			break;
		case 'beginQuiz':
			await context.setState({ startedQuiz: true });
			await context.sendText(flow.quiz.beginQuiz);
		// falls throught
		case 'startQuizA': // this is the quiz-type of questionario
			await context.setState({ categoryQuestion: 'quiz' });
			await quiz.answerQuizA(context);
			// await endQuiz(context, prepAPI);
			break;
		// case 'naoAceito':
		// 	await context.sendText('Tudo bem. Você ainda poderá marcar uma consulta.');
		// 	await mainMenu.sendMain(context);
		// 	break;
		case 'aceitaTermos':
			await prepAPI.postSignature(context.session.user.id, opt.TCLE[0].url); // stores user accepting termos
			// falls throught
		case 'naoAceitaTermos': // regular flow
			await endQuiz(context, prepAPI);
			break;
		case 'joinToken':
			await context.sendText(flow.joinToken.text1, opt.joinToken);
			break;
		case 'seeToken':
			await context.sendText(`${flow.joinToken.view} ${context.state.user.integration_token}`);
			await mainMenu.sendMain(context);
			break;
		case 'getCity': // this is the regular type of consulta
			await context.setState({ categoryConsulta: 'recrutamento' }); // on end quiz
			await consulta.showCities(context);
			break;
		case 'getCity2': // this is the diferent type of consulta
			await context.setState({ categoryConsulta: 'emergencial' });
			await consulta.showCities(context);
			break;
		case 'checarConsulta':
			await context.setState({ categoryConsulta: 'emergencial' });
			await consulta.checarConsulta(context);
			break;
		case 'showDays':
			await consulta.showDays(context);
			break;
		case 'showHours':
			await consulta.showHours(context, context.state.lastQRpayload.replace('dia', ''));
			break;
		case 'finalDate':
			await consulta.finalDate(context, context.state.lastQRpayload.replace('hora', '').replace(':', '-'));
			break;
		case 'nextDay':
			await context.setState({ paginationDate: context.state.paginationDate + 1 });
			await consulta.showDays(context);
			break;
		case 'previousDay':
			await context.setState({ paginationDate: context.state.paginationDate - 1 });
			await consulta.showDays(context);
			break;
		case 'nextHour':
			await context.setState({ paginationHour: context.state.paginationHour + 1 });
			await consulta.showHours(context, context.state.lastQRpayload.replace('nextHour', ''));
			break;
		case 'previousHour':
			await context.setState({ paginationHour: context.state.paginationHour - 1 });
			await consulta.showHours(context, context.state.lastQRpayload.replace('previousHour', ''));
			break;
		case 'verConsulta':
			await consulta.verConsulta(context);
			break;
		case 'outrasDatas':
			await context.sendText(`${flow.consulta.outrasDatas}
			       \nSão Paulo - SP: ${help.telefoneDictionary[1]}`
				+ `\nBelo Horizonte - MG: ${help.telefoneDictionary[2]}`
				+ `\nSalvador - BA: ${help.telefoneDictionary[3]}`, opt.outrasDatas);
			break;
		case 'listaDatas':
			await context.setState({ paginationDate: 1, paginationHour: 1 });
			await consulta.showDays(context);
			break;
		case 'askResearch':
			await context.sendText(flow.desafio.text2, opt.answer.sendResearch); // send research
			break;
		case 'firstNoResearch':
			await context.sendText(flow.notEligible.saidNo);
			await mainMenu.sendMain(context);
			break;
		case 'firstJoinResearch':
			await prepAPI.postParticipar(context.session.user.id, 1);
			await research.researchSaidYes(context);
			break;
		case 'noResearchAfter':
			await mainMenu.sendMain(context, flow.foraPesquisa.text1);
			break;
		case 'joinResearchAfter':
			await prepAPI.putUpdatePartOfResearch(context.session.user.id, 1);
			await research.researchSaidYes(context);
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
			if (context.state.suggestWaitForTest === true) { // todo isso tem que acontecer depois do user escolher um tipo de teste mas essa parte não tá mapeada ainda
				await context.setState({ suggestWaitForTest: false });
				await context.sendText(flow.triagem.suggestWaitAutoTest);
			}
			await context.sendText(flow.autoTeste.cidade, opt.autotesteCidades);
			break;
		case 'optAutoTeste':
			await context.sendText(flow.autoTeste.start, opt.autoteste);
			break;
		case 'auto':
			await context.sendText(flow.autoTeste.auto1);
			await context.sendText(flow.autoTeste.auto2);
			await context.sendText(flow.autoTeste.auto3[context.state.cidade], opt.autotesteEnd);
			break;
		case 'ong':
			await context.sendText(flow.autoTeste.ong1);
			await context.sendText(flow.autoTeste.ong2[context.state.cidade], opt.ong);
			break;
		case 'rua':
			await context.sendText(flow.autoTeste.rua1);
			await context.sendText(flow.autoTeste.rua2[context.state.cidade], opt.rua);
			break;
		case 'servico':
			await context.sendText(flow.autoTeste.servico1, opt.servico);
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
			break;
		case 'baterPapo':
			await context.sendText(flow.baterPapo.text1);
			await timer.createBaterPapoTimer(context.session.user.id, context);
			// await desafio.followUp(context);
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
		} // end switch case
	} catch (error) {
		const date = new Date();
		console.log(`Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} =>`);
		console.log(error);
		await context.sendText(flow.error.text1, await checkQR.getErrorQR(context.state.lastQRpayload)); // warning user

		await help.Sentry.configureScope(async (scope) => { // sending to sentry
			scope.setUser({ username: context.session.user.first_name });
			scope.setExtra('state', context.state);
			throw error;
		});
	} // catch
}; // handler function
