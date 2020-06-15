const { MessengerClient } = require('messaging-api-messenger');
const { sentryError } = require('./helper');

const config = require('../../bottender.config').channels.messenger;

const client = MessengerClient.connect({
	accessToken: config.accessToken,
	appSecret: config.appSecret,
});

async function sendBroadcast(USER_ID, textMsg, buttons) {
	if (!USER_ID) return { error: 'no USER_ID' };
	try {
		const res = await client.sendText(USER_ID, textMsg, buttons).then(() => null).catch((err) => err);
		return res;
	} catch (err) {
		sentryError(`Erro no broadcast para ${USER_ID}!`, err);
		return err;
	}
}

module.exports = { sendBroadcast };
