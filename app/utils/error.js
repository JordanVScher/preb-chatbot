const { Sentry } = require('./helper');
const { sendMailError } = require('./mailer');


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
	if (res) msg += `\nResposta: ${JSON.stringify(res, null, 2)}`;
	if (err) msg += `\nErro: ${err.stack}`;

	console.log('----------------------------------------------', `\n${msg}`, '\n\n');

	if ((res && (res.error || res.form_error)) || (!res && err)) {
		if (process.env.ENV !== 'local') {
			msg += `\nEnv: ${process.env.ENV}`;
			await	Sentry.captureMessage(msg);
			await sendMailError(msg);
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

module.exports = {
	handleRequestAnswer,
	buildNormalErrorMsg,
	Sentry,
};
