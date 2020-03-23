const { capQR } = require('./helper');
const { accents } = require('./helper');

async function checkFinishQuiz(context) {
	if (!context.state.publicoInteresseEnd) return 'publico_interesse';
	if (context.state.triagem) return 'triagem';
	if (context.state.user.is_target_audience && !context.state.recrutamentoEnd) return 'recrutamento';
	if (!context.state.user.is_target_audience && !context.state.quizBrincadeiraEnd) return 'brincadeira';

	return null;
}


async function sendFollowUpMsgs(context) {
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
}

async function getButtonTextList(qr) {
	const res = [];
	const list = qr && qr.quick_replies ? qr.quick_replies : [];
	for (let i = 0; i < list.length; i++) {
		const e = list[i];
		if (e.title) {
			let aux = e.title.toLowerCase();
			aux = await accents.remove(aux);
			res.push(aux);
		}
	}
	return res;
}

// builds quick_reply menu from the question answer options
async function buildMultipleChoice(question, complement) {
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
}

// show question code locally for dev purposes
const buildQuizText = (text, code, env) => (env !== 'local' ? text : `${code}. ${text}`);

async function sendQuizQuestion(context, btnPrefix) {
	await context.setState({ quizText: await buildQuizText(context.state.currentQuestion.text, context.state.currentQuestion.code, process.env.ENV) });

	if (context.state.currentQuestion.type === 'multiple_choice') {
		await context.setState({ onButtonQuiz: true });
		await context.setState({ buttonsFull: await buildMultipleChoice(context.state.currentQuestion, btnPrefix) });
		await context.setState({ buttonTexts: await getButtonTextList(context.state.buttonsFull) });
		await context.sendText(context.state.quizText, context.state.buttonsFull);
	} else if (context.state.currentQuestion.type === 'open_text') {
		await context.setState({ onTextQuiz: true });
		await context.sendText(context.state.quizText);
	}

	return context.state.quizText;
}

module.exports = {
	checkFinishQuiz,
	sendFollowUpMsgs,
	buildMultipleChoice,
	sendQuizQuestion,
	getButtonTextList,
	buildQuizText,
};
