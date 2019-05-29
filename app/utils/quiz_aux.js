
const research = require('./research');
const { capQR } = require('./helper');
const opt = require('./options');
const flow = require('./flow');
// const { checarConsulta } = require('./consulta');


// builds quick_repliy menu from the question answer options
module.exports.buildMultipleChoice = async (question, complement) => {
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
};

module.exports.sendTermos = async (context) => {
	await context.setState({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' }); // clean up the category, so that next time the user can answer the quiz properly
	if (context.state.user.is_eligible_for_research === 1) {
		await context.sendText(flow.onTheResearch.text1);
		await context.sendImage(flow.onTheResearch.gif);
	}
	await context.sendText(flow.onTheResearch.text2);
	await context.sendText(flow.onTheResearch.text3);
	// quer saber mais sobre o nosso projeto
	await context.sendText(flow.onTheResearch.extra, opt.saberMais);
};


module.exports.endQuiz = async (context) => { // -- not used
	await context.setState({ categoryQuestion: '' }); // clean up the category, so that next time the user can answer the quiz properly
	if (context.state.user.is_target_audience === 0) { // parte do publico alvo
		await research.notPart(context); // não é parte do público alvo
	} else if (context.state.user.is_eligible_for_research === 1) { // elegível pra pesquisa
		await research.onTheResearch(context); // send AC5
	} else {
		await research.notEligible(context); // não elegível pra pesquisa
	}
};
