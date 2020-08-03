const req = require('requisition');
const { MessengerClient } = require('messaging-api-messenger');
const prepAPI = require('./prep_api');
const { sentryError } = require('./error');

const config = require('../../bottender.config.js').channels.messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

const pageToken = config.accessToken;
const labelApiVersion = '6.0';

const { locationDictionary } = require('./helper');


// creates a new label. Pass in the name of the label and add the return ID to the .env file
async function createNewLabel(name) {
	const res = await req.post(`https://graph.facebook.com/v${labelApiVersion}/me/custom_labels?access_token=${pageToken}`).query({ name });
	const response = await res.json();
	return response;
}

// get every label
async function listAllLabels(next) {
	let url = `https://graph.facebook.com/v${labelApiVersion}/me/custom_labels?fields=name&access_token=${pageToken}&limit=200`;
	if (next) url += `&next=${next}`;
	const res = await req.get(url);
	const response = await res.json();
	return response;
}

async function getUserLabels(PSID, next) {
	let url = `https://graph.facebook.com/v${labelApiVersion}/${PSID}/custom_labels?fields=name&access_token=${pageToken}`;
	if (next) url += `&next=${next}`;
	const res = await req.get(url);
	const response = await res.json();
	return response;
}

async function getBroadcastMetrics(broadcastID) {
	const res = await req.get(`https://graph.facebook.com/v${labelApiVersion}/${broadcastID}/insights/messages_sent?access_token=${pageToken}`);
	const response = await res.json();
	return response;
}

// TODO: fix associateLabelToPSID
async function associateLabelToPSID(PSID, labelID) {
	const res = await req.post(`https://graph.facebook.com/v${labelApiVersion}/${labelID}/label?access_token=${pageToken}`).send({ user: PSID });
	return res.json();
}

async function getAllLabels() {
	const result = [];
	let next = false;

	do {
		const aux = await listAllLabels(next);
		const { data } = aux;
		next = aux.paging.next;

		if (data) result.push(...data);
	} while (next);

	return result;
}

async function getAssociatedLabels(PSID) {
	const result = [];
	let next = false;

	do {
		const aux = await getUserLabels(PSID, next);
		const { data } = aux;

		if (aux && aux.paging && aux.paging.next) {
			next = aux.paging.next;
		} else {
			next = false;
		}

		if (data) result.push(...data);
	} while (next);

	return result;
}

async function dissociateLabelsFromUser(UserID) {
	const userLabels = await getAssociatedLabels(UserID);
	if (userLabels.data) {
		await userLabels.data.forEach(async (element) => {
			await client.dissociateLabel(UserID, element.id);
		});
		return true;
	}
	return false;
}

async function checkUserOnLabel(UserID, labelID) { // checks if user is on the label
	const userLabels = await getAssociatedLabels(UserID);
	const theOneLabel = await userLabels.find((x) => x.id === labelID.toString()); // find the one label with the name id

	// if we found the label on the user
	if (theOneLabel) return true;
	return false;
}

async function removeAllUserLabels(UserID) {
	const userLabels = await getAssociatedLabels(UserID);

	for (let i = 0; i < userLabels.data.length; i++) {
		const element = userLabels.data[i];
		await client.dissociateLabel(UserID, element.id);
	}
}

// Associates user to a label. Pass in the custom label id and the user psid
// associatesLabelToUser('123123', process.env.LABEL_ADMIN);
async function associatesLabelToUser(userID, labelID) {
	if (await checkUserOnLabel(userID, labelID)) return true;
	return associateLabelToPSID(userID, labelID);
}

// link an user to an agendaLabel
// each angendaLabel is 'agenda' + 'ID of the CCS' -> agenda1110
// All of the are going to be created and associated
async function linkUserToCustomLabel(UserID, labelName) {
	const ourLabels = await getAllLabels(); // get all labels we have
	const theOneLabel = await ourLabels.find((x) => x.name === labelName); // find the one label with the name same (we need the id)

	// if we already have that label, all we have to do is associate the user to the id
	if (theOneLabel) return associatesLabelToUser(UserID, theOneLabel.id);

	// theOneLabel doesnt exist so we have to create it
	const newLabel = await createNewLabel(labelName);
	if (!newLabel || newLabel.error || !newLabel.id) throw new Error(JSON.stringify(newLabel, null, 2));

	// no errors, so we can add the user to the label
	return associatesLabelToUser(UserID, newLabel.id);
}

async function addCityLabel(userID, cityId) {
	try {
		let labelToAdd = '';
		if (cityId < 4) {
			labelToAdd = locationDictionary[cityId];
		} else if (cityId === '4') {
			labelToAdd = 'Nenhum desses';
		}

		if (labelToAdd) {
			const res = await linkUserToCustomLabel(userID, labelToAdd);
			if (res && !res.error) return true;
		}

		return false;
	} catch (error) {
		return sentryError('Erro em addCityLabel', error);
	}
}

async function linkIntegrationTokenLabel(context) {
	try {
		// check if user has a integration_voucher but we haven't saved it yet (voucher) because we need to create a label first
		const token = context.state.user ? context.state.user.integration_token : null;
		if (token) {
			const res = await linkUserToCustomLabel(context.session.user.id, token);
			console.log('res do linkIntegrationTokenLabel', res);
			// if (!res || res.error) await sentryError('Erro ao criar label do token', { fb_id: context.session.user.id, token, error: res.error });
		}
	} catch (error) {
		sentryError('Erro em linkIntegrationTokenLabel', error);
	}
}

async function addNewUser(context) {
	try {
		if (context.state.onButtonQuiz || context.state.onTextQuiz) return false;
		await context.setState({ user: await prepAPI.getRecipientPrep(context.session.user.id) || {} });
		await linkIntegrationTokenLabel(context);
		if (context.state.user.form_error || context.state.user.error || !context.state.user || !context.state.user.id) { // check if there was an error or if user doesnt exist
			await prepAPI.postRecipientPrep(context.session.user.id, context.state.politicianData.user_id, context.state.sessionUser.name);
			await context.setState({ user: {} });
		} else {
			await context.setState({
				has_alarm: context.state.user.prep_reminder_after || context.state.user.prep_reminder_before || context.state.user.prep_reminder_running_out,
			});
		}

		return true;
	} catch (error) {
		return sentryError('Erro em addNewUser', error);
	}
}


module.exports = {
	linkUserToCustomLabel,
	associatesLabelToUser,
	checkUserOnLabel,
	dissociateLabelsFromUser,
	createNewLabel,
	getAllLabels,
	getBroadcastMetrics,
	addCityLabel,
	removeAllUserLabels,
	linkIntegrationTokenLabel,
	addNewUser,
	getUserLabels,
};
