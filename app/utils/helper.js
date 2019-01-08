const Sentry = require('@sentry/node');
const dialogFlow = require('apiai-promise');
const moment = require('moment');

// Sentry - error reporting
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false });
moment.locale('pt-BR');

async function waitTypingEffect(context, waitTime = 2500) {
	await context.typingOn();
	setTimeout(async () => {
		await context.typingOff();
	}, waitTime);
}

function formatDate(date) {
	return `${moment(date).format('dddd')}, ${moment(date).format('D')} de ${moment(date).format('MMMM')} às ${moment(date).format('hh:mm')}`;
}

function formatInitialDate(date) {
	date.setMinutes(0);
	date.setSeconds(0);
	// date.setMilliseconds(0); // already ignored because of moment.js' date to timestamp conversion
	date.setHours(date.getHours() + 1);
	return date;
}


module.exports.Sentry = Sentry;
module.exports.apiai = dialogFlow(process.env.DIALOGFLOW_TOKEN);
module.exports.moment = moment;
module.exports.waitTypingEffect = waitTypingEffect;
module.exports.formatDate = formatDate;
module.exports.formatInitialDate = formatInitialDate;
