require('dotenv').config();
const nodemailer = require('nodemailer');
const { Sentry } = require('./helper');


const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;
const host = process.env.MAIL_HOST;
const port = process.env.MAIL_PORT;
const service = process.env.MAIL_SERVICE;
const from = process.env.MAIL_FROM;

const mails = {
	1: process.env.MAILCONTATO1,
	2: process.env.MAILCONTATO2,
	3: process.env.MAILCONTATO3,
};

const transporter = nodemailer.createTransport({
	service,
	host,
	port,
	auth: {
		user,
		pass,
	},
	tls: { rejectUnauthorized: false },
	debug: true,
});


async function sendMail(subject, text, cityId) {
	let to = '';

	if (process.env.ENV === 'prod') {
		to = mails[cityId];
	} else {
		to = process.env.MAILTESTE;
	}

	const options = {
		from, to, subject, text,
	};

	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
	} catch (err) {
		console.log(`Error seding mail to ${to} => `, err);
		Sentry.captureMessage('Error sending mail');
	}
}

async function sendMailError(msg, double) {
	const text = double ? msg.replace(/(?:\r\n|\r|\n)/g, '\n\n') : msg;
	const to = process.env.MAILERROR.split(',');
	const subject = `Erro no Prep - ${process.env.ENV}`;
	const options = {
		from, to, subject, text,
	};

	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
	} catch (err) {
		console.log(`Error sending mail to ${to} => `, err);
		Sentry.captureMessage('Error sending error mail');
	}
}

async function sentryError(msg) {
	console.log(msg);
	if (process.env.ENV !== 'local') {
		await Sentry.captureMessage(msg);
		await sendMailError(msg, true);
	}
	return false;
}

module.exports = {
	sendMail, sendMailError, sentryError,
};
