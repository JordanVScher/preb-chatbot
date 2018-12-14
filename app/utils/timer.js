
// timeOut timers
// 24 hours -> send follow-up -> 1000 * 60 * 60 * 24
const followUpTimer = eval(process.env.FOLLOW_UP_TIMER); // eslint-disable-line

// timers -> object that stores timers. Each user_id stores it's respective timer.
const FollowUps = {};
// FollowUps -> stores timers for the regular follow-up message

module.exports.createFollowUpTimer = async (userID, context) => {
	console.log('userID', userID);

	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	FollowUps[userID] = setTimeout(async () => { // wait 'MenuTimerlimit' to show options menu
		await context.sendText('Olha o timer aí');
		delete FollowUps[userID]; // deleting this timer from timers object
	}, followUpTimer);
};
