
const research = require('./research');
const { capQR } = require('./helper');
const opt = require('./options');
const flow = require('./flow');
const { sendMain } = require('./mainMenu');
const help = require('./helper');
// const { checarConsulta } = require('./consulta');

module.exports.endTriagem = async (context) => {
	await context.setState({ dialog: 'endTriagem' });
	console.log('result endTriagem', context.state.sentAnswer);

	if (context.state.sentAnswer && context.state.sentAnswer.suggest_wait_for_test === 1) {
		await context.setState({ suggestWaitForTest: true });
	} else {
		await context.setState({ suggestWaitForTest: false });
	}

	if (context.state.sentAnswer && context.state.sentAnswer.emergency_rerouting === 1) { // quando responder Há menos de 72H para a primeira pergunta da triagem
		await context.sendText(flow.triagem.emergency1);
		await context.sendText(await help.buildPhoneMsg(context.state.user.city, 'Telefones pra contato:'));
		await sendMain(context);
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_test === 1) { // "A mais de 6 meses" + todos não
		await context.setState({ dialog: 'autoTeste' });
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_appointment === 1) { // quando responder sim para a SC6 -> talvez a prep seja uma boa pra vc. bora marcar?
		await context.setState({ dialog: 'checarConsulta' });
	} else if (context.state.sentAnswer && context.state.sentAnswer.suggest_appointment === 1) { // qualquer sim
		await context.sendText(flow.triagem.suggest, opt.triagem1);
	} else if (context.state.sentAnswer && context.state.sentAnswer.go_to_test === 0) { // quando responder não para a SC6
		await context.sendText(flow.triagem.noTest);
		await sendMain(context);
	} else {
		await sendMain(context);
	}
};

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

module.exports.buildMultipleChoice = buildMultipleChoice;

module.exports.sendTermos = async (context) => {
	await context.setState({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' }); // clean up the category, so that next time the user can answer the quiz properly
	if (context.state.user.is_eligible_for_research === 1) {
		await context.sendText(flow.onTheResearch.text1);
		await context.sendImage(flow.onTheResearch.gif);
	}
	await context.sendText(flow.quizYes.text15);
	await context.sendButtonTemplate(flow.onTheResearch.buildTermos, opt.TCLE);
	await context.sendText(flow.onTheResearch.saidYes, opt.termos);
};

module.exports.endQuiz = async (context) => {
	await context.setState({ categoryQuestion: '' }); // clean up the category, so that next time the user can answer the quiz properly
	if (context.state.user.is_target_audience === 0) { // parte do publico alvo
		await research.notPart(context); // não é parte do público alvo
	} else if (context.state.user.is_eligible_for_research === 1) { // elegível pra pesquisa
		await research.onTheResearch(context); // send AC5
	} else {
		await research.notEligible(context); // não elegível pra pesquisa
	}
};
