const MaAPI = require('./chatbot_api.js');
const { createIssue } = require('./send_issue');
// const dictionary = require('./utils/dictionary');

// function getDictionary(word) {
// 	const result = dictionary[word.toLowerCase()];
// 	if (result) {
// 		return result.toLowerCase();
// 	}
// 	return word.toLowerCase();
// }

// removes every empty intent object and returns the object
async function removeEmptyKeys(intentObj) {
	const obj = intentObj;
	Object.keys(obj).forEach((key) => {
		if (obj[key].length === 0) { delete obj[key]; }
		if (obj === 'Falso') { delete obj[key]; }
	});
	return obj;
}

async function getIntentID(context) {
	let oneIntent;
	const intents = await MaAPI.getAllAvailableIntents(context.event.rawEvent.recipient.id, context.state.paginationNumber);
	if (intents) { oneIntent = await intents.intents.find(x => x.name === context.state.intentName); }
	return oneIntent;
}

// getting the types we have on our KnowledgeBase
async function getOurTypes(KnowledgeBase) {
	const result = [];
	KnowledgeBase.forEach(async (element) => { result.push(element.type); });
	return result;
}
/*
	checkTypes: Getting the types we will show to the user.	TypesToCheck are the possible types we can have.
	The point of checking which type was in the question and we have it out base is to confirm using the correct type.
	We expect entities to be a string, so we add it at the beginning of the results array, after that we simply add the themes we have the answer for.
	If we couldn't detect any types on the question we default to 'posicionamento'.
*/
async function checkTypes(entitiesDF, knowdlege) {
	let entities = entitiesDF;
	// console.log('tipos de pergunta:', entities);

	const typesToCheck = ['posicionamento', 'proposta', 'histórico'];
	const result = [];
	// if (entities.constructor === Array) { // case entities is an array
	// // check if we have the type the user wants to know and add it to result
	// 	typesToCheck.forEach(((element) => {
	// 		if (entities.includes(element) && knowdlege.includes(element)) {
	// 			result.push(element);
	// 		}
	// 	}));
	// }

	if (await Array.isArray(entities) === true) { entities = entities[0]; }// eslint-disable-line

	if (entities && entities !== '') { // string exists and isn't empty, this is the type the user asked
		if (typesToCheck.includes(entities.toLowerCase() && knowdlege.includes(entities.toLowerCase()))) {
			result.push(entities.toLowerCase());
		}
	}
	// check if we have a correlated answer that the user didn't ask for
	typesToCheck.forEach(((element) => {
		if (knowdlege.includes(element) && !result.includes(element)) { result.push(element); }
	}));

	return result;
}

// preparets the text to be shown
// async function getTypeText(type) { // eslint-disable-line no-unused-vars
// 	if (type === 'proposta') {
// 		return 'minha proposta';
// 	} if (type === 'histórico') {
// 		return 'meu histórico';
// 	}
// 	return 'meu posicionamento';
// }

async function checkPosition(context) {
	await context.setState({ dialog: 'prompt' });

	switch (context.state.intentName) {
	case 'Teste':
		await context.sendText('Entendemos que é um teste');
		break;
	case 'Fallback': // didn't understand what was typed
		// if (await createIssue(context)) { await context.sendText(getRandom(opt.frases_fallback)); }
		// await sendMenu(context, await loadOptionPrompt(context), [opt.aboutPolitician, opt.poll_suaOpiniao, opt.participate, opt.availableIntents]);
		break;
	default: // default acts for every intent - position
		await context.setState({ // getting knowledge base. We send the complete answer from dialogflow
			knowledge: await MaAPI.getknowledgeBase(context.state.politicianData.user_id, context.state.apiaiResp),
		});

		await context.setState({ currentIntent: await getIntentID(context) });


		// console.log('knowledge', context.state.knowledge);

		// check if there's at least one answer in knowledge_base
		if (context.state.knowledge && context.state.knowledge.knowledge_base && context.state.knowledge.knowledge_base.length >= 1) {
			await context.setState({ entities: await removeEmptyKeys(context.state.resultParameters) }); // saving the entities that were detect by dialogflow
			// console.log('entities', context.state.entities);
			await context.setState({ typesWeHave: await getOurTypes(context.state.knowledge.knowledge_base) }); // storing the types we have on our knowledge_base
			// console.log('typesWeHave', context.state.typesWeHave);
			await context.setState({ types: await checkTypes(context.state.entities.Tipos_de_pergunta, context.state.typesWeHave) }); // getting common types
			// console.log('types', context.state.types);
			await context.setState({ firstTime: true });
			await context.sendText('Você está perguntando?');
			// await context.sendButtonTemplate('Você está perguntando sobre '// confirm themes with user
			// 		+ `${getDictionary(context.state.intentName)}?`, opt.themeConfirmation); // obs: the payload of the Yes/Sim option defaults to 'themeYes0'
		} else { // no answers in knowledge_base (We know the entity but politician doesn't have a position)
			await createIssue(context);
		}
		break;
	}
}

module.exports.checkPosition = checkPosition;
