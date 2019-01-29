const Sentry = require('@sentry/node');
const dialogFlow = require('apiai-promise');
const moment = require('moment');
const accents = require('remove-accents');

// Sentry - error reporting
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false });
moment.locale('pt-BR');

async function formatDialogFlow(text) {
	let result = text.toLowerCase();
	result = await result.replace(/([\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF])/g, '');
	result = await accents.remove(result);
	if (result.length >= 250) {
		result = result.slice(0, 250);
	}
	return result.trim();
}

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

const weekDayName = { // simple week day dictionary
	0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo',
};

module.exports.Sentry = Sentry;
module.exports.apiai = dialogFlow(process.env.DIALOGFLOW_TOKEN);
module.exports.moment = moment;
module.exports.formatDialogFlow = formatDialogFlow;
module.exports.waitTypingEffect = waitTypingEffect;
module.exports.formatDate = formatDate;
module.exports.formatInitialDate = formatInitialDate;
module.exports.weekDayName = weekDayName;
