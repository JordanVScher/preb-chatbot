const Sentry = require('@sentry/node');
const moment = require('moment');
const accents = require('remove-accents');
const flow = require('./flow');

// Sentry - error reporting
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false });
moment.locale('pt-BR');

// separates string in the first dot on the second half of the string
async function separateString(someString) {
	if (someString.trim()[someString.length - 1] !== '.') { // trying to guarantee the last char is a dot so we never use halfLength alone as the divisor
		someString += '.'; // eslint-disable-line no-param-reassign
	}
	const halfLength = Math.ceil(someString.length / 2.5); // getting more than half the length (the bigger the denominator the shorter the firstString tends to be)
	const newString = someString.substring(halfLength); // get the second half of the original string
	const sentenceDot = new RegExp('(?<!www)\\.(?!com|br|rj|sp|mg|bh|ba|sa|bra|gov|org)', 'i');// Regex -> Don't consider dots present in e-mails and urls
	// getting the index (in relation to the original string -> halfLength) of the first dot on the second half of the string. +1 to get the actual dot.
	const dotIndex = halfLength + newString.search(sentenceDot) + 1;

	const firstString = someString.substring(0, dotIndex);
	const secondString = someString.substring(dotIndex);

	return { firstString, secondString };
}

async function formatDialogFlow(text) {
	let result = text.toLowerCase();
	result = await accents.remove(result);
	if (result.length >= 250) {
		result = result.slice(0, 250);
	}
	return result.trim();
}

// separate intent
const duvida = ['Diferença prep e pep', 'Como Pega Chato', 'Como Pega Clamidia', 'Como Pega Gonorreia', 'Como Pega Hepatite A', 'Como Pega Hepatite B', 'Como Pega HIV', 'Como Pega IST', 'Como Pega Sifilis', 'Sexo oral', 'Passivo ITS', 'Beijo IST', 'Engolir Semen', 'Sobre PREP', 'Sobre Chuca', 'Sobre Gouinage', 'Sobre Orientação Sexual', 'Sobre Orientacao Sexual', 'Quais Novidades', 'Sentido Da Vida', 'Me chupa', 'Manda Nudes', 'Espaço LGBT', 'Hipotenusa', 'Eu te amo']; // eslint-disable-line no-unused-vars
const problema = ['Tratamento IST', 'Tratamento HIV', 'Indetectavel Transmite', 'indetectável Transmite', 'Apresenta Sintoma', 'Tenho Ferida', 'Sera HIV', 'Alternativa camisinha', 'Camisinha Estourou', 'Sem Camisinha', 'Virgem Como Faco', 'Nunca Fiz Anal', 'Tenho HIV', 'Tenho HIV Contar Parceiro', 'tempo camisinha'];
const servico = ['Marcar Consulta', 'Abuso', 'Teste'];

async function separateIntent(intentName) {
	if (servico.includes(intentName)) { return 'serviço'; }
	if (problema.includes(intentName)) { return 'problema'; }
	return 'duvida';
}

// week day dictionary
const weekDayName = {
	0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo',
};
const weekDayNameLong = {
	0: 'Domingo', 1: 'Segunda-Feira', 2: 'Terça-Feira', 3: 'Quarta-Feira', 4: 'Quinta-Feira', 5: 'Sexta-Feira', 6: 'Sábado', 7: 'Domingo',
};

const siglaMap = { 1: 'MG', 2: 'BA', 3: 'SP' };

async function cidadeDictionary(cityID, cityType) {
	if (cityID.toString() === '1') return 'Centro de Referência da Juventude – CRJ\nRua Guaicurus, 50, Centro(Praça da Estação, Belo Horizonte - MG)';
	if (cityID.toString() === '2') return 'Casarão da Diversidade, Pelourinho\nR. do Tijolo, 8 - Centro, Salvador - BA, 40020-290';
	if (cityID.toString() === '3') { // SP has two locations, if we dont know the type send both locations, type 0 is a special case,
		const one = 'Casa 1 - Rua Adoniran Barbosa, 151 Bela Vista - São Paulo';
		const two = 'CTA Henfil - Rua Libero Badaró, 144 Anhangabau - São Paulo';
		if (cityType && cityType.toString() === '0') return 'Casa 1 q fica na Rua Adoniran Barbosa, 151 Bela Vista - São Paulo ou no CTA Henfil na Rua Libero Badaró, 144 Anhangabau - São Paulo.';
		if (cityType && cityType.toString() === '1') return one;
		if (cityType && cityType.toString() === '2') return two;
		return `${one} ou ${two}`;
	}

	return null;
}

