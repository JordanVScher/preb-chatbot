const flow = require('./flow');

const shareLink = process.env.SHARE_LINK;

async function sendFollowUp(context) {
	await context.sendText('Olha o timer aí');
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


// timeOut timers
// 24 hours -> send follow-up -> 1000 * 60 * 60 * 24
const followUpTimer = eval(process.env.FOLLOW_UP_TIMER); // eslint-disable-line

// timers -> object that stores timers. Each user_id stores it's respective timer.
const FollowUps = {};
// FollowUps -> stores timers for the regular follow-up message

module.exports.createFollowUpTimer = async (userID, context) => {
	// console.log('userID', userID);
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	FollowUps[userID] = setTimeout(async () => { // wait 'MenuTimerlimit' to show options menu
		await sendFollowUp(context);
		delete FollowUps[userID]; // deleting this timer from timers object
	}, followUpTimer);
};
