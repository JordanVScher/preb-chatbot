/* eslint camelcase: 0 */ // --> OFF
/* eslint no-param-reassign: 0 */ // --> OFF
const request = require('requisition');
const { handleRequestAnswer } = require('./error');
const { sentryError } = require('./error');

const apiUri = process.env.PREP_API_URL;
const security_token = process.env.SECURITY_TOKEN_PREP;
const security_token2 = process.env.SECURITY_TOKEN_PREP2;


module.exports = {
	async postRecipientPrep(fb_id, page_id, name) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, page_id, name }));
	},

	async putRecipientPrep(fb_id, recipient) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, ...recipient }));
	},

	async putUpdatePartOfResearch(fb_id, is_part_of_research) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, is_part_of_research }));
	},

	async putUpdateVoucherFlag(fb_id, voucher_type) { // voucher_type may be: sus, sisprep or combina
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, voucher_type }));
	},

	async putUpdateReminderBefore(fb_id, { string }) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`)
			.query({ fb_id, prep_reminder_before: 1, prep_reminder_before_interval: string }));
	},

	async putUpdateReminderAfter(fb_id, { string }) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`)
			.query({ fb_id, prep_reminder_after: 1, prep_reminder_after_interval: string }));
	},

	async putUpdateAlarme(fb_id, data, frascos) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`)
			.query({
				fb_id, prep_reminder_running_out: 1, prep_reminder_running_out_date: data, prep_reminder_running_out_count: frascos,
			}));
	},

	async putUpdateNotificacao24(fb_id, { string: combina_reminder_hour_exact }, { string: combina_reminder_hours_before }) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`)
			.query({ fb_id, combina_reminder_hour_exact, combina_reminder_hours_before }));
	},

	async putUpdateNotificacao22(fb_id, combina_reminder_22h, combina_reminder_double) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`)
			.query({ fb_id, combina_reminder_22h, combina_reminder_double }));
	},

	async postRecipientTookMedicine(fb_id, yes_prep = 1) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/prep-reminder-yes?security_token=${security_token}`).query({ fb_id, yes_prep }));
	},

	async postAutoTeste(fb_id, address, contact) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/test-request?security_token=${security_token}`).query({ fb_id, address, contact }));
	},

	async postTestPrep(fb_id, prep) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/internal/set-profile?security_token=${security_token}`)
			.query({ fb_id, profile: prep ? 'prep' : 'not-prep' }));
	},

	async postParticipar(fb_id, is_part_of_research) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/research-participation?security_token=${security_token}`).query({ fb_id, is_part_of_research }));
	},

	async getRecipientPrep(fb_id) {
		return handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id }));
	},

	// opt_in: 0 -> turn off notifications; 1 -> turn on notifications
	async putRecipientNotification(fb_id, opt_in) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, opt_in }));
	},

	async getPendinQuestion(fb_id, category) {
		return handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/recipient/pending-question?security_token=${security_token}`).query({ fb_id, category }));
	},

	async postQuizAnswer(fb_id, category, code, answer_value) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/answer?security_token=${security_token}`).query({
			fb_id, category, code, answer_value: await parseInt(answer_value, 10),
		}));
	},

	async deleteQuizAnswer(fb_id) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/internal/delete-answers?`)
			.query({ security_token: security_token2 || security_token, fb_id }));
	},

	async getValidVouchers() {
		return handleRequestAnswer(await request.get(`${apiUri}/api/internal/available-combina-vouchers`)
			.query({ security_token: security_token2 || security_token }));
	},

	async getAvailableCities() {
		return handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/appointment/available-calendars?security_token=${security_token}`));
	},

	async getAvailableDates(fb_id, calendar_id, page) {
		return handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/appointment/available-dates?security_token=${security_token}`).query({ fb_id, calendar_id, page }));
	},

	async postAppointment(fb_id, calendar_id, type, appointment_window_id, quota_number, datetime_start, datetime_end) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/appointment?security_token=${security_token}`).query({
			fb_id, calendar_id, type, appointment_window_id, quota_number, datetime_start, datetime_end,
		}));
	},

	async getAppointment(fb_id) {
		return handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/recipient/appointment?security_token=${security_token}`).query({ fb_id }));
	},

	async postIntegrationPrepToken(fb_id, integration_token) {
		const res = await handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/integration-token?security_token=${security_token}`).query({ fb_id, integration_token }));
		return !!(res.statusCode && res.statusCode.toString() === '200');
	},

	async putCombinaToken(fb_id, integration_token) {
		return handleRequestAnswer(await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`)
			.query({ fb_id, voucher_type: 'combina', integration_token }));
	},

	async getCount(fb_id, type) {
		try {
			const result = await handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/recipient/count-${type}?security_token=${security_token}`).query({ fb_id }));
			const keys = Object.keys(result);
			return result[keys[0]];
		} catch (error) {
			return sentryError('Erro ao pegar o contador', { error, fb_id, type });
		}
	},

	async postCount(fb_id, type) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/count-${type}?security_token=${security_token}`).query({ fb_id }));
	},

	async getCountResearch(fb_id) {
		return handleRequestAnswer(await request.get(`${apiUri}/api/chatbot/recipient/count-research-invite?security_token=${security_token}`).query({ fb_id }));
	},

	async postCountResearch(fb_id) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/count-research-invite?security_token=${security_token}`).query({ fb_id }));
	},

	async postSignature(fb_id, signed) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/term-signature?security_token=${security_token}`).query({ fb_id, signed }));
	},

	async resetTriagem(fb_id) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/reset-screening?security_token=${security_token}`).query({ fb_id }));
	},

	async postRecipientInteraction(fb_id) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/interaction?security_token=${security_token}`).query({ fb_id }));
	},

	async getRecipientInteraction(fb_id) {
		return handleRequestAnswer(await request(`${apiUri}/api/chatbot/recipient/interaction?security_token=${security_token}`).query({ fb_id }));
	},

	async postRecipientInteractionClose(fb_id, interaction_id) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/interaction/close?security_token=${security_token}`).query({ fb_id, interaction_id }));
	},

	async logFlowChange(recipient_fb_id, payload, button_text) {
		return handleRequestAnswer(await request.post(`${apiUri}/api/chatbot/recipient/quick-reply-log?security_token=${security_token}&`).query(
			{
				fb_id: recipient_fb_id,
				payload,
				button_text,
			},
		));
	},
};
