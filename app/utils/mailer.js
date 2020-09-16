require('dotenv').config();
const nodemailer = require('nodemailer');


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

const correioMails = {
	0: process.env.MAILCORREIO0,
	1: process.env.MAILCORREIO1,
	2: process.env.MAILCORREIO2,
	3: process.env.MAILCORREIO3,
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
		console.log('sendMailError', text);
	} catch (err) {
		console.log(`Error sending mail to ${to} => `, err);
	}
}


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
		await sendMailError(`Error seding mail to ${to} => \n\n`, console.log(JSON.stringify(err, null, 2)));
	}
}

async function sendMailCorreio(subject, text, cityId, eMail) {
	let to = '';

	if (eMail) to = eMail;
	if (!to) {
		if (process.env.ENV === 'prod' || process.env.ENV === 'homol') {
			to = correioMails[cityId];
		if (!to) to = correioMails[0]; // eslint-disable-line
		} else {
			to = process.env.MAILTESTE;
		}
	}

	const options = {
		from, to, subject, text,
	};

	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
	} catch (err) {
		await sendMailError(`Error seding mail to ${to} => \n\n`, console.log(JSON.stringify(err, null, 2)));
	}
}

async function sendHTMLMail(subject, to, html, anexo) {
	const options = {
		from, to, subject, html, attachments: anexo,
	};


	try {
		const info = await transporter.sendMail(options);
		console.log(`'${subject}' para ${to}:`, info.messageId);
	} catch (err) {
		await sendMailError(`Error seding mail to ${to} => \n\n`, console.log(JSON.stringify(err, null, 2)));
	}
}

module.exports = {
	sendMail, sendMailError, sendHTMLMail, sendMailCorreio,
};