const telefoneDictionary = { 1: '(31) 99726-9307', 2: '(71) 99102-2234 ou (71) 9.9640 9030', 3: '(11) 98209-2911' };
const emergenciaDictionary = { 1: '(31) 99726-9307', 2: '(71) 99102-2234 ou (71) 9.9640 9030', 3: '(11) 98209-2911' };

const locationDictionary = { 1: 'Belo Horizonte - MG', 2: 'Salvador - BA', 3: 'São Paulo - SP' };
const extraMessageDictionary = { 1: 'Centro de referência da juventude, Centro de BH', 2: 'Casarão da Diversidade, Pelourinho', 3: 'CTA Henfil, Centro de São Paulo' };

async function buildPhoneMsg(cityId, introText, phones, extraMsg) {
	const validOptions = ['1', '2', '3'];
	let text = '';

	if (introText && introText.length > 0) text = `${introText}\n`; // check if we have a msg to send together with the phone

	if (cityId && validOptions.includes(cityId.toString())) { // check if cityID is a valid option
		text += `\n${locationDictionary[cityId]}: ${phones[cityId]}`;
	} else { // if it isnt send every valid phone number
		validOptions.forEach((element) => { text += `\n${locationDictionary[element]}: ${phones[element]}`; });
	}

	if (extraMsg && extraMsg.length > 0) text += `\n\n${extraMsg}`; // check if we have a extra msg to send together with the phone

	return text;
}

async function buildContatoMsg(cityID) {
	let msg = '';
	msg += locationDictionary[cityID];
	msg += `\n\nTelefone: ${telefoneDictionary[cityID]}`;
	msg += `\nTelefone de Emergência: ${emergenciaDictionary[cityID]}`;
	msg += `\nEndereço: ${extraMessageDictionary[cityID]}`;

	return msg;
}

async function formatHour(hour) {
	if (hour.toString().length === 1) { return `0${hour}`; }
	return hour;
}

async function formatDate(date, hour) {
	const data = new Date(date);
	return `${weekDayNameLong[data.getDay()]}, ${await formatHour(data.getDate())} de ${moment(date).utcOffset('+0000').format('MMMM')} das ${hour.replace('-', 'as').replace(':00 ', ' ').slice(0, -3)}`;
}

async function checkSuggestWaitForTest(context, riscoText, autotesteText, autotesteOpt) {
	if (context.state.suggestWaitForTest === true) {
		await context.setState({ suggestWaitForTest: false });
		await context.sendText(autotesteText);
		await context.sendText(riscoText, autotesteOpt);
	} else {
		await context.sendText(autotesteText, autotesteOpt);
	}
}

function capQR(text) {
	let result = text;
	if (result.length > 20) {
		result = `${result.slice(0, 17)}...`;
	}
	return result;
}

function buildCidadeText(consulta) {
	let text = '';
	if (consulta.name) text += `${consulta.name} - `;
	if (consulta.street) text += consulta.street;
	if (consulta.number) text += `, ${consulta.number}`;
	if (consulta.district) text += ` ${consulta.district}`;
	if (consulta.complement) text += ` - ${consulta.complement}`;
	if (consulta.city) text += `. ${consulta.city}`;
	if (consulta.state) text += `, ${consulta.state}.`;

	return text;
}

function buildMail(context, tipo, dado) {
	let text = 'Olá, equipe PrEP.\n\n';
	text += 'O usuário <NOME>, deixou um contato para que nossa equipe entre em contato com ele(a).\n\n';
	text = text.replace('<NOME>', context.state.sessionUser.name);
	text += 'Segue abaixo os dados:\n\n';

	text += `Nome: ${context.state.sessionUser.name}\n`;
	if (context.state.user.integration_token) { text += `Voucher: ${context.state.user.integration_token}\n`; }
	if (tipo && dado) { text += `${tipo}: ${dado}\n`; }
	text += 'Assunto: Agendamento\n';

	return text;
}

