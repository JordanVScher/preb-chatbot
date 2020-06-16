require('dotenv').config();

const fs = require('fs');
const jsonfile = require('jsonfile');
const { getRecipientPrep } = require('./app/utils/prep_api');
const { sentryError } = require('./app/utils/error');
const { getQR } = require('./app/utils/attach');
const { moment } = require('./app/utils/helper');
const { sendBroadcast } = require('./app/utils/broadcast');
const presquisaTexts = require('./app/utils/flow').ofertaPesquisaSim;
const { falarComHumano } = require('./app/utils/flow');

const sessionsFolder = './.sessions/';

async function checkTimeDifference(date) {
	const dateM = moment(date);
	const diff = Math.abs(dateM.diff(Date.now(), 'minutes'));

	if (diff > 5) return true;
	return false;
}

const joinedText = `${presquisaTexts.text1 || ''}\n${presquisaTexts.text2 || ''}`;
// Criar alarme para disparar notificação para convidar usuário a participar da pesquisa.
// Esse alarme deve ser disparado para quem não tem perfil de participante
// Ou seja, quem é público de interesse e não marcou uma consulta nem deixou o contato
// Utilizamos a chave whenBecameTargetAudience (setada no final do quiz, pra quem virou público de interesse)
// Essa chave indica o momento em que o usuário se tornou público de interesse
// Dessa forma, não corremos o risco do usuário se tornar públic de interesse e imediatamente receber essa notificação


async function notificacaoOfertaPesquisa() {
	const listNames = fs.readdirSync(sessionsFolder); // get all file names

	for (let i = 0; i < listNames.length; i++) {
		const fileName = listNames[i]; // get current filename
		const file = jsonfile.readFileSync(sessionsFolder + fileName); // load file as a json

		const sessionUser = file._state && file._state.sessionUser ? file._state.sessionUser : { name: '' };
		const userName = sessionUser.name;
		const userID = file.user.id;

		if (file._state.whenBecameTargetAudience) { // check if user has a date from when he became part of target audience
			const timeTest = await checkTimeDifference(new Date(file._state.whenBecameTargetAudience)); // check if enough time has passed since then to send the message

			if (timeTest) {
				file._state.user = await getRecipientPrep(userID); // update user recipient status from the api
				if (file._state.user.is_target_audience && (file._state.user.has_appointments === 0 && !file._state.leftContact)) {
					if (!file._state.sentNotificacao) {
						let error = await sendBroadcast(userID, joinedText, await getQR(falarComHumano));
						error = await sendBroadcast(userID, falarComHumano.text1, await getQR(falarComHumano));
						if (!error) {
							console.log(`Broadcast enviado para ${userID} - ${userName}`);
							file._state.sentNotificacao = new Date();
							jsonfile.writeFile(sessionsFolder + fileName, file)
								.then(() => console.log(`Novo estado de ${userID} escrito com sucesso!`))
								.catch((err) => sentryError(`Não foi possível salvar o estado de ${userID} - ${userName} depois do broadcast`, err));
						} else {
							sentryError(`Erro no envio do broadcast de ${userID} - ${userName}`, error);
						}
					}
				}
			}
		}
	}
}

notificacaoOfertaPesquisa();
module.exports = { notificacaoOfertaPesquisa };
