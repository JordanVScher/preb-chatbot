const { CronJob } = require('cron');
const { notificacaoOfertaPesquisa } = require('./notificacao');
const { sentryError } = require('./app/utils/error');


const ofertaPesquisaNotification = new CronJob(
	'00 0/15  8-22  * * *', async () => {
		try {
			await notificacaoOfertaPesquisa();
		} catch (error) {
			console.log('ofertaPesquisaNotification error', error);
			await sentryError('Error on ofertaPesquisaNotification', error);
		}
	}, (() => { console.log('Crontab ofertaPesquisaNotification stopped.'); }),
	true, 'America/Sao_Paulo', false, false,
);


async function cronLog() {
	console.log(`Crontab ofertaPesquisaNotification is running? => ${ofertaPesquisaNotification.running}`);
}

module.exports = { cronLog };