function buildMailAutoTeste(context) {
	let text = 'Olá, equipe PrEP.\n\n';
	text += 'O usuário <NOME>, deixou um endereço e contato pedindo uma autoteste pelo correio.\n\n';
	text = text.replace('<NOME>', context.state.sessionUser.name);
	text += 'Segue abaixo os dados:\n\n';

	text += `Nome: ${context.state.sessionUser.name}\n`;
	if (context.state.user.integration_token) text += `Voucher: ${context.state.user.integration_token}\n`;
	if (context.state.autoCorreioEndereco) text += `Endereço: ${context.state.autoCorreioEndereco}\n`;
	if (context.state.autoCorreioContato) text += `Contatos: ${context.state.autoCorreioContato}\n`;

	text += 'Assunto: Autoteste por correio\n';

	return text;
}

function buildPhoneText(calendar, cidadeID) {
	let text = calendar ? calendar.phone : '';
	if (!text) text = telefoneDictionary[cidadeID];

	return text;
}

async function buildConsultaFinal(state, chosenHour) {
	let result = '';
	const phone = buildPhoneText(chosenHour.calendar, state.user.city);

	result += `🏠: ${buildCidadeText(chosenHour.calendar)}\n`;
	result += `⏰: ${await formatDate(chosenHour.datetime_start, chosenHour.time)}\n`;
	if (phone) result += `📞: ${phone}\n`;
	return result.trim();
}

async function getPhoneValid(phone) {
	const res = phone.replace(/[^0-9]+/ig, '');
	if (!res || !parseInt(res, 10)) return false;
	if (res.toString().length < 8 || res.toString().length > 13) return false;
	return res;
}

// add +55 and DDD to phone
async function formatPhone(phone, cityID) {
	const DDDs = { 1: '31', 2: '71', 3: '11' };
	let res = phone;
	if (res.slice(0, 2) !== '55' && res.slice(0, 3) !== '+55') res = `+55${res}`;
	if (res.slice(0, 2) === '55') res = `+${res}`;

	const DDD = DDDs[cityID] || '';
	if (res.slice(3, 5) !== DDD) res = res.slice(0, 3) + DDD + res.slice(3);

	return res;
}

const buildLabels = (labels) => (labels ? { system_labels: labels } : {});

async function removeTimezone(date) {
	const offset = date.getTimezoneOffset();
	const hours = offset / 60;

	date.setHours(date.getHours() - hours);
	return date;
}

async function buildAlarmeMsg(user) {
	let msg = '';
	let when;
	let interval;

	if (user.prep_reminder_before) {
		when = 'antes';
		interval = user.prep_reminder_before_interval || null;
	} else if (user.prep_reminder_after) {
		when = 'depois';
		interval = user.prep_reminder_after_interval || null;
	}

	if (when) {
		msg = flow.alarmePrep.cancelarConfirma.text1.replace('<WHEN>', when);
		if (interval && typeof interval === 'string') msg = msg.replace('.', `, às ${interval.slice(0, 5)}.`);
	}

	return msg;
}

async function checkValidAddress(address) {
	if (!address || typeof address !== 'string') return false;
	if (address.length < 8) return false;
	if (/\d/.test(address) === false) return false;
	if (/[a-zA-Z]/.test(address) === false) return false;

	return address;
}

async function buildCombinaCidadeMsg() {
	return '📞: (00)00000-0000';
}


module.exports = {
	Sentry,
	moment,
	capQR,
	formatDialogFlow,
	formatDate,
	weekDayName,
	cidadeDictionary,
	telefoneDictionary,
	locationDictionary,
	buildPhoneMsg,
	emergenciaDictionary,
	separateIntent,
	separateString,
	extraMessageDictionary,
	checkSuggestWaitForTest,
	buildMail,
	buildMailAutoTeste,
	buildConsultaFinal,
	getPhoneValid,
	buildContatoMsg,
	buildLabels,
	accents,
	siglaMap,
	formatPhone,
	buildCidadeText,
	removeTimezone,
	buildAlarmeMsg,
	checkValidAddress,
	buildCombinaCidadeMsg,
};
