const dialogflow = require('dialogflow');
const MaAPI = require('./chatbot_api.js');
const { createIssue } = require('./send_issue');
const { sendAnswer } = require('./utils/sendAnswer');
const desafio = require('./utils/desafio');
const { getRecipientPrep } = require('./utils/prep_api');
const flow = require('./utils/flow');
const help = require('./utils/helper');

/* Initialize DialogFlow agent */
/* set GOOGLE_APPLICATION_CREDENTIALS on .env */
const sessionClient = new dialogflow.SessionsClient();
const projectId = process.env.GOOGLE_PROJECT_ID;

/**
 * Send a text query to the dialogflow agent, and return the query result.
 * @param {string} text The text to be queried
 * @param {string} sessionId A unique identifier for the given session
 */
async function textRequestDF(text, sessionId) {
	const sessionPath = sessionClient.sessionPath(projectId, sessionId);
	const request = { session: sessionPath, queryInput: { text: { text, languageCode: 'pt-BR' } } };
	const responses = await sessionClient.detectIntent(request);
	return responses;
}

/**
 * Build object with the entity name and it's values from the dialogflow response
 * @param {string} res result from dialogflow request
 */
async function getEntity(res) {
	const result = {};
	const entities = res[0] && res[0].queryResult && res[0].queryResult.parameters ? res[0].queryResult.parameters.fields : [];
	if (entities) {
		Object.keys(entities).forEach((e) => {
			const aux = [];
			if (entities[e] && entities[e].listValue && entities[e].listValue.values) {
				entities[e].listValue.values.forEach((name) => { aux.push(name.stringValue); });
			}
			result[e] = aux;
		});
	}

	return result || {};
}

async function getExistingRes(res) {
	let result = null;
	res.forEach((e) => { if (e !== null && result === null) result = e; });
	return result;
}

async function saveIntentLog(pageID, politicianID, userID, intentName) {
	let intent = null;
	const iName = intentName ? intentName.toLowerCase() : intentName;
	const pageIntents = await MaAPI.getAllAvailableIntents(pageID);
	if (pageIntents && pageIntents.length > 0) intent = pageIntents.find((x) => x.name === iName || x.human_name === iName);
	if (intent && intent.id) console.log(await MaAPI.setIntentStatus(politicianID, userID, intent.id, 1));
}

async function checkPosition(context) {
	await saveIntentLog(context.event.rawEvent.recipient.id, context.state.politicianData.user_id, context.session.user.id, context.state.intentName);
	await context.setState({ goBackToQuiz: !!((context.state.onButtonQuiz || context.state.onTextQuiz)) });

	await context.setState({ dialog: 'checkPositionFunc' });
	await context.setState({ user: await getRecipientPrep(context.session.user.id) });

	console.log('intentName', context.state.intentName);
	switch (context.state.intentName) {
	// case 'Greetings': // user said hi
	// 	await context.setState({ dialog: 'greetings' });
	// 	break;
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
			await context.setState({ dialog: 'seePrepToken' });
		} else {
			await context.setState({ dialog: 'joinToken' });
		}
		break;
	case 'Default Fallback Intent':
	case 'Fallback': // didn't understand what was typed
		await createIssue(context);
		await desafio.followUp(context);
		break;
	default: // default acts for every intent - position on MA
		await context.setState({ knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, await getExistingRes(context.state.apiaiResp), context.session.user.id) }); // eslint-disable-line
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) {
			await sendAnswer(context);
			if (process.env.ENV !== 'local') await context.typing(1000 * 30);
			await desafio.followUp(context);
		} else { // no answers in knowledge_base (We know the entity but admin doesn't have a position)
			await createIssue(context);
			await desafio.followUp(context);
		}
		break;
	}
}

async function dialogFlow(context) {
	console.log(`\n${context.state.name} digitou ${context.event.message.text} - DF Status: ${context.state.politicianData.use_dialogflow}`);
	if (context.state.politicianData.use_dialogflow === 1) { // check if 'politician' is using dialogFlow
		await context.setState({ apiaiResp: await textRequestDF(await help.formatDialogFlow(context.state.whatWasTyped), context.session.user.id) });
		await context.setState({ intentName: context.state.apiaiResp[0].queryResult.intent.displayName || '' }); // intent name
		await context.setState({ resultParameters: await getEntity(context.state.apiaiResp) }); // entities
		await context.setState({ apiaiTextAnswer: context.state.apiaiResp[0].queryResult.fulfillmentText || '' }); // response text
		await checkPosition(context);
	} else {
		await context.setState({ dialog: 'mainMenu' });
		await createIssue(context);
	}
}

module.exports = { checkPosition, dialogFlow };
