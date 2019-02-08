const flow = require('./flow');
const opt = require('./options');
const prepApi = require('./prep_api');
const mainMenu = require('./mainMenu');

async function followUp(context) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags
	await context.setState({ dialog: 'mainMenu' });

	console.log(context.state.user);

	if (context.state.user.is_part_of_research === 1) { // parte da pesquisa
		await mainMenu.sendShareAndMenu(context); // send regular menu
	} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se não acabou o quiz
		if (!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0) { // eslint-disable-line no-lonely-if
			await context.setState({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // load quiz counter
			if (context.state.quizCounter && context.state.quizCounter.count_quiz >= 3) { // check quiz counter
				await mainMenu.sendShareAndMenu(context); // send regular menu
			} else {
				await prepApi.postCountQuiz(context.session.user.id); // update quiz counter
				await context.sendText(flow.desafio.text1, opt.answer.sendQuiz); // send quiz
			}
		} else if (context.state.user.is_eligible_for_research === 1) { // elegível mas não parte da pesquisa (disse não)
			await context.sendText(flow.desafio.text2, opt.answer.sendResearch);
		} else if (context.state.user.is_eligible_for_research === 0) { // não é elegível
			await mainMenu.sendShareAndMenu(context); // send regular menu
		}
	}
}

async function asksDesafio(context) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	if (context.state.user.finished_quiz === 1) { // user has answered the quiz already, he goes to the mainMenu
		await mainMenu.sendMain(context);
	} else {
		await context.sendText(flow.asksDesafio.text1);
		await context.sendText(flow.asksDesafio.text2, opt.asksDesafio); // has yet to awnser the quiz
	}
}

async function desafioRecusado(context) {
	await context.sendText(flow.desafioRecusado.text1);
	await mainMenu.sendMain(context);
}

async function desafioAceito(context) {
	await context.sendText(flow.desafioAceito.text1, opt.desafioAceito);
}


module.exports.asksDesafio = asksDesafio;
module.exports.desafioRecusado = desafioRecusado;
module.exports.desafioAceito = desafioAceito;
module.exports.followUp = followUp;
