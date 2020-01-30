const prepApi = require('./prep_api');
const { moment } = require('./helper');

// check if user has already answered the quiz to remove the quick_reply option from the menu UNUSED
async function checkAnsweredQuiz(context, options) {
	let newOptions = options.quick_replies; // getting array out of the QR object
	// console.log('antes', newOptions);

	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });
	if (newOptions.find(x => x.payload === 'beginQuiz') && context.state.user.finished_quiz === 1) { // no more questions to answer
		newOptions = await newOptions.filter(obj => obj.payload !== 'beginQuiz'); // remove quiz option
	}

	// if Options has the consulta options we have to check if the user is able to scheduled appointments
	if (newOptions.find(x => x.payload === 'showDays') || newOptions.find(x => x.payload === 'verConsulta')) { // checks if we have the options
		if (context.state.user.is_eligible_for_research === 1) { // if user is eligible he can schedule appointments
			await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) }); // checks if user has a scheduled appointment already
			if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) { // user can only have one appointment
				newOptions = await newOptions.filter(obj => obj.payload !== 'showDays'); // remove option to schedule appointment because he scheduled one already
			} else { // if he has one we can show it to him
				newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option to see consulta for there isn't any consulta available
			}
		} else { // user shouldn't be able to see these options if he is not eligible
			newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option
			newOptions = await newOptions.filter(obj => obj.payload !== 'showDays'); // remove option
		}
	}

	// console.log('depois', newOptions);
	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

async function checkConsulta(context, options) {
	let newOptions = options.quick_replies; // getting array out of the QR object

	await context.setState({ user: await prepApi.getRecipientPrep(context.session.user.id) });

	if (context.state.user.is_eligible_for_research === 1) {
		await context.setState({ consulta: await prepApi.getAppointment(context.session.user.id) }); // checks if user has a scheduled appointment already
		if (context.state.consulta && context.state.consulta.appointments && context.state.consulta.appointments.length > 0) { // user can only have one appointment
			newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-showDays'); // remove option to schedule appointment because he scheduled one already
			newOptions = await newOptions.filter(obj => obj.payload !== 'showDays'); // remove option to schedule appointment because he scheduled one already
		} else { // if he has one we can show it to him
			newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-verConsulta'); // remove option to see consulta for there isn't any consulta available
			newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option to see consulta for there isn't any consulta available
		}
	} else { // user shouldn't be able to see these options if he is not eligible
		newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-verConsulta'); // remove option
		newOptions = await newOptions.filter(obj => obj.payload !== 'verConsulta'); // remove option
		newOptions = await newOptions.filter(obj => obj.payload !== 'Sign-showDays'); // remove option
		newOptions = await newOptions.filter(obj => obj.payload !== 'showDays'); // remove option
	}

	return { quick_replies: newOptions };
}

async function checkMainMenu(context) {
	let opt = [];
	const baterPapo = { content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' };
	const quiz = { content_type: 'text', title: 'Quiz', payload: 'beginQuiz' };
	const quizRecrutamento = { content_type: 'text', title: 'Quiz', payload: 'recrutamento' };
	const quizBrincadeira = { content_type: 'text', title: 'Quiz', payload: 'querBrincadeira' };
	const prevencoes = { content_type: 'text', title: 'Prevenções', payload: 'seePreventions' };
	const jaFacoParte = { content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' };
	const seeToken = { content_type: 'text', title: 'Ver meu Voucher', payload: 'seeToken' };
	const sobreAmanda = { content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' };

	opt.push(baterPapo);
	opt.push(quiz);
	opt.push(prevencoes);
	opt.push(jaFacoParte);
	opt.push(sobreAmanda);

	if (context.state.publicoInteresseEnd) {
		const index = opt.findIndex(x => x.title === 'Quiz');
		if (context.state.user.is_target_audience && !context.state.recrutamentoEnd) { if (index) opt[index] = quizRecrutamento; }
		if (!context.state.user.is_target_audience && !context.state.quizBrincadeiraEnd) { if (index) opt[index] = quizBrincadeira; }
	}

	if (context.state.publicoInteresseEnd && (context.state.quizBrincadeiraEnd || context.state.recrutamentoEnd)) { opt = await opt.filter(x => x.title !== 'Quiz'); } // dont show quiz option if user has finished the quiz


	if (context.state.user.integration_token) { // replace token options if user has one
		const index = opt.findIndex(x => x.title === 'Já Faço Parte'); if (index) opt[index] = seeToken;
	}

	return { quick_replies: opt };
}

async function checkMedication(prepSince) { // eslint-disable-line
	const newOptions = [];
	const months = 4; // the time range for the user to be in the first stage of the treatment

	if (prepSince) {
		const modxDate = moment(prepSince);
		const diff = Math.abs(modxDate.diff(Date.now(), 'months'));

		// if the difference between now and the user prepSince date is bigger than 4 months than he is not on the first stage anymore
		if (diff >= months) {
			newOptions.push({ content_type: 'text', title: 'Sintomas', payload: 'sintomas' });
		}
	}
	newOptions.push({ content_type: 'text', title: 'Acabou o Remédio', payload: 'acabouRemedio' });
	newOptions.push({ content_type: 'text', title: 'Esqueci de tomar', payload: 'esqueciDeTomar' });
	newOptions.push({ content_type: 'text', title: 'Dúvida com o Remédio', payload: 'duvidaComRemedio' });

	return { quick_replies: newOptions }; // putting the filtered array on a QR object
}

async function autoTesteOption(options, cityId) {
	let newOptions = options.quick_replies;
	// no need to filter out cityId = 3
	if (cityId && cityId.toString() === '1') { // belo horizonte
		newOptions = await newOptions.filter(obj => obj.payload !== 'rua');
		newOptions = await newOptions.filter(obj => obj.payload !== 'ong');
	} else if (cityId && cityId.toString() === '2') { // salvador
		newOptions = await newOptions.filter(obj => obj.payload !== 'rua');
		newOptions = await newOptions.filter(obj => obj.payload !== 'auto');
	}
	return { quick_replies: newOptions };
}

async function getErrorQR(lastPostback) { // eslint-disable-line
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
}

async function buildButton(url, title) {
	return [{
		type: 'web_url',
		url,
		title,
	}];
}

async function sendShare(context, links, results, imagem) {
	const subtitle = results && results[0] ? results[0] : 'Chatbot';

	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements: [
				{
					title: links.siteTitle,
					subtitle,
					image_url: imagem || '',
					item_url: links.siteURL,
					buttons: [
						{
							type: 'element_share',
							share_contents: {
								attachment: {
									type: 'template',
									payload: {
										template_type: 'generic',
										elements: [
											{
												title: links.siteTitle2,
												subtitle,
												// image_url: imagem || '',
												default_action: {
													type: 'web_url',
													url: links.siteURL,
												},
												buttons: [
													{
														type: 'web_url',
														url: links.siteURL,
														title: 'Conheçer',
													},
												],
											},
										],
									},
								},
							},
						},
					],
				},
			],
		},
	});
}

module.exports = {
	checkAnsweredQuiz,
	checkMainMenu,
	checkConsulta,
	checkMedication,
	autoTesteOption,
	getErrorQR,
	buildButton,
	sendShare,
};
