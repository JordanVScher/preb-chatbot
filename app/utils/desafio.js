const flow = require('./flow');
const opt = require('./options');
const prepApi = require('./prep_api');

// check if user has already answered the quiz to remove the quick_reply option from the menu UNUSED
async function checkAnsweredQuiz(context, options) {
	let newOptions = options.quick_replies; // getting array out of the QR object
	// console.log('antes', newOptions);

	const user = await prepApi.getRecipientPrep(context.session.user.id);
	if (newOptions.find(x => x.payload === 'beginQuiz') && user.finished_quiz === 1) { // no more questions to answer
		newOptions = await newOptions.filter(obj => obj.payload !== 'beginQuiz'); // remove quiz option
	}

	// if Options has the consulta options we have to check if the user is able to scheduled appointments
	if (newOptions.find(x => x.payload === 'marcarConsulta') || newOptions.find(x => x.payload === 'verConsulta')) { // checks if we have the options
		if (context.state.is_eligible_for_research === true) { // if user is eligible he can schedule appointments
			const consultas = await prepApi.getAppointment(context.session.user.id); // checks if user has a scheduled appointment already
			if (consultas.appointments && consultas.appointments.length === 0) { // user can only have one appointment
				newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option to see consulta for there isn't any consulta available
			} else { // if he has one we can show it to him
				newOptions = await newOptions.filter(obj => obj.payload !== 'marcarConsulta'); // remove option to schedule appointment because he scheduled one already
			}
		} else { // user shouldn't be able to see these options if he is not eligible
			newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option
			newOptions = await newOptions.filter(obj => obj.payload !== 'marcarConsulta'); // remove option
		}
	}

	// console.log('depois', newOptions);
	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

async function asksDesafio(context, options) {
	const user = await prepApi.getRecipientPrep(context.session.user.id);
	if (user.finished_quiz === 1) {
		await context.sendText('Veja o que você pode fazer por aqui', await checkAnsweredQuiz(context, options)); // has answered the quiz already
	} else {
		await context.sendText(flow.asksDesafio.text1, opt.asksDesafio); // has yet to awnser the quiz
	}
}

async function desafioRecusado(context) {
	await context.sendText('Ok');
	await context.sendText('Veja o que você pode fazer por aqui', await checkAnsweredQuiz(context, opt.greetings));
}

async function desafioAceito(context) {
	await context.sendText('É o seguinte, são algumas perguntinhas e para responder, basta clicar no botão. Caso você clique em "Não sei o que é" em alguma delas, eu explicarei e você poderá responder novamente. No final, seu resultado 😉');
	await context.sendText('Sinceridade, hein! Não estou aqui para te julgar, então se joga!', opt.desafioAceito);
}


module.exports.asksDesafio = asksDesafio;
module.exports.desafioRecusado = desafioRecusado;
module.exports.desafioAceito = desafioAceito;
module.exports.checkAnsweredQuiz = checkAnsweredQuiz;
