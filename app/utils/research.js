const flow = require('./flow');

async function onTheResearch(context) {
	await context.setState({ dialog: 'onTheResearch' });
	await context.sendText(flow.onTheResearch.text1);
	await context.sendImage(flow.onTheResearch.gif);
	await context.sendText(flow.onTheResearch.text2);
	await context.sendText('ou seja, elegível pra pesquisa e respondeu Sim');
}

async function notOnResearch(context) {
	await context.setState({ dialog: 'NotOnResearch' });
	await context.sendText(flow.NotOnResearch.text1);
	await context.sendText('ou seja, elegível pra pesquisa mas respondeu não');
}

async function notEligible(context) {
	await context.setState({ dialog: 'NotEligible' });
	await context.sendText('Você acabou o quiz. Você não faz parte da pesquisa. Desculpe.');
	await context.sendText('ou seja, não é elegível pra pesquisa');
}


module.exports.onTheResearch = onTheResearch;
module.exports.notOnResearch = notOnResearch;
module.exports.notEligible = notEligible;
