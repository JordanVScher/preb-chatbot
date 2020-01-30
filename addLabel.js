require('dotenv').config();

const testFolder = './.sessions/';
const fs = require('fs');

const labels = require('./app/utils/labels');
const maAPI = require('./app/chatbot_api');

async function addCityLabels() { // eslint-disable-line
	fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));

		const res = await labels.addCityLabel(obj.user.id, obj._state.user.city);
		console.log(`Added ${obj.user.first_name} to label city ${obj._state.user.city} ->`, res);
	});
}

async function addVoucherLabels() { // eslint-disable-line
	fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));
		if (obj && obj._state && obj._state.user && obj._state.user.fb_id && obj._state.user.integration_token) {
			const res = await labels.linkUserToCustomLabel(obj._state.user.fb_id, `${obj._state.user.integration_token}`);
			console.log(`Added ${obj.user.first_name} to label integration_token ${obj._state.user.integration_token} ->`, res);
		}
	});
}

async function removeEveryLabel() { // eslint-disable-line
	fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));
		console.log(obj._state.user.fb_id);
		console.log(await labels.removeAllUserLabels(obj._state.user.fb_id));
	});
}

async function addLabelAssistente(pageID) { // eslint-disable-line
	const politicianData = await maAPI.getPoliticianData(pageID);
	console.log(`Id do ${politicianData.name}:`, politicianData.id);

	fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));
		const userLabels = await labels.getUserLabels(obj.user.id); // get user labels

		for (let i = 0; i < userLabels.data.length; i++) {
			const currentLabel = userLabels.data[i];
			console.log(obj.user.id, 'currentLabel', currentLabel);

			if (currentLabel) {
				const response = await maAPI.postRecipientLabel(politicianData.id, obj.user.id, currentLabel.name); // save the new label
				console.log('resposta do post da plataforma', response);
			}
		}
	});
}
