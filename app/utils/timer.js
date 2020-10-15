const { sendMain } = require('./mainMenu');
const { postRecipientMA } = require('../chatbot_api');
const { TCLE } = require('./research');

// timeOut timers
// 24 hours -> send follow-up -> 1000 * 60 * 60 * 24
// const followUpTimer = eval(process.env.FOLLOW_UP_TIMER); // eslint-disable-line

// timers -> object that stores timers. Each user_id stores it's respective timer.
const FollowUps = {};
// FollowUps -> stores timers for the regular follow-up message

async function createBaterPapoTimer(userID, context) {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	FollowUps[userID] = setTimeout(async () => { // wait 'MenuTimerlimit' to show options menu
		await sendMain(context);
		delete FollowUps[userID]; // deleting this timer from timers object
	}, 1000 * 20);
}

/*
	Timer Recrutamento:
	If user chooses "No" at recrutamento Quiz -> create timer
	If user is idle for 5 minutes on the mainMenu, send TCLE once
	recrutamentoTimer -> key that checks if we should still send the timer (true -> send timer)
	because we can't rely on the local state during a timeout, we also store this key on the recipient session on the Ma API
*/

const recrutamento = {};

async function createRecrutamentoTimer(userID, context) {
	if (recrutamento[userID]) { clearTimeout(recrutamento[userID]); delete recrutamento[userID]; }
	recrutamento[userID] = setTimeout(async () => {
		await postRecipientMA(context.state.politicianData.user_id, { fb_id: context.session.user.id, session: { recrutamentoTimer: false } }); // update key on the api
		if (!context.state.preCadastroSignature) await TCLE(context); // dont send recrutamento again if it was sent once
		delete recrutamento[userID]; // deleting this timer from timers object
	}, 1000 * 60 * 5);
}

async function deleteRecrutamento(userID) {
	if (recrutamento[userID]) { clearTimeout(recrutamento[userID]); delete recrutamento[userID]; }
}


const intentAnswerTimer = {};

async function deleteTimers(userID) {
	if (FollowUps[userID]) { clearTimeout(FollowUps[userID]); delete FollowUps[userID]; }
	if (intentAnswerTimer[userID]) { clearTimeout(intentAnswerTimer[userID]); delete intentAnswerTimer[userID]; }
	if (recrutamento[userID]) { clearTimeout(recrutamento[userID]); delete recrutamento[userID]; }
}


module.exports = {
	deleteTimers, createBaterPapoTimer, createRecrutamentoTimer, deleteRecrutamento,
};
