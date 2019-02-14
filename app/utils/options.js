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
	marcarConsulta: {
		quick_replies: [
			{ content_type: 'text', title: 'Marcar Consulta', payload: 'getCity' },
			{ content_type: 'text', title: 'Voltar', payload: 'mainMenu' },
		],
	},
	desafio: {
		quick_replies: [
			{ content_type: 'text', title: 'Vamos!', payload: 'beginQuiz' },
			{ content_type: 'text', title: 'Agora não', payload: 'desafioRecusado' },
			{ content_type: 'text', title: 'Já Faço Parte', payload: 'joinToken' },
		],
	},
	asksDesafio: {
		quick_replies: [
			{ content_type: 'text', title: 'Vamos!', payload: 'beginQuiz' },
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
	TCLE: [{
		type: 'web_url',
		url: 'https://www.google.com',
		title: 'Ler Termos',
	}],
	sus: [
		{
			title: 'SUS em São Paulo',
			// subtitle: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/dstaids/index.php?p=245171',
			buttons: [
				{
					type: 'web_url',
					url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/dstaids/index.php?p=245171',
					title: 'Endereço de todas as unidades',
				},
				{
					type: 'web_url',
					url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/dstaids/index.php?p=245403',
					title: 'Para retirar camisinha',
				},
				{
					type: 'web_url',
					url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/dstaids/index.php?p=245409',
					title: 'Para testagem:',
				},
			],
		},
		{
			title: 'SUS em São Paulo de novo',
			buttons: [
				{
					type: 'web_url',
					url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/dstaids/index.php?p=245399',
					title: 'PEP',
				},
				{
					type: 'web_url',
					url: 'https://www.prefeitura.sp.gov.br/cidade/secretarias/saude/dstaids/index.php?p=248175',
					title: 'PREP',
				},
			],
		},
		{
			title: 'SUS na Bahia',
			buttons: [
				{
					type: 'web_url',
					url: 'http://www.aids.gov.br/pt-br/cedap-centro-estadual-especializado-em-diagnostico-assistencia-e-pesquisa',
					title: 'PREP e outras prevenções',
				},
				{
					type: 'web_url',
					url: 'http://www.aids.gov.br/pep_onde/index.html.',
					title: 'PEP',
				},
			],
		},

	],
	saidNo: {
		quick_replies: [
			{ content_type: 'text', title: 'Quero!', payload: 'joinResearch' },
			{ content_type: 'text', title: 'Não quero!', payload: 'noResearch' },
		],
	},
	saidYes: {
		quick_replies: [
			{ content_type: 'text', title: 'Li e Aceito', payload: 'Sign-getCity' },
			{ content_type: 'text', title: 'Li e Aceito', payload: 'Sign-verConsulta' },
			{ content_type: 'text', title: 'Não aceito', payload: 'naoAceito' }],
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
				{ content_type: 'text', title: 'Quero participar', payload: 'joinResearch' },
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
