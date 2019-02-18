const flow = require('./flow');
const opt = require('./options');
const prepApi = require('./prep_api');
const mainMenu = require('./mainMenu');
const help = require('./helper');
const { sendCarouselSus } = require('./timer');

const duvida = ['Como Pega Chato', 'Como Pega Clamidia', 'Como Pega Gonorreia', 'Como Pega Hepatite A', 'Como Pega Hepatite B', 'Como Pega HIV', 'Como Pega IST', 'Como Pega Sifilis', 'Sexo oral', 'Passivo ITS', 'Beijo IST', 'Engolir Semen', 'Sobre PREP', 'Sobre Chuca', 'Sobre Gouinage', 'Sobre Orientação Sexual', 'Sobre Orientacao Sexual', 'Quais Novidades', 'Sentido Da Vida', 'Me chupa', 'Manda Nudes', 'Espaço LGBT', 'Hipotenusa', 'Eu te amo']; // eslint-disable-line no-unused-vars
const problema = ['Tratamento IST', 'Tratamento HIV', 'Indetectavel Transmite', 'indetectável Transmite', 'Apresenta Sintoma', 'Tenho Ferida', 'Sera HIV', 'Alternativa camisinha', 'Camisinha Estourou', 'Sem Camisinha', 'Virgem Como Faco', 'Nunca Fiz Anal', 'Tenho HIV', 'Tenho HIV Contar Parceiro'];
const servico = ['Marcar Consulta', 'Abuso', 'Teste']; // shouldn't Abuso be here?

async function separateIntent(intentName) {
	if (servico.includes(intentName)) { return 'serviço'; }
	if (problema.includes(intentName)) { return 'problema'; }
	return 'duvida';
}

async function sendQuiz(context) {
	await context.setState({ quizCounter: await prepApi.getCountQuiz(context.session.user.id) }); // load quiz counter
	if (context.state.quizCounter && context.state.quizCounter.count_quiz >= 3) { // check quiz counter
		await mainMenu.sendShareAndMenu(context); // send regular menu
	} else {
		await prepApi.postCountQuiz(context.session.user.id); // update quiz counter
		if (context.state.startedQuiz === true) { // check if user started quiz
			await context.sendText(flow.desafio.text1, opt.answer.sendQuiz); // send quiz when user has started the quiz already
		} else {
			await context.sendText(flow.desafio.text3, opt.answer.sendQuiz); // send quiz when user hasn't even started the quiz
		}
	}
}

async function sendResearch(context) {
	await context.setState({ researchCounter: await prepApi.getCountResearch(context.session.user.id) }); // load quiz counter
	if (context.state.researchCounter && context.state.researchCounter.count_invited_research >= 3) { // check quiz counter
		await mainMenu.sendShareAndMenu(context); // send regular menu
	} else {
		await prepApi.postCountResearch(context.session.user.id); // update quiz counter
		await context.sendText(flow.desafio.text2, opt.answer.sendResearch); // send research
	}
}

async function followUp(context) {
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags
	await context.setState({ dialog: 'prompt' });

	if (context.state.user.is_target_audience === 1) { // check if user is part of target audience
		if (context.state.user.is_part_of_research === 1) { // parte da pesquisa
			await mainMenu.sendShareAndMenu(context); // send regular menu, here we don't have to check if user is prep or not
		} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se não acabou o quiz
			if (!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0) { // eslint-disable-line no-lonely-if
				await sendQuiz(context);
			} else if (context.state.user.is_eligible_for_research === 1) { // elegível mas não parte da pesquisa (disse não)
				await sendResearch(context);
			} else if (context.state.user.is_eligible_for_research === 0) { // não é elegível
				await sendCarouselSus(context, opt.sus);
			// await mainMenu.sendShareAndMenu(context); // send regular menu
			}
		}
	} else { // not part of target audience
		await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });

		if (!context.state.currentQuestion || context.state.currentQuestion.code === null) {
			await mainMenu.sendShareAndMenu(context); // send regular menu
		} else {
			await sendQuiz(context); // if user didn't finish quiz we can send it to them, even if they aren't on target_audience
		}
	}
}

