const prepApi = require('./prep_api');
const aux = require('./quiz_aux');
const flow = require('./flow');
const { addCityLabel } = require('./labels');
const help = require('./helper');
const { sentryError } = require('./error');

// loads next question and shows it to the user
async function answerQuiz(context, newCategory) {
	if (newCategory) await context.setState({ categoryQuestion: newCategory });

	if (!context.state.startedQuiz) await context.setState({ startedQuiz: true }); // if we passed here we started a new quiz
	// if the user never started the quiz the category is 'publico_interesse'
	if (!context.state.categoryQuestion || context.state.categoryQuestion === '') await context.setState({ categoryQuestion: 'publico_interesse' });

	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
	await aux.sendQuizQuestion(context, 'quiz');
}

async function handleQuizResposta(context) {
	const { categoryQuestion } = context.state;
	const { sentAnswer } = context.state;

	// saving city labels
	if (context.state.currentQuestion.code === 'A1') await addCityLabel(context.session.user.id, context.state.quizOpt);

	// add registration form link to send later
	if (sentAnswer.offline_pre_registration_form) await context.setState({ registrationForm: sentAnswer.offline_pre_registration_form });


	await aux.sendFollowUpMsgs(context);
	if (sentAnswer.finished_quiz === 1) await context.setState({ startedQuiz: false, categoryQuestion: '' });

	// from here on out, the flow of the quiz actually changes, so remember to return something to stop the rest from executing
	if (categoryQuestion === 'publico_interesse' && sentAnswer.finished_quiz === 1 && sentAnswer.is_target_audience === 0) {
		await context.setState({ dialog: 'offerBrincadeira', publicoInteresseEnd: true });
		return false;
	}

	if (categoryQuestion === 'publico_interesse' && sentAnswer.finished_quiz && sentAnswer.is_target_audience) {
		await context.setState({ dialog: 'ofertaPesquisaStart', publicoInteresseEnd: true, categoryQuestion: 'recrutamento' });
		await context.setState({ whenBecameTargetAudience: new Date() });
		return false;
	}

	if (categoryQuestion === 'quiz_brincadeira' && sentAnswer.finished_quiz === 1) {
		await context.setState({ dialog: 'preTCLE', quizBrincadeiraEnd: true });
		return false;
	}

	if (categoryQuestion === 'recrutamento' && sentAnswer.finished_quiz === 1) {
		await context.setState({ dialog: 'preTCLE', recrutamentoEnd: true });
		return false;
	}

	if (categoryQuestion === 'deu_ruim_nao_tomei' && sentAnswer.finished_quiz === 1) { // check if the quiz is over
		await context.setState({ dialog: 'deuRuimPrepFim' });
		return false;
	}

	if (categoryQuestion === 'triagem' && sentAnswer.finished_quiz === 1) {
		if (context.state.sentAnswer.entrar_em_contato === 1) {
			await context.setState({ dialog: 'triagemCQ_entrar' });
			return false;
		}

		if (context.state.sentAnswer.ir_para_agendamento === 1) {
			await context.setState({ dialog: 'falarComHumano' });
			return false;
		}

		if (context.state.sentAnswer.ir_para_menu === 1) {
			await context.setState({ dialog: 'mainMenu' });
			return false;
		}

		if (context.state.sentAnswer.ir_para_menu === 0) {
			await context.setState({ dialog: 'testagem' });
			return false;
		}
	}

	if (categoryQuestion === 'duvidas_nao_prep' && sentAnswer.finished_quiz === 1) {
		await context.setState({ dialog: 'falarComHumano' });
		return false;
	}

	if (context.state.sentAnswer.finished_quiz === 0) { // check if the quiz is over
		await context.setState({ dialog: 'startQuiz' });
		return false;
	}

	return true;
}

async function handleAnswer(context, quizOpt) {
	await context.setState({ onTextQuiz: false, onButtonQuiz: false, quizOpt });

	if (process.env.ENV === 'local') await context.sendText(JSON.stringify({ category: context.state.categoryQuestion, code: context.state.currentQuestion.code, answer_value: context.state.quizOpt }, null, 2));
	await context.setState({ sentAnswer: await prepApi.postQuizAnswer(context.session.user.id, context.state.categoryQuestion, context.state.currentQuestion.code, context.state.quizOpt) });
	if (process.env.ENV === 'local') await context.sendText(JSON.stringify(context.state.sentAnswer, null, 2));

	// error sending message to API, send user to same question and send error to the devs
	if (!context.state.sentAnswer || context.state.sentAnswer.error) {
		await context.sendText(flow.quiz.form_error);
		await context.setState({ dialog: 'startQuiz' });
		if (process.env.ENV !== 'local') await sentryError('PREP - Erro ao salvar resposta do Quiz', { sentAnswer: context.state.sentAnswer, quizOpt: context.state.quizOpt, state: context.state });
		return false;
	}
	// Invalid input format, make user try again on same question. // Date is: YYYY-MM-DD
	if (context.state.sentAnswer.form_error || (context.state.sentAnswer.form_error && context.state.sentAnswer.form_error.answer_value && context.state.sentAnswer.form_error.answer_value === 'invalid')) { // input format is wrong (text)
		await context.sendText(flow.quiz.invalid);
		await context.setState({ dialog: 'startQuiz' }); // re-asks same question
		return false;
	}

	return handleQuizResposta(context);
}


// extra questions -> explanation of obscure terms
// sends the answer to the question and sends user back to the question
async function AnswerExtraQuestion(context) {
	const index = context.state.lastQRpayload.replace('extraQuestion', '');
	const answer = context.state.currentQuestion.extra_quick_replies[index].text;
	await context.sendText(answer);
	await context.setState({ dialog: 'startQuiz' }); // re-asks same question
	return answer;
}

// allows user to type the text on a button to choose that option
async function handleText(context) {
	if (!context.state.whatWasTyped) return null;
	let text = context.state.whatWasTyped.toLowerCase();
	text = await help.accents.remove(text);
	let getIndex = null;
	context.state.buttonTexts.forEach((e, i) => {
		if (e.trim() === text.trim() && getIndex === null) { // user text has to be the same as the button text
		// if (e.includes(text) && getIndex === null) { // user text has to be belong to the button
			getIndex = i + 1;
		}
	});

	if (getIndex === null) return null;
	return getIndex;
}

module.exports = {
	answerQuiz,
	handleAnswer,
	AnswerExtraQuestion,
	handleText,
	checkFinishQuiz: aux.checkFinishQuiz,
	handleQuizResposta,
};
