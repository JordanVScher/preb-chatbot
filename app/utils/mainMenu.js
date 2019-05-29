const checkQR = require('./checkQR');
const flow = require('./flow');
// const opt = require('./options');
// const prepApi = require('./prep_api');
const { answerQuizA } = require('./quiz');

async function backToQuiz(context) {
	await context.setState({ dialog: 'backToQuiz' });
	await context.sendText(flow.asksDesafio.backToQuiz);
	await answerQuizA(context);
}


async function sendMain(context, text) {
	if (context.state.goBackToQuiz === true) {
		await	backToQuiz(context);
	} else {
		let toSend = text;
		if (!toSend || toSend.length === 0) {
			toSend = flow.mainMenu.text1;
		}
		await context.sendText(toSend, await checkQR.checkMainMenu(context));
	}
}

const shareLink = process.env.SHARE_LINK; // eslint-disable-line
async function sendFollowUp(context) { // eslint-disable-line
	// await context.sendText(flow.followUp.preText);
	// await context.sendAttachment({
	// 	type: 'template',
	// 	payload: {
	// 		template_type: 'generic',
	// 		elements: [
	// 			{
	// 				title: flow.followUp.title,
	// 				subtitle: flow.followUp.subtitle,
	// 				image_url: flow.avatarImage,
	// 				item_url: shareLink,
	// 				buttons: [{ type: 'element_share' }],
	// 			},
	// 		],
	// 	},
	// });
}

async function sendShareAndMenu(context) {
	// await sendFollowUp(context);
	await sendMain(context);
}

module.exports.sendMain = sendMain;
module.exports.sendFollowUp = sendFollowUp;
module.exports.backToQuiz = backToQuiz;
module.exports.sendShareAndMenu = sendShareAndMenu;
