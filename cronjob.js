require('dotenv').config();

const fs = require('fs');
const jsonfile = require('jsonfile');
const { getRecipientPrep } = require('./app/utils/prep_api');
const { sentryError } = require('./app/utils/error');
const { getQR } = require('./app/utils/attach');
const { moment } = require('./app/utils/helper');
const { sendBroadcast } = require('./app/utils/broadcast');
const presquisaTexts = require('./app/utils/flow').ofertaPesquisaSim;

const sessionsFolder = './.sessions/';

async function checkTimeDifference(date) {
	const dateM = moment(date);
	const diff = Math.abs(dateM.diff(Date.now(), 'minutes'));
	console.log('diff', diff);
	if (diff > 5) return true;
	return false;
}


async function sendNotificacao() {
	const listNames = fs.readdirSync(sessionsFolder); // get all file names

	for (let i = 0; i < listNames.length; i++) {
		const fileName = listNames[i]; // get current filename
		const file = jsonfile.readFileSync(sessionsFolder + fileName); // load file as a json

		if (file._state.whenBecameTargetAudience) { // check if user has a date from when he became part of target audience
			const timeTest = await checkTimeDifference(new Date(file._state.whenBecameTargetAudience)); // check if enough time has passed since then to send the message
			console.log('timeTest', timeTest);
			if (timeTest) {
				file._state.user = await getRecipientPrep(file.user.id); // update user recipient status from the api

				if (file._state.user.is_target_audience && (file._state.user.has_appointments === 0 && !file._state.leftContact)) {
					if (!file._state.sentNotificacao) {
						const error = await sendBroadcast(file.user.id, presquisaTexts.text2, await getQR(presquisaTexts));
						if (!error) {
							console.log(`Broadcast enviado para ${file.user.id} - ${file.user.name}`);
							file._state.sentNotificacao = new Date();
							jsonfile.writeFile(sessionsFolder + fileName, file)
								.then(() => console.log(`Novo estado de ${file.user.id} escrito com sucesso!`))
								.catch((err) => sentryError(`Não foi possível salvar o estado de ${file.user.id} - ${file.user.name} depois do broadcast`, err));
						} else {
							sentryError(`Erro no envio do broadcast de ${file.user.id} - ${file.user.name}`, error);
						}
					}
				}
			}
		}
	}
}
