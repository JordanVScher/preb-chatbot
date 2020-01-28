const { capQR } = require('./helper');
const opt = require('./options');
const flow = require('./flow');

module.exports.sendFollowUp = async (context) => {
	if (context.state.sentAnswer.followup_messages) {
		for (let i = 0; i < context.state.sentAnswer.followup_messages.length; i++) {
			if (context.state.sentAnswer.followup_messages[i].includes('.png')) {
				await context.setState({ resultImageUrl: context.state.sentAnswer.followup_messages[i] });
			} else {
				await context.sendText(context.state.sentAnswer.followup_messages[i]);
				if (i === 1 && context.state.currentQuestion.code === 'AC7') {
					if (context.state.resultImageUrl && context.state.resultImageUrl.length > 0) {
						await context.sendImage(context.state.resultImageUrl); // send fun_questions result
						await context.setState({ resultImageUrl: '' });
					}
				}
			}
		}
	}
};

module.exports.sendTermos = async (context) => {
	await context.setState({ dialog: 'seeTermos', stoppedHalfway: false, categoryQuestion: '' }); // clean up the category, so that next time the user can answer the quiz properly
	if (context.state.user.is_eligible_for_research === 1) {
		console.log('This shouldnt ever happen!');
		await context.setState({ dialog: 'mainMenu' });
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
