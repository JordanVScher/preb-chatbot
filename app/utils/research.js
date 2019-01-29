const flow = require('./flow');

async function onTheResearch(context) {
	await context.setState({ dialog: 'onTheResearch' });
	await context.sendText(flow.onTheResearch.text1);
	await context.sendImage(flow.onTheResearch.gif);
	await context.sendText(flow.onTheResearch.text2);
}

async function notOnResearch(context) {
	await context.setState({ dialog: 'NotOnResearch' });
	await context.sendText(flow.NotOnResearch.text1);
}

async function notEligible(context) {
	await context.setState({ dialog: 'NotEligible' });
	await context.sendText(flow.notEligible.text1);
}

module.exports.onTheResearch = onTheResearch;
module.exports.notOnResearch = notOnResearch;
module.exports.notEligible = notEligible;
