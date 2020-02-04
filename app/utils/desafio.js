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
const { sentryError } = require('./error');

async function offerQuiz(context, categoryQuestion) {
	if (categoryQuestion) await context.setState({ categoryQuestion });
	if (context.state.startedQuiz === true) { // check if user started quiz
		await context.sendText(flow.desafio.started, opt.answer.sendQuiz); // send quiz when user has started the quiz already
	} else {
		await context.sendText(flow.desafio.willStart, opt.answer.sendQuiz); // send quiz when user hasn't even started the quiz
	}
}

async function sendFollowUp(context, type, categoryQuestion) {
	await context.setState({ currentCounter: await prepApi.getCount(context.session.user.id, type), currentCounterType: type }); // load counter
	if (process.env.ENV === 'local') await context.sendText(`Type: ${type} - ${JSON.stringify(context.state.currentCounter)}`);
	if (context.state.currentCounter && context.state.currentCounter.count_quiz >= 3) { // check counter
		await sendMain(context); // send regular menu
	} else {
		await prepApi.postCount(context.session.user.id, type); // update counter

		// type: each type of counter we have, each has a followup
		switch (type) {
		case 'publico-interesse':
		case 'quiz-brincadeira':
		case 'recrutamento':
			await offerQuiz(context, categoryQuestion);
			break;
		case 'share':
			await research.TCLE(context);
			break;
		case 'research-invite':
			await research.ofertaPesquisaStart(context, flow.ofertaPesquisaStart.offer);
			break;
		default:
			await sentryError('Tipo de contador/followup desconhecido!', { type, categoryQuestion, currentCounter: context.state.currentCounter });
			await sendMain(context);
			break;
		}
	}
}

async function followUp(context) {
	if (context.state.goBackToQuiz === true) { await offerQuiz(context); return false; } // if user was on quiz, ask user to go back, categoryQuestion should already be known by then

	if (context.state.user.is_target_audience === null) { await sendFollowUp(context, 'publico-interesse', 'publico_interesse'); return false; } // if we dont have is_target_audience, ask to send user to publico_interesse

	if (context.state.user.is_target_audience === 0) {
		if (!context.state.quizBrincadeiraEnd) { await sendFollowUp(context, 'quiz-brincadeira', 'quiz_brincadeira'); return false; } // if user didnt finish brincadeira, ask to send user to publico_interesse
		if (!context.state.preCadastroSignature) { await sendFollowUp(context, 'share'); return false; } 	// if user didnt finish signed terms, ask to send user to sign them
	}

	if (context.state.user.is_target_audience === 1) {
		await context.setState({ temConsulta: await checkAppointment(context) });
		if (!context.state.temConsulta && !context.state.leftContact) { await sendFollowUp(context, 'research-invite'); return false; }
		if (!context.state.recrutamentoEnd) { await sendFollowUp(context, 'recrutamento', 'recrutamento'); return false; }
		if (!context.state.preCadastroSignature) { await sendFollowUp(context, 'share'); return false; } 	// if user didnt finish signed terms, ask to send user to sign them
	}

	return sendMain(context);
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
				await sendFollowUp(context, quizTodo);
			} else if (context.state.user.is_eligible_for_research === 1) {
				if (context.state.intentType === 'problema') { await context.sendText(await help.buildPhoneMsg(context.state.user.city, flow.triagem.whatsapp, help.emergenciaDictionary)); }
				// await sendResearch(context);
			} else {
				await sendCarouselSus(context, opt.sus, flow.sus.text1);
				await context.typing(1000 * 5);
				await sendMain(context);
			}
		}
	} else { // not part of target audience
		const quizTodo = await quiz.checkFinishQuiz(context);
		if (quizTodo) { // there's one quiz to do
			await sendFollowUp(context, quizTodo);
		} else {
			await sendMain(context); // send regular menu
		}
	}
}

async function asksDesafio(context) {
	if (context.state.askDesafio === true) {
		await sendMain(context);
	} else {
		await context.setState({ askDesafio: true }); // dont show this message again
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
	sendFollowUp,
	sendConsulta,
	offerQuiz,
	checkAconselhamento,
};
