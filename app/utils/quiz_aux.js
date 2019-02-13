
const research = require('./research');
const { capQR } = require('./helper');

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

async function endQuizA(context, prepApi) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	if (context.state.user.is_target_audience === 0) { // parte do publico alvo
		await research.notPart(context); // não é parte do público alvo
	} else
	if (context.state.user.is_eligible_for_research === 1) { // elegível pra pesquisa
		if (context.state.user.is_part_of_research === 1) { // o que o usuário respondeu
			await research.researchSaidYes(context); // elegível, disse sim
		} else {
			await research.researchSaidNo(context); // elegível, disse não
		}
	} else {
		await research.notEligible(context); // não elegível pra pesquisa
	}
}

// builds quick_repliy menu from the question answer options
async function buildMultipleChoice(question) {
	const qrButtons = [];
	Object.keys(question.multiple_choices).forEach(async (element) => {
		qrButtons.push({ content_type: 'text', title: await capQR(question.multiple_choices[element]), payload: `quiz${element}` });
	});

	if (question.extra_quick_replies && question.extra_quick_replies.length > 0) {
		question.extra_quick_replies.forEach(async (element, index) => {
			qrButtons.push({ content_type: 'text', title: await capQR(element.label), payload: `extraQuestion${index}` });
		});
	}

	return { quick_replies: qrButtons };
}

async function handleAC5(context) {
	if (context.state.currentQuestion.code === 'AC5') {
		if (context.state.currentQuestion.is_eligible_for_research === 1) {
			await research.onTheResearch(context); // elegível e respondeu Sim
		} else if (context.state.currentQuestion.is_eligible_for_research === 0) {
			await research.notOnResearch(context); // elegível e respondeu Não
		}
	}
}


module.exports.handleFlags = handleFlags;
module.exports.endQuizA = endQuizA;
module.exports.buildMultipleChoice = buildMultipleChoice;
module.exports.handleAC5 = handleAC5;
