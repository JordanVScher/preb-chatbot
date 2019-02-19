const MaAPI = require('./chatbot_api.js');
const { createIssue } = require('./send_issue');
const { sendAnswer } = require('./utils/sendAnswer');
const desafio = require('./utils/desafio');

async function checkPosition(context) {
	await context.setState({ dialog: 'checkPositionFunc' });
	switch (context.state.intentName) {
	case 'Greetings': // user said hi
		await context.setState({ dialog: 'greetings' });
		break;
	case 'Quiz': // user wants to answer the quiz
		await context.setState({ dialog: 'beginQuiz' });
		break;
	case 'Fallback': // didn't understand what was typed
		await createIssue(context);
		await desafio.followUpIntent(context);
		break;
	default: // default acts for every intent - position on MA
		await context.setState({
			knowledge: await MaAPI.getknowledgeBase(
				context.state.politicianData.user_id, context.state.apiaiResp, context.session.user.id,
			),
		}); // getting knowledge base.
		// console.log('knowledge', context.state.knowledge);
		// check if there's at least one answer in knowledge_base
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) {
			await sendAnswer(context);
		} else { // no answers in knowledge_base (We know the entity but admin doesn't have a position)
			await createIssue(context);
		}
		await desafio.followUpIntent(context);
		break;
	}
}

module.exports.checkPosition = checkPosition;
