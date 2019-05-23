/* eslint camelcase: 0 */ // --> OFF
/* eslint no-param-reassign: 0 */ // --> OFF
const request = require('requisition');
// const queryString = require('query-string');

const apiUri = process.env.PREP_API_URL;
const security_token = process.env.SECURITY_TOKEN_PREP;
const security_token2 = process.env.SECURITY_TOKEN_PREP2;

module.exports = {
	async postRecipientPrep(fb_id, page_id, name) {
		const res = await request.post(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, page_id, name });
		// console.log('postRecipientPrep', res);
		const recipientData = await res.json();

		return recipientData;
	},

	async putRecipientPrep(fb_id, name) {
		const res = await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, name });
		// console.log('putRecipientPrep', res);
		const recipientData = await res.json();

		return recipientData;
	},

	async putUpdatePartOfResearch(fb_id, is_part_of_research) {
		const res = await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id, is_part_of_research });
		const recipientData = await res.json();
		// console.log('putUpdatePartOfResearch', recipientData);
		return recipientData;
	},

	async postParticipar(fb_id, is_part_of_research) {
		const res = await request.post(`${apiUri}/api/chatbot/recipient/research-participation?security_token=${security_token}&`).query({
			fb_id, is_part_of_research,
		});
		const postParticipar = await res.json();
		console.log('postParticipar', postParticipar);
		return postParticipar;
	},

	async getRecipientPrep(fb_id) {
		const res = await request.get(`${apiUri}/api/chatbot/recipient?security_token=${security_token}`).query({ fb_id });
		// console.log('getRecipientPrep', res);
		const recipientData = await res.json();
		return recipientData;
	},

	async putRecipientNotification(fb_id, opt_in) {
		// opt_in: 0 -> turn off notifications; 1 -> turn on notifications
		const res = await request.put(`${apiUri}/api/chatbot/recipient?security_token=${security_token}&`).query({ fb_id, opt_in });
		// console.log('putRecipientNotification', res);
		const recipientData = await res.json();
		return recipientData;
	},

	async getPendinQuestion(fb_id, category) {
		const res = await request.get(`${apiUri}/api/chatbot/recipient/pending-question?security_token=${security_token}&`).query({ fb_id, category });
		// console.log('getPendinQuestion', res);
		const quizData = await res.json();

		return quizData;
	},

	async postQuizAnswer(fb_id, category, code, answer_value) {
		console.log('postQuizAnswer', `${fb_id} - ${category} - ${code} - ${answer_value}`);

		let quizData;
		try {
			const res = await request.post(`${apiUri}/api/chatbot/recipient/answer?security_token=${security_token}&`).query({
				fb_id, category, code, answer_value,
			});
			quizData = await res.json();
		} catch (error) {
			quizData = { error: `error: ${error}` };
		}
		// console.log(quizData);
		return quizData;
	},

	async deleteQuizAnswer(fb_id) {
		let token = '';
		if (security_token2 && security_token2.length > 0) {
			token = security_token2;
		} else {
			token = security_token;
		}

		const res = await request.post(`${apiUri}/api/internal/delete-answers?`).query({ security_token: token, fb_id });
		// console.log('deleteQuizAnswer', res);
		const quizData = await res.json();

		return quizData;
	},

	async getAvailableCities() {
		const res = await request.get(`${apiUri}/api/chatbot/appointment/available-calendars?security_token=${security_token}`);
		// console.log('getAvailableCities', res);
		const cities = await res.json();

		return cities;
	},

	async getAvailableDates(fb_id, calendar_id, page) {
		const res = await request.get(`${apiUri}/api/chatbot/appointment/available-dates?security_token=${security_token}&`).query({ fb_id, calendar_id, page });
		// console.log('getAvailableDates', res);
		const dates = await res.json();
		return dates;
	},

	async postAppointment(fb_id, calendar_id, type, appointment_window_id, quota_number, datetime_start, datetime_end) {
		const res = await request.post(`${apiUri}/api/chatbot/recipient/appointment?security_token=${security_token}&`).query({
			fb_id, calendar_id, type, appointment_window_id, quota_number, datetime_start, datetime_end,
		});
		// console.log('postAppointment', res);
		const dates = await res.json();

		return dates;
	},

	async getAppointment(fb_id) {
		const res = await request.get(`${apiUri}/api/chatbot/recipient/appointment?security_token=${security_token}&`).query({ fb_id });
		// console.log('getAppointment', res);
		const dates = await res.json();
		return dates;
	},

	async postIntegrationToken(fb_id, integration_token) {
		const res = await request.post(`${apiUri}/api/chatbot/recipient/integration-token?security_token=${security_token}&`).query({ fb_id, integration_token });
		// console.log('postIntegrationToken', res);
		const result = await res.json();

		return result;
	},

	async getCountQuiz(fb_id) {
		const res = await request.get(`${apiUri}/api/chatbot/recipient/count-quiz?security_token=${security_token}&`).query({ fb_id });
		// console.log('getCountQuiz', res);
		const count = await res.json();

		return count;
	},

	async postCountQuiz(fb_id) {
		const res = await request.post(`${apiUri}/api/chatbot/recipient/count-quiz?security_token=${security_token}&`).query({ fb_id });
		// console.log('postCountQuiz', res);
		const count = await res.json();

		return count;
	},

	async getCountResearch(fb_id) {
		const res = await request.get(`${apiUri}/api/chatbot/recipient/count-research-invite?security_token=${security_token}&`).query({ fb_id });
		// console.log('getCountResearch', res);
		const count = await res.json();
		return count;
	},

	async postCountResearch(fb_id) {
		const res = await request.post(`${apiUri}/api/chatbot/recipient/count-research-invite?security_token=${security_token}&`).query({ fb_id });
		// console.log('postCountResearch', res);
		const count = await res.json();
		return count;
	},

	async postSignature(fb_id, url) {
		console.log(fb_id, url);
		try {
			const res = await request.post(`${apiUri}/api/chatbot/recipient/term-signature?security_token=${security_token}&`).query({ fb_id, url });
			const sign = await res.json();
			return sign;
		} catch (error) {
			console.log('postSignature', error);
			return error;
		}
	},

	async resetTriagem(fb_id) {
		const res = await request.post(`${apiUri}/api/chatbot/recipient/reset-screening?security_token=${security_token}&`).query({ fb_id });
		const sign = await res.json();
		// console.log('postSignature', sign);
		return sign;
	},
};
