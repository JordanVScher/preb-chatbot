
const { withTyping } = require('bottender');
const { getPoliticianData } = require('./app/chatbot_api');

const messageWaiting = eval(process.env.WITH_TYPING); // eslint-disable-line no-eval

const mapPageToAccessToken = async (pageId) => {
	const perfilData = await getPoliticianData(pageId);
	return perfilData && perfilData.fb_access_token ? perfilData.fb_access_token : process.env.ACCESS_TOKEN;
};

module.exports = {
	channels: {
		messenger: {
			enabled: true,
			path: '/webhooks/messenger',
			pageId: process.env.MESSENGER_PAGE_ID,
			accessToken: process.env.MESSENGER_ACCESS_TOKEN,
			appId: process.env.MESSENGER_APP_ID,
			appSecret: process.env.MESSENGER_APP_SECRET,
			verifyToken: process.env.MESSENGER_VERIFY_TOKEN,
			mapPageToAccessToken,
		},
	},

	session: {
		driver: 'file',
		stores: {
			file: {
				dirname: '.sessions',
			},
		},
	},

	plugins: [withTyping({ delay: messageWaiting || 0 })],
};
