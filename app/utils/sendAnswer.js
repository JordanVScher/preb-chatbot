const MaAPI = require('../chatbot_api');
const prepApi = require('./prep_api');
const { checkAnsweredQuiz } = require('./checkQR');
// const flow = require('./flow');
const opt = require('./options');
const { createIssue } = require('../send_issue');

// const queixas = ['Camisinha Estourou', 'Tratamento IST', 'Indetectavel Transmite', 'Tenho Ferida', 'Apresenta Sintoma', 'Abuso', 'Tenho HIV'];

async function answerFollowUp(context) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags

	console.log(context.state.user);

	if (context.state.user.is_part_of_research2 === 1) { // parte da pesquisa
		// if (queixas.includes(context.state.intentName)) {
		// 	await context.sendText('Vamos te mandar pra triagem mas ela não está pronta ainda, marque uma consulta', await checkAnsweredQuiz(opt.answer.sendConsulta));
		// } else {
		// 	await context.setState({ dialog: 'endFlow' });
		// }
	} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se acabou o quiz
		if (!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 1) { // eslint-disable-line no-lonely-if
			await context.sendText('Ei, vc ainda não acabou o nosso quiz! Vamos terminar?', opt.answer.sendQuiz);
		} else if (context.state.user.is_eligible_for_research === 1) { // elegível mas não parte da pesquisa (disse não)
			await context.sendText('Você não quer mesmo fazer parte da nossa pesquisa?');
		} else if (context.state.user.is_eligible_for_research === 0) { // não é elegível
			await context.setState({ dialog: 'endFlow' });
		}
	}
}


async function sendAnswer(context) { // send answer from posicionamento
	// await context.setState({ currentTheme: await context.state.knowledge.knowledge_base.find(x => x.type === 'posicionamento') });
	await context.typingOn();
	await context.setState({ currentTheme: await context.state.knowledge.knowledge_base[0] });

	// console.log('currentTheme', currentTheme);
	if (context.state.currentTheme && (context.state.currentTheme.answer
        || (context.state.currentTheme.saved_attachment_type !== null && context.state.currentTheme.saved_attachment_id !== null))) {
		await MaAPI.setIntentStatus(context.state.politicianData.user_id, context.session.user.id, context.state.currentIntent, 1);
		await MaAPI.logAskedEntity(context.session.user.id, context.state.politicianData.user_id, context.state.currentTheme.entities[0].id);

		if (context.state.currentTheme.answer) { // if there's a text asnwer we send it
			await context.sendText(context.state.currentTheme.answer);
		}
		if (context.state.currentTheme.saved_attachment_type === 'image') { // if attachment is image
			await context.sendImage({ attachment_id: context.state.currentTheme.saved_attachment_id });
		}
		if (context.state.currentTheme.saved_attachment_type === 'video') { // if attachment is video
			await context.sendVideo({ attachment_id: context.state.currentTheme.saved_attachment_id });
		}
		if (context.state.currentTheme.saved_attachment_type === 'audio') { // if attachment is audio
			await context.sendAudio({ attachment_id: context.state.currentTheme.saved_attachment_id });
		}
		await context.typingOff();
		// await context.sendText(flow.mainMenu.text3);
	} else { // in case there's an error
		await createIssue(context);
	}
}
module.exports.sendAnswer = sendAnswer;
module.exports.answerFollowUp = answerFollowUp;
