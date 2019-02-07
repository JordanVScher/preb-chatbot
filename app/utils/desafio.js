const flow = require('./flow');
const opt = require('./options');
const prepApi = require('./prep_api');
const { sendMain } = require('./mainMenu');

async function followUp(context) {
	if (context.state.followUpCounter >= 3) { // only offer the options on the first 3 times
		await sendMain(context);
	} else {
		await context.setState({ followUpCounter: context.state.followUpCounter >= 0 ? context.state.followUpCounter + 1 : 0 });
		console.log('context.state.followUpCounter', context.state.followUpCounter);

		await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags
		await context.setState({ dialog: 'mainMenu' });

		console.log(context.state.user);

		if (context.state.user.is_part_of_research === 1) { // parte da pesquisa
			await sendMain(context);
		} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se não acabou o quiz
			if (!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0) { // eslint-disable-line no-lonely-if
				await context.sendText(flow.desafio.text1, opt.answer.sendQuiz);
			} else if (context.state.user.is_eligible_for_research === 1) { // elegível mas não parte da pesquisa (disse não)
				await context.sendText(flow.desafio.text2);
			} else if (context.state.user.is_eligible_for_research === 0) { // não é elegível
				await sendMain(context);
			}
		}
	}
}

async function asksDesafio(context) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	if (context.state.user.finished_quiz === 1) { // user has answered the quiz already, he goes to the mainMenu
		await sendMain(context);
	} else {
		await context.sendText(flow.asksDesafio.text1, opt.asksDesafio); // has yet to awnser the quiz
	}
}

async function desafioRecusado(context) {
	await context.sendText(flow.desafioRecusado.text1);
	await sendMain(context);
}

async function desafioAceito(context) {
	await context.sendText(flow.desafioAceito.text1);
	await context.sendText(flow.desafioAceito.text2, opt.desafioAceito);
}


module.exports.asksDesafio = asksDesafio;
module.exports.desafioRecusado = desafioRecusado;
module.exports.desafioAceito = desafioAceito;
module.exports.followUp = followUp;
