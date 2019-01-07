const Sentry = require('@sentry/node');
const dialogFlow = require('apiai-promise');
const moment = require('moment');

// Sentry - error reporting
Sentry.init({
	dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false,
});
module.exports.Sentry = Sentry;

// Dialogflow
module.exports.apiai = dialogFlow(process.env.DIALOGFLOW_TOKEN);

module.exports.waitTypingEffect = async (context, waitTime = 2500) => {
	await context.typingOn();
	setTimeout(async () => {
		await context.typingOff();
	}, waitTime);
};


moment.locale('pt-BR');
module.exports.moment = moment;

function formatDate(date) {
	return `${moment(date).format('dddd')}, ${moment(date).format('D')} de ${moment(date).format('MMMM')} às ${moment(date).format('hh:mm')}`;
}

module.exports.formatDate = formatDate;
