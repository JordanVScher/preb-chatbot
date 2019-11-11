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
const { sendMail } = require('./utils/mailer');
const { addNewUser } = require('./utils/labels');
const { sentryError } = require('./utils/mailer');
const { buildNormalErrorMsg } = require('./utils/error');

module.exports = async (context) => {
	try {
		await context.setState({ politicianData: await MaAPI.getPoliticianData(context.event.rawEvent.recipient.id), ignore: false });
		// console.log(context.state.politicianData);
		// we update context data at every interaction (post ony on the first time)
		await MaAPI.postRecipientMA(context.state.politicianData.user_id, {
			fb_id: context.session.user.id,
			name: `${context.session.user.first_name} ${context.session.user.last_name}`,
			gender: context.session.user.gender === 'male' ? 'M' : 'F',
			origin_dialog: 'greetings',
			picture: context.session.user.profile_pic,
			extra_fields: await help.buildLabels(context.state.user.system_labels),
			// session: JSON.stringify(context.state),
		});

		console.log('context.state.user', context.state.user);
		console.log('context.state.user.system_labels', await help.buildLabels(context.state.user.system_labels));
		await addNewUser(context, prepAPI);
		await timer.deleteTimers(context.session.user.id);

		if (context.event.isPostback) {
			await context.setState({ lastPBpayload: context.event.postback.payload, lastQRpayload: '' });
			await context.setState({ onTextQuiz: false, sendExtraMessages: false, paginationDate: 1, paginationHour: 1, goBackToQuiz: false, goBackToTriagem: false}); // eslint-disable-line
			if (!context.state.dialog || context.state.dialog === '' || context.state.lastPBpayload === 'greetings') { // because of the message that comes from the comment private-reply
				await context.setState({ dialog: 'greetings' });
				// await context.setState({ dialog: 'leavePhone' });
				// await context.setState({ dialog: 'naoAceitaTermos' });
				// await context.setState({ dialog: 'aceitaTermos' });
				// await context.setState({ dialog: 'autoTeste' });
			} else {
				await context.setState({ dialog: context.state.lastPBpayload });
			}
			await MaAPI.logFlowChange(context.session.user.id, context.state.politicianData.user_id,
				context.event.postback.payload, context.event.postback.title);
		} else if (context.event.isQuickReply) {
			// console.log(context.session.user.first_name, 'clicks lastQRpayload => new payload:', `${context.state.lastQRpayload} => ${context.event.quickReply.payload}`);
			if (!context.state.lastQRpayload || context.state.lastQRpayload !== context.event.quickReply.payload) { // check if last clicked button is the same as the new one
				await context.setState({ lastQRpayload: context.event.quickReply.payload }); // update last quick reply chosen
				await MaAPI.logFlowChange(context.session.user.id, context.state.politicianData.user_id,
					context.event.message.quick_reply.payload, context.event.message.quick_reply.payload);
				if (context.state.lastQRpayload.slice(0, 9) === 'eventDate') { // handling user clicking on a date in setEvent
					await context.setState({ selectedDate: context.state.lastQRpayload.slice(9, -1) });
					await context.setState({ dialog: 'setEventHour' });
				} else if (context.state.lastQRpayload.slice(0, 9) === 'eventHour') {
					await context.setState({ selectedHour: context.state.lastQRpayload.slice(9, -1) });
					await context.setState({ dialog: 'setEvent' });
				} else if (context.state.lastQRpayload.slice(0, 4) === 'quiz') {
					// await quiz.handleAnswerA(context, context.state.lastQRpayload.replace('quiz', '').replace(context.state.currentQuestion.code), '');
					await quiz.handleAnswerA(context, context.state.lastQRpayload.charAt(4));
				} else if (context.state.lastQRpayload.slice(0, 4) === 'tria') {
					await triagem.handleAnswer(context, context.state.lastQRpayload.charAt(4));
				} else if (context.state.lastQRpayload.slice(0, 13) === 'extraQuestion') {
					await quiz.AnswerExtraQuestion(context);
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
					await context.setState({ preCadastro: await prepAPI.postSignature(context.session.user.id, 1) }); // stores user accepting termos
					await context.setState({ dialog: await context.state.lastQRpayload.replace('Sign-', '') });
				} else if (context.state.lastQRpayload.slice(0, 7) === 'NoSign-') {
					await context.setState({ dialog: await context.state.lastQRpayload.replace('NoSign-', '') });
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
					await quiz.handleAnswerA(context, context.state.whatWasTyped);
				} else {
					await context.sendText('Formato inválido, digite só um número, exemplo 24');
					await context.setState({ dialog: 'startQuizA' });
				}
			} else if (context.state.dialog === 'joinToken' || context.state.dialog === 'joinTokenErro') {
				await research.handleToken(context, await prepAPI.postIntegrationToken(context.session.user.id, context.state.whatWasTyped));
			} else if (context.state.whatWasTyped.toLowerCase() === process.env.GET_PERFILDATA && process.env.ENV !== 'prod2') {
				console.log('Deletamos o quiz?', await prepAPI.deleteQuizAnswer(context.session.user.id));
				await context.setState({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
				await context.setState({ stoppedHalfway: false, voucher: '', registrationForm: '' });
				await context.setState({ startedQuiz: false, is_eligible_for_research: 0, is_target_audience: 0 });
				await context.setState({ is_target_audience: false, is_prep: false, categoryQuestion: '' });
				console.log('Recipient atual', await prepAPI.getRecipientPrep(context.session.user.id));
				console.log(`Imprimindo os dados do perfil: \n${JSON.stringify(context.state.politicianData, undefined, 2)}`);
				await context.setState({ is_eligible_for_research: null, is_part_of_research: null, finished_quiz: null });
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
			case 'stopHalfway':
			// await context.setState({ stoppedHalfway: true });
				await mainMenu.sendMain(context);
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
			case 'sendFollowUp':
				await mainMenu.sendFollowUp(context);
				// falls throught
			case 'mainMenu':
				await mainMenu.sendMain(context);
				break;
			case 'desafioRecusado':
				await desafio.desafioRecusado(context);
				break;
			case 'beginQuiz':
				await context.setState({ startedQuiz: true });
				await context.sendText(flow.quiz.beginQuiz);
				// falls throught
			case 'startQuizA': // this is the quiz-type of questionario
				await quiz.answerQuizA(context);
				break;
			case 'aceitaTermos2': // aceita termos mas não é da pesquisa
			case 'aceitaTermos': // aceita termos e é da pesquisa
				await context.setState({ preCadastro: await prepAPI.postSignature(context.session.user.id, 1) }); // stores user accepting termos
				await context.setState({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
				if (context.state.registrationForm) { // is_eligible_for_research && is_target_audience
					await context.setState({ categoryConsulta: 'recrutamento' }); // on end quiz
					await context.setState({ sendExtraMessages: true }); // used only to show a few different messages on consulta
					await consulta.checarConsulta(context);
				} else {
					await mainMenu.sendMain(context);
				}
				break;
			case 'naoAceitaTermos': // regular flow
				await context.setState({ preCadastro: await prepAPI.postSignature(context.session.user.id, 0) }); // stores user not accepting termos
				await context.setState({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
				await context.sendText(flow.onTheResearch.naoAceitaTermos);
				if (context.state.registrationForm) { // is_eligible_for_research && is_target_audience
					await context.setState({ categoryConsulta: 'recrutamento' }); // on end quiz
					await context.setState({ sendExtraMessages: true }); // used only to show a few different messages on consulta
					await consulta.checarConsulta(context);
				} else {
					await mainMenu.sendMain(context);
				}
				break;
			case 'joinToken':
				await context.sendText(flow.joinToken.text1, opt.joinToken);
				break;
			case 'seeToken':
				await context.sendText(`${flow.joinToken.view} ${context.state.user.integration_token}`);
				await mainMenu.sendMain(context);
				break;
			case 'leavePhone':
				await context.sendText(flow.leavePhone.opening, opt.leavePhone);
				break;
			case 'leavePhoneTwo':
				await context.sendText(flow.leavePhone.phone);
				// await context.sendText(flow.leavePhone.text1, opt.leavePhone2);
				break;
			case 'leaveInsta':
				await context.sendText(flow.leavePhone.insta);
				break;
			case 'leaveInstaValid':
				await context.sendText(flow.leavePhone.success);
				await sendMail('Novo instagram de contato', await help.buildMail(context.session.user.name, context.state.insta, 'instagram'), context.state.user.city);
				await mainMenu.sendMain(context);
				break;
			case 'phoneValid':
				await context.sendText(flow.leavePhone.success);
				await sendMail('Novo telefone de contato', await help.buildMail(context.session.user.name, context.state.phone, 'telefone'), context.state.user.city);
				await mainMenu.sendMain(context);
				break;
			case 'phoneInvalid':
				await context.sendText(flow.leavePhone.failure);
				// await context.sendText(flow.leavePhone.failure, opt.leavePhone2);
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
			case 'checarConsulta':
				await context.setState({ categoryConsulta: 'emergencial' });
				await consulta.checarConsulta(context);
				break;
			case 'getCity':
			case 'showDays':
				await context.setState({ categoryConsulta: 'recrutamento' }); // on end quiz
				await consulta.loadCalendar(context);
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
				await context.sendText(await help.buildPhoneMsg(context.state.user.city, flow.consulta.outrasDatas, help.emergenciaDictionary), opt.outrasDatas);
				break;
			case 'outrosHorarios':
				await context.sendText(await help.buildPhoneMsg(context.state.user.city, flow.consulta.outrosHorarios, help.emergenciaDictionary), opt.outrasDatas);
				break;
			case 'listaDatas':
				await context.setState({ paginationDate: 1, paginationHour: 1 });
				await consulta.showDays(context);
				break;
			case 'askResearch':
				await context.sendText(flow.desafio.text2, opt.answer.sendResearch); // send research
				break;
			case 'firstNoResearch':
				await context.sendButtonTemplate(flow.onTheResearch.buildTermos, opt.TCLE);
				await context.sendText(flow.onTheResearch.saidYes, opt.termos2);
				break;
			case 'firstJoinResearch': // voce gostaria de saber mais sobre o nosso projeto  - sim
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
				await mainMenu.sendMain(context);
				// await desafio.followUp(context);
				break;
			case 'retryTriagem':
				await context.sendText(flow.triagem.retryTriagem, opt.triagem2);
				break;
			case 'autoTeste':
				await context.setState({ cidade: context.state.user.city }); // getting location id
				await context.sendText(flow.autoTeste.start, await checkQR.autoTesteOption(opt.autoteste, context.state.cidade));
				break;
			case 'auto':
				if (flow.autoTeste.auto3[context.state.cidade]) {
					await context.sendText(flow.autoTeste.auto1);
					await context.sendText(flow.autoTeste.auto2);
					await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.auto3[context.state.cidade],
						await checkQR.autoTesteOption(opt.autotesteEnd, context.state.cidade));
				} else {
					await context.sendText(flow.autoTeste.auto1);
					await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.auto2,
						await checkQR.autoTesteOption(opt.autotesteEnd, context.state.cidade));
				}
				break;
			case 'ong':
				await context.sendText(flow.autoTeste.ong1);
				await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.ong2[context.state.cidade],
					await checkQR.autoTesteOption(opt.ong, context.state.cidade));
				break;
			case 'rua':
				await context.sendText(flow.autoTeste.rua1);
				await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.rua2[context.state.cidade],
					await checkQR.autoTesteOption(opt.rua, context.state.cidade));
				break;
			case 'servico':
				await help.checkSuggestWaitForTest(context, flow.triagem.suggestWaitAutoTest, flow.autoTeste.servico1,
					await checkQR.autoTesteOption(opt.servico, context.state.cidade));
				break;
			case 'sendToTriagem':
			case 'triagem': // this is the triagem-type of questionario
				await triagem.getTriagem(context);
				break;
			case 'aboutAmanda':
				await context.sendImage(flow.aboutAmanda.gif);
				await context.sendText(flow.aboutAmanda.msgOne);
				await context.sendText(flow.aboutAmanda.msgTwo);
				await mainMenu.sendMain(context);
				// await desafio.followUp(context);
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
