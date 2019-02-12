module.exports = {
	greetings: {
		quick_replies: [
			{ content_type: 'text', title: 'Quiz', payload: 'beginQuiz' },
			{ content_type: 'text', title: 'Marcar Consulta', payload: 'getCity' },
			{ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' },
		],
	},
	verConsulta: {
		quick_replies: [
			{ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' },
		],
	},
	desafio: {
		quick_replies: [
			{ content_type: 'text', title: 'Desafio Aceito', payload: 'beginQuiz' },
			{ content_type: 'text', title: 'Agora não', payload: 'desafioRecusado' },
			{ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' },
		],
	},
	asksDesafio: {
		quick_replies: [
			{ content_type: 'text', title: 'Desafio Aceito', payload: 'beginQuiz' },
			{ content_type: 'text', title: 'Agora não', payload: 'desafioRecusado' },
			{ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' },
		],
	},
	desafioAceito: {
		quick_replies: [
			{ content_type: 'text', title: 'Começar!', payload: 'beginQuiz' },
			{ content_type: 'text', title: 'Agora não', payload: 'desafioRecusado' },
		],
	},
	consulta: {
		quick_replies: [
			{ content_type: 'text', title: 'Marcar Consulta', payload: 'getCity' },
			{ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' },
		],
	},
	mainMenu: {
		quick_replies: [
			{ content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' },
			{ content_type: 'text', title: 'Prevenções', payload: 'seePreventions' },
			{ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' },
			{ content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmanda' },
		],
	},
	joinToken: {
		quick_replies: [
			{ content_type: 'text', title: 'Não tenho token', payload: 'mainMenu' },
		],
	},
	artigoLink: [{
		type: 'web_url',
		url: 'https://www.google.com',
		title: 'Ler artigo',
	}],
	questionario: [{
		type: 'web_url',
		url: 'https://www.google.com',
		title: 'Ir ao Questionário',
	}],
	saidNo: {
		quick_replies: [
			{ content_type: 'text', title: 'Quero!', payload: 'joinResearch' },
			{ content_type: 'text', title: 'Não quero!', payload: 'noResearch' },
		],
	},
	saidYes: {
		quick_replies: [
			{ content_type: 'text', title: 'Marcar Consulta', payload: 'getCity' },
			{ content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' }],
	},
	prevention: {
		quick_replies: [
			{ content_type: 'text', title: 'Entendi', payload: 'preventionEnd' },
		],
	},
	consultaFail: {
		quick_replies: [
			{ content_type: 'text', title: 'Tentar de Novo', payload: 'getCity' },
			{ content_type: 'text', title: 'Cancelar', payload: 'mainMenu' },
		],
	},
	answer: {
		sendQuiz: {
			quick_replies: [
				{ content_type: 'text', title: 'Vamos lá', payload: 'beginQuiz' },
				{ content_type: 'text', title: 'Agora não', payload: 'mainMenu' },
			],
		},
		sendResearch: {
			quick_replies: [
				{ content_type: 'text', title: 'Tudo bem', payload: 'joinResearch' },
				{ content_type: 'text', title: 'Não quero', payload: 'noResearch' },
			],
		},
		isPrep: {
			quick_replies: [
				{ content_type: 'text', title: 'Sim', payload: 'triagem' },
				{ content_type: 'text', title: 'Não', payload: 'sendFollowUp' },
			],
		},
		sendConsulta: {
			quick_replies: [
				{ content_type: 'text', title: 'Marcar Consulta', payload: 'getCity' },
				// { content_type: 'text', title: 'Ver Consulta', payload: 'verConsulta' },
				{ content_type: 'text', title: 'Voltar', payload: 'mainMenu' },
			],
		},
	},

};
