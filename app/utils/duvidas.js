const flow = require('./flow');
const { getQR } = require('./attach');
const { sendMain } = require('./mainMenu');
const { falarComHumano } = require('./mainMenu');
const help = require('./helper');


async function prepDuvidaFollowUp(context) {
	switch (context.state.user.voucher_type) {
	case 'sisprep':
		await falarComHumano(context, null, flow.duvidasPrep.followUpSisPrep);
		break;
	case 'combina':
		await context.sendText(flow.duvidasPrep.followUpCombina);
		await sendMain(context);
		break;
	case 'sus':
		await context.sendText(flow.duvidasPrep.followUpSUS);
		await sendMain(context);
		break;
	default:
		await sendMain(context);
		break;
	}

	// antigo followUp da dúvida
	// if (context.state.user.voucher_type === 'sus') {
	// 	let text = flow.duvidasPrep.textosSUS[context.state.user.city];
	// 	if (!text) text = flow.duvidasPrep.demaisLocalidades;
	// 	if (text) await context.sendText(flow.duvidasPrep.prefixSUS + text);
	// 	await sendMain(context);
	// } else {
	// 	await falarComHumano(context, null, flow.duvidasPrep.notSUS);
	// }
}

async function alarmeConfigurar(context) {
	if (context.state.user.voucher_type === 'combina') {
		await context.sendText(flow.alarmePrep.comoTomando, await getQR(flow.alarmePrep.comoTomandoBtn));
	} else {
		await context.sendText(flow.alarmePrep.comoAjudo, await getQR(flow.alarmePrep.comoAjudoBtn));
	}
}

async function alarmeHorario(page = 1, btnParam, textType = 1) {
	if (page < 0) { page = 2; }
	if (page > 2) { page = 0; }


	const opts = [];
	let pivot = page * 8;
	opts.push({ content_type: 'text', title: 'Mais Cedo', payload: `page${btnParam}${page - 1}` });

	for (let i = 1; i <= 8; i++) {
		let title = null;
		if (textType === 1) title = pivot === 1 ? `À ${pivot}` : `Às ${pivot}`;
		if (textType === 2 && pivot > 0) title = pivot === 1 ? `${pivot} hora antes` : `${pivot} horas antes`;

		if (title) opts.push({ content_type: 'text', title, payload: `${btnParam}${pivot}` });
		pivot += 1;
	}
	opts.push({ content_type: 'text', title: 'Mais Tarde', payload: `page${btnParam}${page + 1}` });

	return { quick_replies: opts };
}

async function alarmeMinuto(hora, btnParam) {
	const opts = [];
	let minutos = '00';

	while (minutos < 60) {
		opts.push({ content_type: 'text', title: `Às ${hora}:${minutos}`, payload: `${btnParam}${minutos}` });
		minutos = parseInt(minutos, 10) + 10;
	}

	return { quick_replies: opts };
}

async function receivePage(context) {
	const payload = context.state.lastQRpayload.replace('page', '');
	const nextDialog = context.state.pageKey;
	const newPage = payload.replace(nextDialog, '');

	await context.setState({ alarmePage: newPage, dialog: nextDialog });
}

async function buildChoiceTimeStamp(hour, minutes) {
	let ts = new Date();
	ts.setHours(hour || 0);
	ts.setMinutes(minutes || 0);
	ts.setSeconds(0);
	ts.setMilliseconds(0);

	ts = await help.removeTimezone(ts);
	return { date: ts, string: ts.toISOString().split('T')[1].replace('Z', '') };
}

async function formatDate(text) {
	const dateRegex = new RegExp(/^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|(([1][26]|[2468][048]|[3579][26])00))))$/g); // eslint-disable-line
	const isValid = dateRegex.test(text);
	if (!isValid) return false;

	const dateObject = help.moment(text, 'DD/MM/YYYY');
	const data = dateObject.toDate();
	if (data instanceof Date && !isNaN(data)) return data; // eslint-disable-line no-restricted-globals
	return false;
}

async function checkDate(date) {
	const today = help.moment(new Date());
	const data = help.moment(date);

	const dataAfterToday = data.isAfter(today);
	if (dataAfterToday === true) return 'A data da consulta passada não pode ser depois de hoje.';

	const monthDiff = data.diff(today, 'months');
	if (monthDiff < -6) return 'A data da sua consulta passada não pode ser de mais de 6 meses atrás.';

	const daysDiff = data.diff(today, 'days');
	if (daysDiff > -15) return true; // data só é válida se aconteceu antes de 15 dias

	return date;
}

