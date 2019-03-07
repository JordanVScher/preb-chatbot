const MaAPI = require('./chatbot_api.js');
const { createIssue } = require('./send_issue');
const { sendAnswer } = require('./utils/sendAnswer');
const desafio = require('./utils/desafio');
const { getRecipientPrep } = require('./utils/prep_api');
const { sendMain } = require('./utils/mainMenu');
const flow = require('./utils/flow');

async function checkPosition(context) {
	await context.setState({ dialog: 'checkPositionFunc' });
	await context.setState({ user: await getRecipientPrep(context.session.user.id) });


	switch (context.state.intentName) {
	case 'Greetings': // user said hi
		await context.setState({ dialog: 'greetings' });
		break;
	case 'Quiz': // user wants to answer the quiz
		if (context.state.user.finished_quiz === 1) {
			await context.sendText(flow.quiz.done);
			await context.setState({ dialog: 'mainMenu' });
		} else {
			await context.setState({ dialog: 'beginQuiz' });
		}
		break;
	case 'Sobre Amanda':
		await context.setState({ dialog: 'aboutAmanda' });
		break;
	case 'Inserir Token':
		if (context.state.user.integration_token && context.state.user.is_part_of_research === 1) {
			await context.setState({ dialog: 'seeToken' });
		} else {
			await context.setState({ dialog: 'joinToken' });
		}
		break;
	// case 'Marcar Consulta':
	// case 'Abuso':
	// case 'Teste':
	// 	await desafio.followUpIntent(context);
	// 	break;
	case 'Fallback': // didn't understand what was typed
		await createIssue(context);
		await desafio.followUpIntent(context);
		break;
	default: // default acts for every intent - position on MA
		await context.setState({ knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp, context.session.user.id) });
		// console.log('knowledge', context.state.knowledge);
		// check if there's at least one answer in knowledge_base
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) {
			await sendAnswer(context);
			await desafio.followUpIntent(context);
		} else { // no answers in knowledge_base (We know the entity but admin doesn't have a position)
			await createIssue(context);
			await sendMain(context);
		}
		break;
	}
}

module.exports.checkPosition = checkPosition;
