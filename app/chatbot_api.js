/* eslint camelcase: 0 */ // --> OFF
/* eslint no-param-reassign: 0 */ // --> OFF
const request = require('requisition');
const queryString = require('query-string');
const { handleRequestAnswer } = require('./utils/error');

const apiUri = process.env.MANDATOABERTO_API_URL;
const security_token = process.env.SECURITY_TOKEN_MA;

module.exports = {
	async getPoliticianData(pageId) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/politician?fb_page_id=${pageId}&security_token=${security_token}`));
	},

	async getPollData(pageId) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/poll?fb_page_id=${pageId}&security_token=${security_token}`));
	},

	async postRecipientMA(user_id, recipient) {
		if (!recipient.extra_fields) delete recipient.extra_fields;
		if (recipient.extra_fields) recipient.extra_fields = JSON.stringify(recipient.extra_fields);
		const recipientData_qs = queryString.stringify(recipient);
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient?${recipientData_qs}&security_token=${security_token}&`).query({ politician_id: user_id }));
	},

	async postPollAnswer(fb_id, poll_question_option_id, origin) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/poll-result?fb_id=${fb_id}&poll_question_option_id=${poll_question_option_id}&origin=${origin}&security_token=${security_token}`));
	},

	async getPollAnswer(fb_id, poll_id) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/poll-result?fb_id=${fb_id}&poll_id=${poll_id}&security_token=${security_token}`));
	},

	async getRecipient(politician_id, fb_id) {
		return handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/recipient?fb_id=${fb_id}&security_token=${security_token}&`).query({ politician_id }));
	},

	async postRecipientLabel(politician_id, fb_id, label) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient?security_token=${security_token}&}`).query({
			politician_id, security_token, fb_id, extra_fields: JSON.stringify({ system_labels: [{ name: label }] }),
		}));
	},

	async deleteRecipientLabel(politician_id, fb_id, label) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient?security_token=${security_token}&}`).query({
			politician_id, security_token, fb_id, extra_fields: JSON.stringify({ system_labels: [{ name: label, deleted: 1 }] }),
		}));
	},

	async getDialog(politician_id, dialog_name) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/dialog?politician_id=${politician_id}&dialog_name=${dialog_name}&security_token=${security_token}`));
	},

	async getAnswer(politician_id, question_name) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/answer?politician_id=${politician_id}&question_name=${question_name}&security_token=${security_token}`));
	},

	async postIssue(politician_id, fb_id, message, entities, issue_active) {
		if (issue_active === 1 || issue_active === true) {
			message = encodeURI(message);
			entities = JSON.stringify(entities);
			return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/issue?politician_id=${politician_id}&fb_id=${fb_id}&message=${message}&entities=${entities}&security_token=${security_token}`));
		}

		return false;
	},

	async postIssueWithoutEntities(politician_id, fb_id, message, issue_active) {
		if (issue_active === 1 || issue_active === true) {
			message = encodeURI(message);
			return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/issue?politician_id=${politician_id}&fb_id=${fb_id}&message=${message}&security_token=${security_token}`));
		}

		return false;
	},

	async getknowledgeBase(politician_id, entities, fb_id) {
		entities = JSON.stringify(entities);
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/knowledge-base?politician_id=${politician_id}&entities=${entities}&fb_id=${fb_id}&security_token=${security_token}`));
	},

	async getknowledgeBaseByName(politician_id, entities) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/knowledge-base?politician_id=${politician_id}&entities=${entities}&security_token=${security_token}`));
	},

	async postPrivateReply(item, page_id, post_id, comment_id, permalink, user_id) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/private-reply?page_id=${page_id}&item=${item}&post_id=${post_id}&comment_id=${comment_id}&permalink=${permalink}&user_id=${user_id}&security_token=${security_token}`));
	},

	async updateBlacklistMA(fb_id, active) { // 0 -> turn off notification && 1 -> turn on notification
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/blacklist?fb_id=${fb_id}&active=${active}&security_token=${security_token}`));
	},

	async getAvailableIntents(pageId, page) { // has pagination
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/intents/available?fb_page_id=${pageId}&page=${page}&security_token=${security_token}`));
	},

	async getAllAvailableIntents(pageId) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/intents/available?fb_page_id=${pageId}&security_token=${security_token}`));
	},

	async logFlowChange(recipient_fb_id, politician_id, payload, human_name) {
		const d = new Date();
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query(
			{
				timestamp: d.toGMTString(),
				recipient_fb_id,
				politician_id,
				action_id: 1,
				payload,
				human_name,
			},
		));
	},

	async logAnsweredPoll(recipient_fb_id, politician_id, field_id) {
		const d = new Date();
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query(
			{
				timestamp: d.toGMTString(),
				recipient_fb_id,
				politician_id,
				action_id: 2,
				field_id,
			},
		));
	},

	async logAskedEntity(recipient_fb_id, politician_id, field_id) {
		const d = new Date();
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query(
			{
				timestamp: d.toGMTString(),
				recipient_fb_id,
				politician_id,
				action_id: 5,
				field_id,
			},
		));
	},

	async logNotification(recipient_fb_id, politician_id, action_id) {
		// action_id should be 3 for ACTIVATED_NOTIFICATIONS and 4 for DEACTIVATED_NOTIFICATIONS
		const d = new Date();
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/log?security_token=${security_token}&`).query({
			timestamp: d.toGMTString(),
			recipient_fb_id,
			politician_id,
			action_id,
		}));
	},

	// // console.log(await MaAPI.getLogAction()); // print possible log actions
	async getLogAction() {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/log/actions?security_token=${security_token}`));
	},

	async setIntentStatus(politician_id, recipient_fb_id, intentID, entity_is_correct) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/politician/${politician_id}/intents/${intentID}/stats?entity_is_correct=${entity_is_correct}&recipient_fb_id=${recipient_fb_id}&security_token=${security_token}`));
	},
};
