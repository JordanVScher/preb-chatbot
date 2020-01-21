const req = require('requisition');

const { MessengerClient } = require('messaging-api-messenger');
const config = require('../bottender.config').messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

const { locationDictionary } = require('./helper');

const pageToken = config.accessToken;

// creates a new label. Pass in the name of the label and add the return ID to the .env file
async function createNewLabel(name) {
	const res = await req.post(`https://graph.facebook.com/v2.11/me/custom_labels?access_token=${pageToken}`).query({ name });
	const response = await res.json();
	return response;
}

// get every label
async function listAllLabels() { // eslint-disable-line no-unused-vars
	const res = await req.get(`https://graph.facebook.com/v2.11/me/custom_labels?fields=name&access_token=${pageToken}`);
	const response = await res.json();
	return response;
}

async function getBroadcastMetrics(broadcastID) {
	const res = await req.get(`https://graph.facebook.com/v2.11/${broadcastID}/insights/messages_sent?access_token=${pageToken}`);
	const response = await res.json();
	return response;
}

async function getUserLabels(PSID) {
	const res = await req.get(`https://graph.facebook.com/v4.0/${PSID}/custom_labels`).query({ access_token: pageToken, fields: 'name' });
	return res.json();
}

async function dissociateLabelsFromUser(UserID) {
	const userLabels = await client.getAssociatedLabels(UserID);
	if (userLabels.data) {
		await userLabels.data.forEach(async (element) => {
			await client.dissociateLabel(UserID, element.id);
		});
		return true;
	}
	return false;
}

async function addUserToBlackList(UserID) {
	return client.associateLabel(UserID, process.env.LABEL_BLACKLIST);
}

async function removeUserFromBlackList(UserID) {
	return client.dissociateLabel(UserID, process.env.LABEL_BLACKLIST);
}

async function checkUserOnLabel(UserID, labelID) { // checks if user is on the label
	const userLabels = await client.getAssociatedLabels(UserID);
	const theOneLabel = await userLabels.data.find(x => x.id === `${labelID}`); // find the one label with the name same

	if (theOneLabel) { // if we found the label on the user
		return true;
	}
	return false;
}

async function removeAllUserLabels(UserID) {
	const userLabels = await client.getAssociatedLabels(UserID);


	for (let i = 0; i < userLabels.data.length; i++) {
		const element = userLabels.data[i];
		await client.dissociateLabel(UserID, element.id);
	}
}

// Associates user to a label. Pass in the custom label id and the user psid
// associatesLabelToUser('123123', process.env.LABEL_ADMIN);
async function associatesLabelToUser(userID, labelID) {
	if (await checkUserOnLabel(userID, labelID) === true) {
		return true;
	}

	// const userLabels = await client.getAssociatedLabels(userID);
	// if (userLabels.data.length >= 20) { // actual facebook limit is 25 (by limit i mean before pagination starts to act up)
	// 	userLabels.data.forEach(async (element) => {
	// 		if (element.id !== process.env.LABEL_ADMIN) { // remove every tag except for admin
	// 			client.dissociateLabel(userID, element.id);
	// 		}
	// 	});
	// }

	return client.associateLabel(userID, labelID);
}

async function getLabelID(labelName) {
	const labelList = await client.getLabelList();

	const theOneLabel = await labelList.data.find(x => x.name === `${labelName}`);
	if (theOneLabel && theOneLabel.id) { // check if label exists
		return theOneLabel.id;
	}
	const newLabel = await client.createLabel(labelName);
	if (newLabel) {
		return newLabel.id;
	}
	return undefined;
}

// link an user to an agendaLabel
// each angendaLabel is 'agenda' + 'ID of the CCS' -> agenda1110
// All of the are going to be created and associated
async function linkUserToCustomLabel(UserID, labelName) {
	const ourLabels = await listAllLabels(); // get all labels we have
	const theOneLabel = await ourLabels.data.find(x => x.name === labelName); // find the one label with the name same (we need the id)

	if (theOneLabel) { // if we already have that label, all we have to do is associate the user to the id
		return associatesLabelToUser(UserID, theOneLabel.id);
	}
	// no theOneLabel exists so we have to create it
	const newLabel = await createNewLabel(labelName);

	if (!newLabel.error) { // no errors, so we can add the user to the label
		return associatesLabelToUser(UserID, newLabel.id);
	}
	return newLabel;
}

async function addCityLabel(userID, cityId) {
	let labelToAdd = '';
	if (cityId < 4) {
		labelToAdd = locationDictionary[cityId];
	} else if (cityId === '4') {
		labelToAdd = 'Nenhum desses';
	}

	if (labelToAdd) {
		const res = await linkUserToCustomLabel(userID, labelToAdd);
		if (res && !res.error) { return true; }
	}

	return false;
}

async function linkIntegrationTokenLabel(context) {
	// check if user has a integration_voucher but we haven't saved it yet (voucher) because we need to create a label
	if (context.state.user.integration_token) {
		if (await linkUserToCustomLabel(context.session.user.id, `${context.state.user.integration_token}`) === true) {
			await context.setState({ voucher: context.state.user.integration_token });
		}
	}
}

async function addNewUser(context, prepAPI) {
	await context.setState({ user: await prepAPI.getRecipientPrep(context.session.user.id) });
	await linkIntegrationTokenLabel(context);
	if (context.state.user.form_error || context.state.user.error || !context.state.user || !context.state.user.id) { // check if there was an error or if user doesnt exist
		await prepAPI.postRecipientPrep(context.session.user.id, context.state.politicianData.user_id, `${context.session.user.first_name} ${context.session.user.last_name}`);
		await context.setState({ user: {} });
	}
}


module.exports = {
	linkUserToCustomLabel,
	getLabelID,
	associatesLabelToUser,
	checkUserOnLabel,
	removeUserFromBlackList,
	addUserToBlackList,
	dissociateLabelsFromUser,
	createNewLabel,
	listAllLabels,
	getBroadcastMetrics,
	addCityLabel,
	removeAllUserLabels,
	linkIntegrationTokenLabel,
	addNewUser,
	getUserLabels,
};
