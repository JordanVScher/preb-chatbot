
const research = require('./research');
const { capQR } = require('./helper');
const opt = require('./options');
const flow = require('./flow');
const { sendMain } = require('./mainMenu');
const help = require('./helper');
// const { checarConsulta } = require('./consulta');


async function endTriagem(context) {
	await context.setState({ dialog: 'endTriagem' });
	console.log('result', context.state.sentAnswer);

	if (context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1) {
		console.log('entrei aqui');

		await context.setState({ suggestWaitForTest: true });
	} else {
		console.log('passei nessa');

		await context.setState({ suggestWaitForTest: false });
	}

	if (context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1) { // quando responder Há menos de 72H para a primeira pergunta da triagem
		await context.sendText(flow.triagem.emergency1);
		await context.sendText('Telefones pra contato:'
			+ `\nSão Paulo - SP: ${help.telefoneDictionary[1]}`
			+ `\nBelo Horizonte - MG: ${help.telefoneDictionary[2]}`
			+ `\nSalvador - BA: ${help.telefoneDictionary[3]}`, opt.outrasDatas);
		await sendMain(context);
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1) { // "A mais de 6 meses" + todos não
		await context.setState({ dialog: 'autoTeste' });
		// await context.sendText(flow.autoTeste.start, opt.autoteste);
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1) { // quando responder sim para a SC6 -> talvez a prep seja uma boa pra vc. bora marcar?
		// await context.setState({ categoryConsulta: 'emergencial' });
		// await checarConsulta(context);
		await context.setState({ dialog: 'checarConsulta' });
	} else if (context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1) { // qualquer sim
		await context.sendText(flow.triagem.suggest, opt.triagem1);
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_test === 0) { // quando responder não para a SC6
		await context.sendText(flow.triagem.noTest);
		await sendMain(context);
	} else {
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
	if (context.state.user.is_eligible_for_research === 1) {
		await context.sendText(flow.onTheResearch.text1);
		await context.sendImage(flow.onTheResearch.gif);
	}

	await context.setState({ dialog: 'seeTermos' });
	await context.sendText(flow.quizYes.text15);
	await context.sendButtonTemplate(await help.buildTermosMessage(), opt.TCLE);
	await context.sendText(flow.onTheResearch.saidYes, opt.termos);
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

module.exports.buildMultipleChoice = buildMultipleChoice;
module.exports.endTriagem = endTriagem;
module.exports.sendTermos = sendTermos;
module.exports.endQuiz = endQuiz;
