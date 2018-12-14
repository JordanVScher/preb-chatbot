require('dotenv').config();

const { MessengerClient } = require('messaging-api-messenger');
const config = require('../bottender.config').messenger;

console.log(config);

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

async function createGetStarted() { // eslint-disable-line no-unused-vars
	console.log(await client.setGetStarted('greetings'));
	console.log(await client.setGreeting([{
		locale: 'default',
		text: 'Oi, clique em começar',
	}]));
}

async function createPersistentMenu() { // eslint-disable-line no-unused-vars
	console.log(await client.setPersistentMenu([
		{
			locale: 'default',
			call_to_actions: [
				{
					type: 'postback',
					title: 'Ir para o início',
					payload: 'greetings',
				},
				{
					type: 'web_url',
					title: 'Example site',
					url: 'http://www.google.com/',
				},
				// {
				// 	type: 'nested',
				// 	title: 'Menus',
				// 	call_to_actions: [
				// 		{
				// 			type: 'postback',
				// 			title: 'opt1',
				// 			payload: 'opt1',
				// 		},
				// 		{
				// 			type: 'postback',
				// 			title: 'opt2',
				// 			payload: 'opt2',
				// 		},
				// 	],
				// },
			],
		},
	]));
}

// Each of these functions should be ran from the terminal, with all changes being made right here on the code
// if there's an error just run it again
// Run it => node util/postback.js
createGetStarted();
createPersistentMenu();
