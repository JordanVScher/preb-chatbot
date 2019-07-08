const flow = require('./flow');
const opt = require('./options');
const prepApi = require('./prep_api');
const mainMenu = require('./mainMenu');
const help = require('./helper');
const { sendCarouselSus } = require('./timer');
const { answerQuizA } = require('./quiz');
const { getTriagem } = require('./triagem');

async function sendQuiz(context) {
	await context.setState({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // load quiz counter
	await context.setState({ categoryQuestion: 'quiz' });
	if (context.state.goBackToQuiz === true) { // check if user is on a quiz/ triagem so that we can send them back there right away instead of asking
		await context.setState({ dialog: 'backToQuiz', goBackToQuiz: false });
		await context.sendText(`${flow.desafio.text3}`);
		await answerQuizA(context);
	} else if (context.state.goBackToTriagem === true) {
		await context.setState({ dialog: 'goBackToTriagem', goBackToTriagem: false });
		await context.sendText(`${flow.desafio.text3}`);
		await getTriagem(context);
	} else if (context.state.quizCounter && context.state.quizCounter.count_quiz >= 3) { // check quiz counter
		await mainMenu.sendShareAndMenu(context); // send regular menu
	} else {
		await prepApi.postCountQuiz(context.session.user.id); // update quiz counter
		if (context.state.startedQuiz === true) { // check if user started quiz
			if (context.state.stoppedHalfway === true) {
				await context.sendText(flow.desafio.text4, opt.answer.sendQuiz);
			} else {
				await context.sendText(flow.desafio.text1, opt.answer.sendQuiz); // send quiz when user has started the quiz already
			}
		} else {
			await context.sendText(flow.desafio.text3, opt.answer.sendQuiz); // send quiz when user hasn't even started the quiz
		}
	}
}

async function sendResearch(context) {
	await context.setState({ researchCounter: await prepApi.getCountResearch(context.session.user.id) }); // load quiz counter
	if (context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3) { // check quiz counter
		await mainMenu.sendShareAndMenu(context); // send regular menu
	} else {
		await prepApi.postCountResearch(context.session.user.id); // update quiz counter
		await context.sendText(flow.desafio.text4, opt.answer.sendResearch); // send research
	}
}

async function followUp(context) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags
	await context.setState({ dialog: 'prompt' });

	if (context.state.user.is_target_audience === 1 || context.state.user.is_target_audience === null) { // check if user is part of target audience or we dont know yet
		if (context.state.user.is_part_of_research === 1) { // parte da pesquisa
			await mainMenu.sendShareAndMenu(context); // send regular menu, here we don't have to check if user is prep or not
		} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se não acabou o quiz
			if (context.state.user.finished_quiz === 0) { // eslint-disable-line no-lonely-if
				await sendQuiz(context);
			} else if (context.state.user.is_eligible_for_research === 1 && context.state.user.finished_quiz === 1) { // elegível mas não parte da pesquisa (disse não)
				await sendResearch(context);
			} else if (context.state.user.is_eligible_for_research === 0 && context.state.user.finished_quiz === 1) { // não é elegível
				await sendCarouselSus(context, opt.sus);
			// await mainMenu.sendShareAndMenu(context); // send regular menu
			}
		}
	} else { // not part of target audience
		if (context.state.categoryQuestion) { // eslint-disable-line no-lonely-if
			await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
			if (!context.state.currentQuestion || context.state.currentQuestion.code === null || context.state.currentQuestion.form_error) {
				await mainMenu.sendShareAndMenu(context); // send regular menu
			} else {
				await sendQuiz(context); // if user didn't finish quiz we can send it to them, even if they aren't on target_audience
			}
		} else {
			await sendQuiz(context); // if user didn't finish quiz we can send it to them, even if they aren't on target_audience
		}
	}
}

async function sendConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		await context.sendText(flow.triagem.consulta1);
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			await context.sendText(''
				+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
				+ `\n⏰: ${help.formatDate(iterator.datetime_start)}`
				+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
		}
		await context.sendText(flow.triagem.cta);
		await mainMenu.sendMain(context); // send regular menu
	} else {
		await context.sendText(flow.triagem.consulta2, opt.answer.sendConsulta);
	}
}

