const prepApi = require('./prep_api');

// check if user has already answered the quiz to remove the quick_reply option from the menu UNUSED
async function checkAnsweredQuiz(context, options) {
	let newOptions = options.quick_replies; // getting array out of the QR object
	// console.log('antes', newOptions);

	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	if (newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1) { // no more questions to answer
		newOptions = await newOptions.filter(obj => obj.payload !== 'beginQuiz'); // remove quiz option
	}

	// if Options has the consulta options we have to check if the user is able to scheduled appointments
	if (newOptions.find(x => x.payload === 'getCity') || newOptions.find(x => x.payload === 'verConsulta')) { // checks if we have the options
		if (context.state.is_eligible_for_research === true) { // if user is eligible he can schedule appointments
			await context.setState({ consultas: await prepApi.getAppointment(context.session.user.id) }); // checks if user has a scheduled appointment already
			if (context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0) { // user can only have one appointment
				newOptions = await newOptions.filter(obj => obj.payload !== 'getCity'); // remove option to schedule appointment because he scheduled one already
			} else { // if he has one we can show it to him
				newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option to see consulta for there isn't any consulta available
			}
		} else { // user shouldn't be able to see these options if he is not eligible
			newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option
			newOptions = await newOptions.filter(obj => obj.payload !== 'getCity'); // remove option
		}
	}

	// console.log('depois', newOptions);
	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

async function checkConsulta(context, options) {
	let newOptions = options.quick_replies; // getting array out of the QR object

	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });

	if (context.state.user.is_eligible_for_research === 1) {
		await context.setState({ consultas: await prepApi.getAppointment(context.session.user.id) }); // checks if user has a scheduled appointment already
		if (context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0) { // user can only have one appointment
			newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-getCity'); // remove option to schedule appointment because he scheduled one already
			newOptions = await newOptions.filter(obj => obj.payload !== 'getCity'); // remove option to schedule appointment because he scheduled one already
		} else { // if he has one we can show it to him
			newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-verConsulta'); // remove option to see consulta for there isn't any consulta available
			newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option to see consulta for there isn't any consulta available
		}
	} else { // user shouldn't be able to see these options if he is not eligible
		newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-verConsulta'); // remove option
		newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option
		newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-getCity'); // remove option
		newOptions = await newOptions.filter(obj => obj.payload !== 'getCity'); // remove option
	}

	return { quick_replies: newOptions };
}

async function checkMainMenu(context) {
	await context.setState({ sendExtraMessages: false });
	let newOptions = [];
	// console.log('antes', newOptions);
	newOptions.push({ content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' });
	newOptions.push({ content_type: 'text', title: 'Prevenções', payload: 'seePreventions' });

	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });

	if (context.state.user.is_target_audience === 1) { // check if user is part of target audience
		if (context.state.user.is_part_of_research === 1) { // 1
			await context.setState({ consultas: await prepApi.getAppointment(context.session.user.id) }); // checks if user has a scheduled appointment already
			if (context.state.consultas && context.state.consultas.appointments && context.state.consultas.appointments.length > 0) { // user can only have one appointment
				newOptions.push({ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' });
			} else {
				newOptions.push({ content_type: 'text', title: 'Marcar Consulta', payload: 'getCity' });
			}
		} else if (context.state.user.is_eligible_for_research === 1) { // 1
			newOptions.push({ content_type: 'text', title: 'Pesquisa', payload: 'askResearch' });
		} else if (context.state.user.is_eligible_for_research === 0 && context.state.user.finished_quiz === 1) { // 0 1
			newOptions.push({ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' });
		} else if (context.state.user.finished_quiz === 0) { // 0
			newOptions.push({ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' });
			newOptions.push({ content_type: 'text', title: 'Quiz', payload: 'beginQuiz' });
		}

		if (await newOptions.find(obj => obj.payload === 'joinToken') === true && context.state.user.integration_token && context.state.user.integration_token.length > 0) { // check if user has token
			newOptions = await newOptions.filter(obj => obj.payload !== 'joinToken'); // remove quiz option
			newOptions.push({ content_type: 'text', title: 'Ver meu Token', payload: 'seeToken' });
		}
	} else { // not on target audience, may send quiz
		await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
		if (context.state.currentQuestion && context.state.currentQuestion.code !== null) {
			newOptions.push({ content_type: 'text', title: 'Quiz', payload: 'beginQuiz' });
		}
	}

	// console.log('depois', newOptions);
	newOptions.push({ content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' });
	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

module.exports.checkAnsweredQuiz = checkAnsweredQuiz;
module.exports.checkMainMenu = checkMainMenu;
module.exports.checkConsulta = checkConsulta;
