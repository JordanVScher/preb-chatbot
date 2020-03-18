const flow = require('./flow');
const { getQR } = require('./attach');
const { sendMain } = require('./mainMenu');
const prepApi = require('./prep_api');
const quizAux = require('./quiz_aux');
const help = require('./helper');

async function prepFollowUp(context) {
	if (context.state.user.voucher_type === 'sus') {
		let text = flow.duvidasPrep.textosSUS[context.state.user.city];
		if (!text) text = flow.duvidasPrep.demaisLocalidades;
		if (text) await context.sendText(flow.duvidasPrep.prefixSUS + text);
		await sendMain(context);
	} else {
		await context.setState({ nextDialog: '' });
		await context.sendText(flow.duvidasPrep.notSUS, await getQR(flow.ofertaPesquisaSim));
	}
}

async function deuRuimPrepFollowUp(context, extraMsg) {
	if (extraMsg && typeof extraMsg === 'string') await context.sendText(extraMsg);
	if (context.state.user.voucher_type === 'sus') {
		await context.sendText(flow.deuRuimPrep.followUpSUS);
		await sendMain(context);
	} else {
		await context.setState({ nextDialog: '' });
		await context.sendText(flow.deuRuimPrep.notSUS, await getQR(flow.ofertaPesquisaSim));
	}
}

async function alarmeOK(context) {
	if (context.state.user.voucher_type !== 'combina') {
		await context.sendText(flow.alarmePrep.comoTomando.text1, await getQR(flow.alarmePrep.comoTomando));
	} else if (context.state.user.voucher_type === 'sisprep') {
		await context.sendText(flow.alarmePrep.comoAjudo.text1, await getQR(flow.alarmePrep.comoAjudo));
	}
}

async function deuRuimQuiz(context) {
	await context.setState({ categoryQuestion: 'deu_ruim_nao_tomei' });
	await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });

	const quizText = process.env.ENV === 'prod' ? context.state.currentQuestion.text : `${context.state.currentQuestion.code}. ${context.state.currentQuestion.text}`;
	if (context.state.currentQuestion.type === 'multiple_choice') {
		await context.setState({ onButtonQuiz: true });
		await context.setState({ buttonsFull: await quizAux.buildMultipleChoice(context.state.currentQuestion, 'deuRuim') });
		await context.setState({ buttonTexts: await help.getButtonTextList(context.state.buttonsFull) });
		await context.sendText(quizText, context.state.buttonsFull);
	} else if (context.state.currentQuestion.type === 'open_text') {
		await context.setState({ onTextQuiz: true });
		await context.sendText(quizText);
	}
}

module.exports = {
	prepFollowUp, deuRuimPrepFollowUp, deuRuimQuiz, alarmeOK,
};