async function checkAconselhamento(context) {
	// await context.setState({ user: { is_prep: 0 } }); // for testing
	await prepApi.resetTriagem(context.session.user.id); // clear old triagem
	if (context.state.intentType === 'duvida') {
		if (context.state.user.is_prep === 1) { // user is prep
			await mainMenu.sendShareAndMenu(context); // send regular menu
		} else { // user isn't prep, send to triagem
			await context.sendText(flow.triagem.invite, opt.answer.isPrep);
		}
	} else { // problema e serviço
		if (context.state.user.is_prep === 1) { // eslint-disable-line no-lonely-if
			await sendConsulta(context); // is prep, === 1
		} else { // user isn't prep, goes to triagem
			await context.sendText(flow.triagem.send);
			await context.setState({ dialog: 'triagem' });
		}
	}
}

async function followUpIntent(context) {
	await context.setState({ intentType: await help.separateIntent(context.state.intentName), dialog: 'prompt' });
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags

	console.log('intentType', context.state.intentType);
	// console.log('user', context.state.user);

	if (context.state.user.is_target_audience === 1 || context.state.user.is_target_audience === null) { // check if user is part of target audience or we dont know yet
		if (context.state.user.is_part_of_research === 1) { // parte da pesquisa === 1
			await checkAconselhamento(context);
		} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se não acabou o quiz
			if (context.state.intentType === 'serviço') { await context.sendText(flow.triagem.posto); }
			if (context.state.user.finished_quiz === 0) { // eslint-disable-line no-lonely-if === 0
				await sendQuiz(context);
			} else if (context.state.user.is_eligible_for_research === 1 && context.state.user.finished_quiz === 1) { // elegível mas não parte da pesquisa (disse não) === 1
				if (context.state.intentType === 'problema') { await context.sendText(await help.buildPhoneMsg(context.state.user.city, flow.triagem.whatsapp, help.emergenciaDictionary)); }
				await sendResearch(context);
			} else if (context.state.user.is_eligible_for_research === 0 && context.state.user.finished_quiz === 1) { // não é elegível === 0
				await sendCarouselSus(context, opt.sus);
				// await mainMenu.sendShareAndMenu(context); // send regular menu
			}
		}
	} else { // not part of target audience
		// if (context.state.intentType === 'problema') { // eslint-disable-line
		// 	await sendCarouselSus(context, opt.sus);
		// } else {
		// check if theres a category, if there isnt, the user probably finished the quiz and currentQuestion will receive a form_error
		if (context.state.categoryQuestion) { // eslint-disable-line no-lonely-if
			await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
			if (!context.state.currentQuestion || context.state.currentQuestion.code === null || context.state.currentQuestion.form_error) {
				await mainMenu.sendShareAndMenu(context); // send regular menu
			} else {
				await sendQuiz(context); // if user didn't finish quiz we can send it to them, even if they aren't on target_audience
			}
		} else {
			await sendQuiz(context); // if user didn't finish quiz we can send it to them, even if they aren't on target_audience
		}
	}
	// }
}

async function asksDesafio(context) {
	if (context.state.startedQuiz === true || context.state.user.finished_quiz === 1) { // user has answered the quiz already, he goes to the mainMenu
		await mainMenu.sendMain(context);
	} else {
		await context.sendText(flow.asksDesafio.text1, opt.asksDesafio);
		// await context.sendText(flow.asksDesafio.text2, opt.asksDesafio);
	}
}

async function desafioRecusado(context) {
	await context.sendText(flow.desafioRecusado.text1);
	await mainMenu.sendMain(context);
}

async function desafioAceito(context) {
	await context.sendText(flow.desafioAceito.text1, opt.desafioAceito);
}

module.exports.asksDesafio = asksDesafio;
module.exports.desafioRecusado = desafioRecusado;
module.exports.desafioAceito = desafioAceito;
module.exports.followUp = followUp;
module.exports.followUpIntent = followUpIntent;
module.exports.sendQuiz = sendQuiz;
module.exports.sendResearch = sendResearch;
module.exports.sendConsulta = sendConsulta;
module.exports.checkAconselhamento = checkAconselhamento;
