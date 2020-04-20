const { Sentry } = require('./helper');
const { sendHTMLMail } = require('./mailer');

async function buildNormalErrorMsg(nome, err, state) {
	const date = new Date();
	let text = `Parece que aconteceu um erro as ${date.toLocaleTimeString('pt-BR')} de ${date.getDate()}/${date.getMonth() + 1} com ${nome} em ${process.env.ENV}=>`;

	if (err) { text += `\n\n\nErro:\n${err}`; }
	console.log(text);
	if (state) { text += `\n\n\nEstado:\n${JSON.stringify(state, null, 2)}`; }

	return text;
}


async function handleErrorApi(options, res, err) {
	let msg = `Endereço: ${options.host}`;
	msg += `\nPath: ${options.path}`;
	msg += `\nQuery: ${JSON.stringify(options.query, null, 2)}`;
	msg += `\nMethod: ${options.method}`;
	msg += `\nMoment: ${new Date()}`;
	if (res) msg += `\nResposta: ${JSON.stringify(res, null, 2)}`;
	if (err) msg += `\nErro: ${err.stack}`;

	console.log('----------------------------------------------', `\n${msg}`, '\n\n');

	if ((res && (res.error || res.form_error)) || (!res && err)) {
		if (process.env.ENV !== 'local') {
			msg += `\nEnv: ${process.env.ENV}`;
			await	Sentry.captureMessage(msg);
		}
	}
}


async function handleRequestAnswer(response) {
	try {
		const res = await response.json();
		await handleErrorApi(response.options, res, false);
		return res;
	} catch (error) {
		await handleErrorApi(response.options, false, error);
		return {};
	}
}

async function sentryError(msg, err) {
	let erro;
	if (typeof err === 'string') {
		erro = err;
	} else if (err && err.stack) {
		erro = err.stack;
	}

	if (process.env.ENV !== 'local') {
		Sentry.captureMessage(msg);
		await sendHTMLMail(`Erro no PREP - AMANDASELFIE - ${process.env.ENV || ''}`, process.env.MAILERROR, `${msg || ''}\n\n${erro}`);
		console.log(`Error sent at ${new Date()}!\n `);
		console.log(`${msg} => ${erro}`);
	}
	return false;
}

module.exports = {
	handleRequestAnswer,
	buildNormalErrorMsg,
	Sentry,
	sentryError,
};
