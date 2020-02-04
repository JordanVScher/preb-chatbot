const { capQR } = require('./helper');

module.exports.checkFinishQuiz = async (context) => {
	if (!context.state.publicoInteresseEnd) return 'publico_interesse';
	if (context.state.triagem) return 'screening';
	if (context.state.user.is_target_audience && !context.state.recrutamentoEnd) return 'recrutamento';
	if (!context.state.user.is_target_audience && !context.state.quizBrincadeiraEnd) return 'brincadeira';

	return null;
};


module.exports.sendFollowUpMsgs = async (context) => {
	if (context.state.sentAnswer.followup_messages) {
		for (let i = 0; i < context.state.sentAnswer.followup_messages.length; i++) {
			if (context.state.sentAnswer.followup_messages[i].includes('.png')) {
				await context.setState({ resultImageUrl: context.state.sentAnswer.followup_messages[i] });
			} else {
				await context.sendText(context.state.sentAnswer.followup_messages[i]);
				if (context.state.resultImageUrl && context.state.resultImageUrl.length > 0) {
					await context.sendImage(context.state.resultImageUrl); // send fun_questions result
					await context.setState({ resultImageUrl: '' });
				}
			}
		}
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
