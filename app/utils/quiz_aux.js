
const research = require('./research');
const { capQR } = require('./helper');
const opt = require('./options');
const flow = require('./flow');
const { sendMain } = require('./mainMenu');
// const { checarConsulta } = require('./consulta');

async function handleFlags(context, response) {
	if (response.is_eligible_for_research && response.is_eligible_for_research === 1) { // user is eligible for research -> sees "do you want to participate" question
		await context.setState({ is_eligible_for_research: true });
	} else if (response.is_eligible_for_research === 0) {
		await context.setState({ is_eligible_for_research: false });
	}

	if (response.is_part_of_research && response.is_part_of_research === 1) { // chooses to participate in the research
		await context.setState({ is_part_of_research: true });
	} else if (response.is_part_of_research === 0) {
		await context.setState({ is_part_of_research: false });
	}
	if (response.is_target_audience && response.is_target_audience === 1) { // is part of the target audience
		await context.setState({ is_target_audience: true });
	} else if (response.is_target_audience === 0) {
		await context.setState({ is_target_audience: false });
	}
}

async function endTriagem(context) {
	await context.setState({ dialog: 'endTriagem' });
	const result = context.state.sentAnswer;
	if (result && result.emergency_rerouting === 1) { // quando responder Há menos de 72H para a primeira pergunta da triagem
		await context.sendText(flow.triagem.emergency1);
		await context.sendText(flow.triagem.emergency2);
		await sendMain(context);
	} else if (result && result.go_to_autotest === 1) { // "A mais de 6 meses" + todos não
		await context.setState({ dialog: 'autoTeste' });
		// await context.sendText(flow.autoTeste.start, opt.autoteste);
	} else if (result && result.go_to_appointment === 1) { // quando responder sim para a SC6 -> talvez a prep seja uma boa pra vc. bora marcar?
		// await context.setState({ categoryConsulta: 'emergencial' });
		// await checarConsulta(context);
		await context.setState({ dialog: 'checarConsulta' });
	} else if (result && result.suggest_appointment === 1) { // qualquer sim
		await context.sendText(flow.triagem.suggest, opt.triagem1);
	} else { // quando responder não para a SC6
		await sendMain(context);
	}
}

// builds quick_repliy menu from the question answer options
async function buildMultipleChoice(question, complement) {
	// complement -> quiz or triagem to put on the button payload for each type of quiz
	const qrButtons = [];
	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `${complement}${element}` });
	});

	if (question.extra_quick_replies && question.extra_quick_replies.length > 0) {
		question.extra_quick_replies.forEach(async (element, index) => {
			qrButtons.push({ content_type: 'text', title: await capQR(element.label), payload: `extraQuestion${index}` });
		});
	}

	return { quick_replies: qrButtons };
}

async function sendTermos(context) {
	await context.setState({ dialog: 'seeTermos' });
	await context.sendButtonTemplate(flow.quizYes.text15, opt.TCLE);
	await context.sendText(flow.onTheResearch.saidYes, context, opt.termos);
	// await context.sendText(flow.onTheResearch.saidYes, await checkQR.checkConsulta(context, opt.saidYes));
}

async function endQuiz(context, prepApi) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	if (context.state.user.is_target_audience === 0) { // parte do publico alvo
		await research.notPart(context); // não é parte do público alvo
	} else if (context.state.user.is_eligible_for_research === 1) { // elegível pra pesquisa
		await research.onTheResearch(context); // send AC5
	} else {
		await research.notEligible(context); // não elegível pra pesquisa
	}
}

module.exports.handleFlags = handleFlags;
module.exports.buildMultipleChoice = buildMultipleChoice;
module.exports.endTriagem = endTriagem;
module.exports.sendTermos = sendTermos;
module.exports.endQuiz = endQuiz;