async function sendConsulta(context) {
	await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) });
	if (context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0) {
		await context.sendText('Você tem uma consulta marcada, mas se precisar de ajuda vou mandar as informações dos CTAs:');
		for (const iterator of context.state.consultas.appointments) { // eslint-disable-line
			await context.sendText('Sua consulta:'
				+ `\n🏠: ${help.cidadeDictionary[context.state.cityId]}`
				+ `\n⏰: ${help.formatDate(iterator.datetime_start)}`
				+ `\n📞: ${help.telefoneDictionary[context.state.cityId]}`);
		}
		await context.sendText('<informações dos CTAs>');
		await mainMenu.sendMain(context); // send regular menu
	} else {
		await context.sendText('Percebi que você não tem uma consulta.\nVamos marcar?', opt.answer.sendConsulta);
	}
}

async function inviteTriagem(context) {
	await context.sendText('');
}

async function checkAconselhamento(context) {
	// await context.setState({ user: { is_prep: 0 } }); // for testing
	if (context.state.intentType === 'duvida') {
		if (context.state.user.is_prep === 0) { // user isn't prep
			await context.sendText('Agora que já respondi suas dúvidas, topa responder algumas perguntinhas para ver se tem mais alguma coisa que eu possa te ajudar?', opt.answer.isPrep);
		} else { // user is prep
			await mainMenu.sendShareAndMenu(context); // send regular menu
		}
	} else { // problema e serviço
		if (context.state.user.is_prep === 0) { // eslint-disable-line no-lonely-if
			await sendConsulta(context); // is prep, === 1
		} else { // user isn't prep, goes to triagem
			await inviteTriagem(context);
			await mainMenu.sendShareAndMenu(context); // send regular menu
			// await context.sendText('Bb, vou te fazer umas perguntinhas para te ajudar melhor.');
			// await context.sendText('<Fluxo triagem> a fazer');
			// await context.setState({ dialog: 'triagem' });
		}
	}
}

async function followUpIntent(context) {
	await context.setState({ intentType: await separateIntent(context.state.intentName) });
	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) }); // get user flags
	await context.setState({ dialog: 'prompt' });

	// console.log('intentType', context.state.intentType);
	// console.log(context.state.user);

	if (context.state.user.is_target_audience === 1) { // check if user is part of target audience
		if (context.state.user.is_part_of_research === 1) { // parte da pesquisa === 1
			await checkAconselhamento(context);
			// console.log('Entrei aqui 1');
		} else { // não faz parte da pesquisa, verifica se temos o resultado (é elegível) ou se não acabou o quiz
			if (context.state.intentType === 'serviço') { await context.sendText('Melhor ir em um posto de saúde mais próximo de você'); }
			if (!context.state.user.is_eligible_for_research || context.state.user.finished_quiz === 0) { // eslint-disable-line no-lonely-if === 0
				await sendQuiz(context);
				// console.log('Entrei aqui 2');
			} else if (context.state.user.is_eligible_for_research === 1) { // elegível mas não parte da pesquisa (disse não) === 1
				await sendResearch(context);
				// console.log('Entrei aqui 3');
			} else if (context.state.user.is_eligible_for_research === 0) { // não é elegível === 0
				// console.log('Entrei aqui 4');
				await sendCarouselSus(context, opt.sus);
				// await mainMenu.sendShareAndMenu(context); // send regular menu
			}
		}
	} else { // not part of target audience
		await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
		if (!context.state.currentQuestion || context.state.currentQuestion.code === null) {
			await mainMenu.sendShareAndMenu(context); // send regular menu
		} else {
			await sendQuiz(context); // if user didn't finish quiz we can send it to them, even if they aren't on target_audience
		}
	}
}

async function asksDesafio(context) {
	if (context.state.startedQuiz === true) { // user has answered the quiz already, he goes to the mainMenu
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
module.exports.separateIntent = separateIntent;
module.exports.followUpIntent = followUpIntent;