async function alarmeDate(context) {
	let date = await formatDate(context.state.whatWasTyped);
	if (date) date = await checkDate(date);
	if (!date || typeof date === 'string') {
		await context.sendText(`${flow.alarmePrep.alarmeAcabar.invalid} ${date || ''}`);
		await context.setState({ dialog: 'alarmeAcabar' });
	} else if (typeof date === 'boolean') {
		await context.setState({ dialog: 'alarmeConfirmaData' });
	} else {
		await context.setState({ dialog: 'alarmeAcabarFrascos', dataUltimaConsulta: date });
	}

	return date;
}

async function alarmeSemMedicacao(context) {
	await context.sendText(flow.alarmePrep.alarmeSemMedicacao);
	if (context.state.user.voucher_type === 'combina') {
		await context.sendText(flow.alarmePrep.alarmeSemMedicacaoExtra);
	}
	await sendMain(context);
}

async function buildTestagem(cityID, newRule) {
	const { types } = flow.testagem;
	const rules = newRule || flow.testagem.rules[cityID];
	let msg = '';
	const opt = [];

	Object.keys(types).forEach((e) => {
		if (rules && rules.includes(e) && types[e]) {
			if (types[e].msg) msg += `${types[e].msg}\n\n`;
			if (types[e].opt) opt.push(types[e].opt);
		}
	});

	return { msg: msg.trim(), opt: { quick_replies: opt } };
}

async function sendAutotesteMsg(context) {
	await context.setState({ testagem: await buildTestagem(context.state.user.city) });
	if (context.state.testagem && context.state.testagem.msg && context.state.testagem.opt) {
		await context.sendText(flow.testagem.text1);
		await context.sendText(context.state.testagem.msg);
		await context.sendText(flow.testagem.text2, context.state.testagem.opt);
	}
}

async function buildServicoInfo(cityID = '', cityType = '') {
	let text = '';

	const address = await help.cidadeDictionary(cityID.toString(), cityType.toString());
	if (address) text += `Endereço: ${address}\n`;

	const phone = help.telefoneDictionary[cityID];
	if (phone) text += `Telefone: ${phone}`;

	return text;
}


async function sendAutoServicoMsg(context, cityType) {
	await context.setState({ autotesteServicoMsg: await buildServicoInfo(context.state.user.city, cityType) });
	if (context.state.autotesteServicoMsg) await context.sendText(context.state.autotesteServicoMsg);
	await context.sendText(flow.autoteste.autoServicoEnd);
	await sendMain(context);
}

async function autotesteServico(context) {
	if (context.state.user.voucher_type === 'combina') {
		await context.sendText(flow.autoteste.autoServicoCombina);
		await sendMain(context);
	} else if (context.state.user.city.toString() === '3') {
		await context.sendText(flow.autoteste.autoServicoSisprepSP, await getQR(flow.autoteste.autoServicoSisprepSPBtn));
	} else {
		await sendAutoServicoMsg(context);
	}
}

async function sendAlarmeIntro(context, btn, hasAlarm) {
	if (hasAlarm) {
		await context.sendText(flow.alarmePrep.hasAlarm, btn);
	} else {
		await context.sendText(flow.alarmePrep.noAlarm, btn);
	}
}

async function alarmeCancelar(context, { id }) {
	if (id) {
		await context.sendText(flow.alarmePrep.alarmeCancelarSuccess);
	} else {
		await context.sendText(flow.alarmePrep.alarmeCancelarFailure);
	}
	await sendMain(context);
}

module.exports = {
	prepDuvidaFollowUp,
	alarmeConfigurar,
	alarmeHorario,
	alarmeMinuto,
	buildChoiceTimeStamp,
	receivePage,
	formatDate,
	checkDate,
	alarmeDate,
	buildTestagem,
	sendAutotesteMsg,
	buildServicoInfo,
	autotesteServico,
	sendAutoServicoMsg,
	sendAlarmeIntro,
	alarmeCancelar,
	alarmeSemMedicacao,
};
