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
		secure: true, // use SSL
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
	} catch (error) {
		console.log('Could not send mail to ', to);
		console.log(`Error seding mail to ${to} => `, error);
		Sentry.captureMessage('Error seding mail');
	}
}

module.exports = {
	sendMail,
};
