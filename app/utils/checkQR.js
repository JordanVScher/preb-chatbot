const { moment } = require('./helper');
const { checkAppointment } = require('./consulta-aux');

async function checkMainMenu(context) {
	let opt = [];
	const baterPapo = { content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' };
	const quiz = { content_type: 'text', title: 'Quiz', payload: 'beginQuiz' };
	const quizRecrutamento = { content_type: 'text', title: 'Quiz', payload: 'recrutamento' };
	const quizBrincadeira = { content_type: 'text', title: 'Quiz', payload: 'querBrincadeira' };
	const prevencoes = { content_type: 'text', title: 'Prevenções', payload: 'seePreventions' };
	const join = { content_type: 'text', title: 'Já Tomo PrEP', payload: 'join' };
	const seePrepToken = { content_type: 'text', title: 'Ver meu Voucher', payload: 'seePrepToken' };
	const sobreAmanda = { content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' };
	const termos = { content_type: 'text', title: 'Termos', payload: 'TCLE' };
	// const pesquisa = { content_type: 'text', title: 'Pesquisa', payload: 'ofertaPesquisaStart' };
	const marcarConsulta = { content_type: 'text', title: 'Bate papo presencial', payload: 'pesquisaPresencial' };
	const deixarContato = { content_type: 'text', title: 'Bate papo virtual', payload: 'pesquisaVirtual' };
	const verConsulta = { content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' };

	// for preps
	const duvidaPrep = { content_type: 'text', title: 'Dúvidas', payload: 'duvidasPrep' };
	const deuRuimPrep = { content_type: 'text', title: 'Deu Ruim', payload: 'deuRuimPrep' };
	const voltarTomarPrep = { content_type: 'text', title: 'Voltar a tomar PrEP', payload: 'voltarTomarPrep' };
	const alarmePrep = { content_type: 'text', title: 'Alarme', payload: 'alarmePrep' };
	const tomeiPrep = { content_type: 'text', title: 'Tomei', payload: 'tomeiPrep' };
	// for not preps
	const duvidaNaoPrep = { content_type: 'text', title: 'Dúvidas', payload: 'duvidasNaoPrep' };
	const deuRuimNaoPrep = { content_type: 'text', title: 'Deu Ruim', payload: 'deuRuimNaoPrep' };

	if (context.state.user.is_prep === null || context.state.user.is_prep === undefined) {
		opt.push(baterPapo);
		opt.push(quiz);
		opt.push(prevencoes);
		opt.push(join);
		opt.push(sobreAmanda);

		if (context.state.publicoInteresseEnd) {
			const index = opt.findIndex((x) => x.title === 'Quiz');
			if (context.state.user.is_target_audience === 0) {
				if (!context.state.quizBrincadeiraEnd) { if (index) opt[index] = quizBrincadeira; } else
				if (!context.state.preCadastroSignature) { if (index) opt[index] = termos; }
			}

			if (context.state.user.is_target_audience === 1) {
				await context.setState({ temConsulta: await checkAppointment(context.session.user.id) });
				if (!context.state.temConsulta && !context.state.leftContact) {
					if (index) { opt[index] = marcarConsulta; opt.splice(index + 1, 0, deixarContato); }
				} else if (!context.state.recrutamentoEnd && context.state.user.risk_group) {
					if (index) opt[index] = quizRecrutamento;
				} else if (!context.state.preCadastroSignature) { if (index) opt[index] = termos; }

				if (context.state.temConsulta) {
					opt.splice(index + 1, 0, verConsulta);
				}
			}
		}

		// dont show quiz option if either of brincadeira and recrutamento are answered, also dont show quiz if user is taget_audiece but is not in the risk group
		if (context.state.publicoInteresseEnd && (context.state.quizBrincadeiraEnd || (context.state.recrutamentoEnd
		|| (context.state.user.is_target_audience && !context.state.user.risk_group)))) { opt = await opt.filter((x) => x.title !== 'Quiz'); } // dont show quiz option if user has finished the quiz

		if (context.state.user.integration_token) { // replace token options if user has one
			const index = opt.findIndex((x) => x.payload === 'join'); if (index) opt[index] = seePrepToken;
		}
	} else if (context.state.user.is_prep === 1) {
		opt = [baterPapo, duvidaPrep, deuRuimPrep, voltarTomarPrep, alarmePrep, tomeiPrep];
	} else if (context.state.user.is_prep === 0) {
		opt = [baterPapo, duvidaNaoPrep, deuRuimNaoPrep];
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

async function autotesteOption(options, cityId) {
	let newOptions = options.quick_replies;
	// no need to filter out cityId = 3
	if (cityId && cityId.toString() === '1') { // belo horizonte
		newOptions = await newOptions.filter((obj) => obj.payload !== 'rua');
		newOptions = await newOptions.filter((obj) => obj.payload !== 'ong');
	} else if (cityId && cityId.toString() === '2') { // salvador
		newOptions = await newOptions.filter((obj) => obj.payload !== 'rua');
		newOptions = await newOptions.filter((obj) => obj.payload !== 'auto');
	}
	return { quick_replies: newOptions };
}

// only users that are on sisprep and combina can see the drpNaoTomei option
async function checkDeuRuimPrep(context, opt) {
	if (['sisprep', 'combina'].includes(context.state.user.voucher_type) === false) {
		opt.quick_replies = opt.quick_replies.filter((x) => x.payload !== 'drpNaoTomei');
	}
	return opt;
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
	checkMainMenu,
	checkMedication,
	autotesteOption,
	getErrorQR,
	buildButton,
	sendShare,
	checkDeuRuimPrep,
};
