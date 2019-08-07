const checkQR = require('./checkQR');
const flow = require('./flow');
// const opt = require('./options');
// const prepApi = require('./prep_api');
const { answerQuizA } = require('./quiz');
const { getTriagem } = require('./triagem');

async function sendMain(context, text) {
	if (context.state.goBackToQuiz === true) { // check if user is on a quiz/ triagem so that we can send them back there right away instead of asking
		await context.setState({ dialog: 'backToQuiz', goBackToQuiz: false });
		await context.sendText(`${flow.desafio.text3}`);
		await answerQuizA(context);
	} else if (context.state.goBackToTriagem === true) {
		await context.setState({ dialog: 'goBackToTriagem', goBackToTriagem: false });
		await context.sendText(`${flow.desafio.text3}`);
		await getTriagem(context);
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

module.exports = {
	sendMain,
	sendFollowUp,
	sendShareAndMenu,
};
