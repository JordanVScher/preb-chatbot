const { capQR } = require('./helper');
const opt = require('./options');
const flow = require('./flow');

module.exports.sendTermos = async (context) => {
	await context.setState({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' }); // clean up the category, so that next time the user can answer the quiz properly
	if (context.state.user.is_eligible_for_research === 1) {
		console.log('This shouldnt ever happen!');
		await context.setState({ dialog: 'mainMenu' });
		// await context.sendText(flow.onTheResearch.text1);
		// await context.sendImage(flow.onTheResearch.gif);
		// await context.sendText(flow.onTheResearch.text2);
		// await context.sendText(flow.onTheResearch.text3);
		// // quer saber mais sobre o nosso projeto
		// await context.sendText(flow.onTheResearch.extra, opt.saberMais);
	} else {
		await context.sendText(flow.onTheResearch.text2);
		await context.sendText(flow.quizYes.text15);
		await context.sendButtonTemplate(flow.onTheResearch.buildTermos, opt.TCLE);
		await context.sendText(flow.onTheResearch.saidYes, opt.termos2);
	}
};

// builds quick_reply menu from the question answer options
module.exports.buildMultipleChoice = async (question, complement) => {
	// complement -> quiz or triagem to put on the button payload for each type of quiz
	const qrButtons = [];
	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `${complement}${element}${question.code}` });
	});

	if (question.extra_quick_replies && question.extra_quick_replies.length > 0) {
		question.extra_quick_replies.forEach(async (element, index) => {
			qrButtons.push({ content_type: 'text', title: await capQR(element.label), payload: `extraQuestion${index}` });
		});
	}
	return { quick_replies: qrButtons };
};
