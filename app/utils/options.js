module.exports = {
	greetings: {
		quick_replies: [
			{ content_type: 'text', title: 'Sobre a Amanda', payload: 'aboutAmandaA' },
			{ content_type: 'text', title: 'Continuar', payload: 'desafio' }],
	},
	aboutAmandaA: { quick_replies: [{ content_type: 'text', title: 'Entendi', payload: 'desafio' }] },
	aboutAmandaB: { quick_replies: [{ content_type: 'text', title: 'Entendi', payload: 'mainMenu' }] },
	mainMenu: {
		quick_replies: [
		// { content_type: 'url', title: 'Sim, conta mais!', payload: 'Alimentação - Conta mais' },
			// { content_type: 'text', title: 'Ver eventos', payload: 'seeEvent' },
			// { content_type: 'text', title: 'Meus eventos', payload: 'myEvent' },
			// { content_type: 'text', title: 'Marcar Evento', payload: 'setEventDate' },
			{ content_type: 'text', title: 'Prevenções', payload: 'prevencao' },
			{ content_type: 'text', title: 'Bater Papo', payload: 'baterPapo' },
			{ content_type: 'text', title: 'CTA', payload: 'cta' },
			{ content_type: 'text', title: 'Sobre Amanda Selfie', payload: 'aboutAmandaB' },
		],
	},
	desafio: {
		quick_replies: [
			{ content_type: 'text', title: 'Desafio Aceito', payload: 'desafioAceito' },
			{ content_type: 'text', title: 'Agora não', payload: 'mainMenu' },
		],
	},

};
