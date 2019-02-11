const checkQR = require('./checkQR');
const flow = require('./flow');
const opt = require('./options');
// const prepApi = require('./prep_api');

const shareLink = process.env.SHARE_LINK;

async function sendMain(context, text) {
	let toSend = text;
	if (!toSend || toSend.length === 0) {
		toSend = flow.mainMenu.text1;
	}
	await context.sendText(toSend, await checkQR.checkMainMenu(context, opt.mainMenu));
}

async function sendFollowUp(context) {
	await context.sendText(flow.followUp.preText);
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: flow.followUp.title,
					subtitle: flow.followUp.subtitle,
					image_url: flow.avatarImage,
					item_url: shareLink,
					buttons: [{ type: 'element_share' }],
				},
			],
		},
	});
}

async function sendShareAndMenu(context) {
	await sendFollowUp(context);
	await sendMain(context);
}

module.exports.sendMain = sendMain;
module.exports.sendFollowUp = sendFollowUp;
module.exports.sendShareAndMenu = sendShareAndMenu;
