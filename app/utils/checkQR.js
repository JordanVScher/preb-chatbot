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
		} else if (context.state.user.is_eligible_for_research === 1 && context.state.user.finished_quiz === 1) { // 1 1
			newOptions.push({ content_type: 'text', title: 'Pesquisa', payload: 'askResearch' });
		} else if (context.state.user.is_eligible_for_research === 0 && context.state.user.finished_quiz === 1) { // 0 1
			newOptions.push({ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' });
		} else if (context.state.user.finished_quiz === 0) { // 0
			newOptions.push({ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' });
			newOptions.push({ content_type: 'text', title: 'Quiz', payload: 'beginQuiz' });
		}

		if (context.state.user.integration_token && context.state.user.is_part_of_research === 1) {
			newOptions = await newOptions.filter(obj => obj.payload !== 'joinToken'); // remove quiz option
			newOptions.push({ content_type: 'text', title: 'Ver meu Voucher', payload: 'seeToken' }); // if user already has an integration token we remove the option to enter the token and show the option to see it
		}
	} else { // not on target audience, may send quiz if there's still any fun_question to be answered
		await context.setState({ currentQuestion: await prepApi.getPendinQuestion(context.session.user.id, context.state.categoryQuestion) });
		if (context.state.currentQuestion && context.state.currentQuestion.code !== null) {
			newOptions.push({ content_type: 'text', title: 'Quiz', payload: 'beginQuiz' });
		}
	}

	if (context.state.user.is_part_of_research === 1 && context.state.user.is_prep === 0) {
		newOptions.push({ content_type: 'text', title: 'Medicação', payload: 'medicaçao' });
	}

	newOptions.push({ content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' });
	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

async function checkMedication(context) { // eslint-disable-line
	const newOptions = [];

	const fourMonths = 7776000; // the time range for the user to be in the first stage of the treatment
	// const userJoined = 1552080090000 / 1000 | 0; // eslint-disable-line
	// when the user became prep (without mili)
	const userJoined = context.state.user.prep_since / 1000 | 0; // eslint-disable-line 
	// now (without mili)
	const now = Date.now() / 1000 | 0; // eslint-disable-line
	// if the difference between now and the user date is bigger than 4 months than he is not on the first stage anymore
	if (now - userJoined <= fourMonths) {
		newOptions.push({ content_type: 'text', title: 'Sintomas', payload: 'sintomas' }); // todo: falta verificar se o user está no primeiro trimestre pra mostrar essa opção
	}
	newOptions.push({ content_type: 'text', title: 'Acabou o Remédio', payload: 'acabouRemedio' });
	newOptions.push({ content_type: 'text', title: 'Esqueci de tomar', payload: 'esqueciDeTomar' });
	newOptions.push({ content_type: 'text', title: 'Dúvida com o Remédio', payload: 'duvidaComRemedio' });

	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

module.exports.getErrorQR = async (lastPostback) => { // eslint-disable-line
	const elements = [];
	// const firstArray = opt.menuOptions;

	// firstArray.forEach((element, index) => {
	// 	elements.push({
	// 		content_type: 'text',
	// 		title: element,
	// 		payload: opt.menuPostback[index],
	// 	});
	// });

	elements.push({
		content_type: 'text',
		title: 'Voltar para o Menu',
		payload: 'mainMenu',
	});

	// if (lastPostback && lastPostback.length > 0) {
	// 	elements.push({
	// 		content_type: 'text',
	// 		title: 'Tentar de novo',
	// 		payload: lastPostback,
	// 	});
	// }

	return { quick_replies: elements };
};

module.exports.checkAnsweredQuiz = checkAnsweredQuiz;
module.exports.checkMainMenu = checkMainMenu;
module.exports.checkConsulta = checkConsulta;
module.exports.checkMedication = checkMedication;
