const checkQR = require('./checkQR');
const flow = require('./flow');
const opt = require('./options');

async function sendMain(context, text) {
	let toSend = text;
	if (!toSend || toSend.length === 0) {
		toSend = flow.mainMenu.text1;
	}
	await context.setState({ dialog: 'mainMenu' });
	await context.sendText(toSend, await checkQR.checkMainMenu(context, opt.mainMenu));
}

module.exports.sendMain = sendMain;
