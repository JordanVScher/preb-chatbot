const flow = require('./flow');
const opt = require('./options');
const prepApi = require('./prep_api');
const help = require('./helper');
const { sendMain } = require('./mainMenu');
const { sendCarouselSus } = require('./attach');
const { checkAppointment } = require('./consulta');
const research = require('./research');
const quiz = require('./quiz');
const triagem = require('./triagem');

async function sendQuiz(context, categoryQuestion) {
	await context.setState({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // load quiz counter
	await context.setState({ categoryQuestion }); // set the current categoryQuestion
	if (context.state.goBackToQuiz === true) { // check if user is on a quiz/triagem so that we can send them back there right away instead of asking
		await context.sendText(flow.desafio.text3);
		if (context.state.triagem || context.state.categoryQuestion === 'screening') { // triagem
			await context.setState({ dialog: 'goBackToTriagem', goBackToTriagem: false }); await triagem.getTriagem(context);
		} else {
			await context.setState({ dialog: 'backToQuiz', goBackToQuiz: false }); await quiz.answerQuiz(context);
		}
	} else if (context.state.quizCounter && context.state.quizCounter.count_quiz >= 3) { // check quiz counter
		await sendMain(context); // send regular menu
	} else {
		await prepApi.postCountQuiz(context.session.user.id); // update quiz counter
		if (context.state.startedQuiz === true) { // check if user started quiz
			await context.sendText(flow.desafio.text1, opt.answer.sendQuiz); // send quiz when user has started the quiz already
		} else {
			await context.sendText(flow.desafio.text3, opt.answer.sendQuiz); // send quiz when user hasn't even started the quiz
		}
	}
}

async function sendResearch(context) {
	await context.setState({ researchCounter: await prepApi.getCountResearch(context.session.user.id) }); // load quiz counter
	if (context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3) { // check quiz counter
		await sendMain(context); // send regular menu
	} else {
		await prepApi.postCountResearch(context.session.user.id); // update quiz counter
		// nunca deixou contato nem fez agendamento
		if (context.state.user.is_target_audience && (await checkAppointment(context) === false) && !context.state.leftContact) { // eslint-disable-line no-lonely-if
			await research.ofertaPesquisaStart(context, flow.ofertaPesquisaStart.offer);
		} else if (context.state.user.is_target_audience && !context.state.recrutamentoEnd) { // não acabou recrutamento
			await research.recrutamento(context);
		} else if (!context.state.preCadastroSignature) { // não assinou os termos
			await research.TCLE(context);
		} else {
			sendMain(context);
		}
	}
}

async function followUp(context) {
	if (context.state.user.is_target_audience) { // user on target_audience, offer research flows
		await sendResearch(context);
	} else if (!context.user.quizBrincadeiraEnd) { // user not on target_audience and didnt finish brincadeira, send back to quiz
		await context.setState({ categoryQuestion: 'quiz_brincadeira' });
		await sendQuiz(context);
	} else if (!context.state.preCadastroSignature) { // não assinou os termos
		await research.TCLE(context);
	} else {
		sendMain(context);
	}
}

async function sendConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
	if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) {
		await context.sendText(flow.triagem.consulta1);
		for (const iterator of context.state.consulta.appointments) { // eslint-disable-line
			const text = await help.buildConsultaFinal(context.state, iterator);
			if (text) await context.sendText(text);
		}
		await context.sendText(flow.triagem.cta);
		await sendMain(context); // send regular menu
	} else {
		await context.sendText(flow.triagem.consulta2, opt.answer.sendConsulta);
	}
}

async function checkAconselhamento(context) {
	// await context.setState({ user: { is_prep: 0 } }); // for testing
	await prepApi.resetTriagem(context.session.user.id); // clear old triagem
	if (context.state.intentType === 'duvida') {
		if (context.state.user.is_prep === 1) { // user is prep
			await sendMain(context); // send regular menu
		} else { // user isn't prep, send to triagem
			await context.sendText(flow.triagem.invite, opt.answer.isPrep);
		}
	} else { // problema e serviço
		if (context.state.user.is_prep === 1) { // eslint-disable-line no-lonely-if
			await sendConsulta(context); // is prep, === 1
		} else { // user isn't prep, goes to triagem
			await context.sendText(flow.triagem.send);
			await triagem.getTriagem(context);
		}
	}
}

async function followUpIntent(context) {
	await context.setState({ intentType: await help.separateIntent(context.state.intentName), dialog: 'prompt' });
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags

	if (context.state.user.is_target_audience === 1 || context.state.user.is_target_audience === null) { // check if user is part of target audience or we dont know yet
		if (context.state.user.is_part_of_research === 1) { // parte da pesquisa === 1, isso é configurado fora do bot
			await checkAconselhamento(context);
		} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se não acabou o quiz
			if (context.state.intentType === 'serviço') { await context.sendText(flow.triagem.posto); }
			const quizTodo = await quiz.checkFinishQuiz(context);
			if (quizTodo) { // there's one quiz to do
				await sendQuiz(context, quizTodo);
			} else if (context.state.user.is_eligible_for_research === 1) {
				if (context.state.intentType === 'problema') { await context.sendText(await help.buildPhoneMsg(context.state.user.city, flow.triagem.whatsapp, help.emergenciaDictionary)); }
				await sendResearch(context);
			} else {
				await sendCarouselSus(context, opt.sus, flow.sus.text1);
				await context.typing(1000 * 5);
				await sendMain(context);
			}
		}
	} else { // not part of target audience
		const quizTodo = await quiz.checkFinishQuiz(context);
		if (quizTodo) { // there's one quiz to do
			await sendQuiz(context, quizTodo);
		} else {
			await sendMain(context); // send regular menu
		}
	}
}

async function asksDesafio(context) {
	if (context.state.startedQuiz === true || await quiz.checkFinishQuiz(context) === false) { // user has answered the quiz already, he goes to the mainMenu
		await sendMain(context);
	} else {
		await context.sendText(flow.asksDesafio.intro, opt.asksDesafio);
	}
}

async function desafioRecusado(context) {
	await context.sendText(flow.desafioRecusado.text1);
	await sendMain(context);
}

async function desafioAceito(context) {
	await context.sendText(flow.desafioAceito.text1, opt.desafioAceito);
}

module.exports = {
	asksDesafio,
	desafioRecusado,
	desafioAceito,
	followUpIntent,
	followUp,
	sendQuiz,
	sendResearch,
	sendConsulta,
	checkAconselhamento,
};
