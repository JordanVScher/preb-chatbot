const checkQR = require('./checkQR');
const flow = require('./flow');
const opt = require('./options');

async function sendMain(context) {
	await context.setState({ dialog: 'mainMenu' });
	await context.sendText(flow.mainMenu.text2, await checkQR.checkMainMenu(context, opt.mainMenu));
}

module.exports.sendMain = sendMain;
