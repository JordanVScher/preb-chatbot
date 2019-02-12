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
const { handleToken } = require('./utils/research');
const mainMenu = require('./utils/mainMenu');
const research = require('./utils/research');
const timer = require('./utils/timer');

module.exports = async (context) => {
	try {
		// we reload politicianData on every useful event
		await context.setState({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id) });
		// we update context data at every interaction (post ony on the first time)
		await MaAPI.postRecipientMA(context.state.politicianData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			gender: context.session.user.gender === 'male' ? 'M' : 'F',
			origin_dialog: 'greetings',
			picture: context.session.user.profile_pic,
			// session: JSON.stringify(context.state),
		});

		if (!context.state.sentPrepPost || context.state.sentPrepPost === false) { // adding user to the prep base, happens only once
			await prepAPI.postRecipientPrep(context.session.user.id, context.state.politicianData.user_id, `${context.session.user.first_name} ${context.session.user.last_name}`);
			await context.setState({ sentPrepPost: true });
		} else { // updating user already on prep base
			await prepAPI.putRecipientPrep(context.session.user.id, `${context.session.user.first_name} ${context.session.user.last_name}`);
		}

		await timer.deleteTimers(context.session.user.id);

		if (context.event.isPostback) {
			await context.setState({ lastPBpayload: context.event.postback.payload });
			if (!context.state.dialog || context.state.dialog === '' || context.state.lastPBpayload === 'greetings') { // because of the message that comes from the comment private-reply
				await context.setState({ dialog: 'greetings' });
				// await context.setState({ dialog: 'getCity' });
				await context.setState({ onTextQuiz: false });
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
			} else if (context.state.lastQRpayload.slice(0, 13) === 'extraQuestion') {
				await quiz.AnswerExtraQuestion(context);
			} else if (context.state.lastQRpayload.slice(0, 3) === 'dia') {
				await context.setState({ dialog: 'showHours' });
			} else if (context.state.lastQRpayload.slice(0, 4) === 'hora') {
				await context.setState({ dialog: 'finalDate' });
			} else if (context.state.lastQRpayload.slice(0, 7) === 'nextDay') {
				await context.setState({ dialog: 'nextDay' });
			} else if (context.state.lastQRpayload.slice(0, 8) === 'nextHour') {
				await context.setState({ dialog: 'nextHour' });
			} else if (context.state.lastQRpayload.slice(0, 4) === 'city') {
				await context.setState({ cityId: await context.state.lastQRpayload.replace('city', '') });
				await context.setState({ dialog: 'showDays' });
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
				await handleToken(context);
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
			// await consulta.getCity(context);
			// await quiz.answerQuizA(context);
			break;
		case 'desafio':
			await context.sendText(flow.desafio.text1, opt.desafio);
			break;
		case 'desafioRecusado':
			await desafio.desafioRecusado(context);
			break;
		case 'desafioAceito':
			await desafio.desafioAceito(context);
			break;
		case 'sendFollowUp':
			await mainMenu.sendFollowUp(context);
		// falls throught
		case 'mainMenu':
			await mainMenu.sendMain(context);
			break;
		case 'beginQuiz':
			await context.setState({ startedQuiz: true });
			await context.sendText('Preparar, apontar... fogo!');
			// falls throught
		case 'startQuizA': // this is the quiz-type of questionario
			await context.setState({ categoryQuestion: 'quiz' });
			await quiz.answerQuizA(context);
			break;
		case 'triagem': // this is the triagem-type of questionario
			await context.setState({ categoryQuestion: 'triagem' });
			await quiz.answerQuizA(context);
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
		case 'joinToken':
			await context.sendText(flow.joinToken.text1, opt.joinToken);
			break;
		case 'consulta':
			await context.sendText('Escolha uma opção!', await desafio.checkAnsweredQuiz(context, opt.consulta));
			break;
		case 'getCity': // this is the regular type of consulta
			await context.setState({ categoryConsulta: 'recrutamento' });
			await consulta.showCities(context);
			break;
		case 'getCity2': // this is the diferent type of consulta
			await context.setState({ categoryConsulta: 'anotherType' });
			await consulta.showCities(context);
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
			await consulta.nextDay(context, context.state.lastQRpayload.replace('nextDay', ''));
			break;
		case 'nextHour':
			await consulta.nextHour(context, context.state.lastQRpayload.replace('nextHour', ''));
			break;
		case 'verConsulta':
			await consulta.verConsulta(context);
			break;
		case 'noResearch':
			await mainMenu.sendMain(context, `${flow.quizNo.text3} ${flow.mainMenu.text1}`);
			break;
		case 'joinResearch':
			await prepAPI.putUpdatePartOfResearch(context.session.user.id, 1);
			await research.researchSaidYes(context);
			break;
		case 'endFlow':
			await context.sendText('Você pode me compartilhar se quiser');
			break;
		case 'seePreventions':
			await context.sendText(flow.prevention.text1);
			await context.sendText(flow.prevention.text2);
			await context.sendText(flow.prevention.text3);
			await desafio.followUp(context);
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
		await context.sendText('Ops. Tive um erro interno. Tente novamente.'); // warning user

		await help.Sentry.configureScope(async (scope) => { // sending to sentry
			scope.setUser({ username: context.session.user.first_name });
			scope.setExtra('state', context.state);
			throw error;
		});
	} // catch
}; // handler function
