const Sentry = require('@sentry/node');
const dialogFlow = require('apiai-promise');
const moment = require('moment');
const accents = require('remove-accents');

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

const cidadeDictionary = {
	1: 'Centro de Referência da Juventude – CRJ\nRua Guaicurus, 50, Centro (Praça da Estação, Belo Horizonte - MG)',
	2: 'Salvador - BA',
	3: 'Centro de Testagem e Aconselhamento Henfil\nRua Libero Badaró, 144, Anhangabaú. São Paulo - SP - CEP: 01008001',
};

const telefoneDictionary = { 1: '(31) 99726-9307', 2: '(71) 99102-2234', 3: '(11) 98209-2911' };
const emergenciaDictionary = { 1: '(31) 99726-9307', 2: '(71) 99102-2234', 3: '(11) 98209-2911' };
// "1": "Belo Horizonte - MG", "2": "Salvador - BA", "3": "São Paulo e Gde SP",
const locationDictionary = { 1: 'Belo Horizonte - MG', 2: 'Salvador - BA', 3: 'São Paulo - SP' };
const extraMessageDictionary = { 1: 'Centro de referência da juventude, Centro de BH', 2: 'Casarão da Diversidade, Pelourinho', 3: 'CTA Henfil, Centro de São Paulo' };

async function buildPhoneMsg(cityId, introText, phones) {
	const validOptions = ['1', '2', '3'];
	let text = '';
	if (introText && introText.length > 0) { // check i we have a msg to send together with the phone
		text = `${introText}\n`;
	}
	if (cityId && validOptions.includes(cityId.toString())) { // check if cityID is a valid option
		text += `\n${locationDictionary[cityId]}: ${phones[cityId]}`;
	} else { // if it isnt send every valid phone number
		validOptions.forEach((element) => { text += `\n${locationDictionary[element]}: ${phones[element]}`; });
	}

	return text;
}


async function formatHour(hour) {
	if (hour.toString().length === 1) { return `0${hour}`;	}
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

module.exports = {
	apiai: dialogFlow(process.env.DIALOGFLOW_TOKEN),
	Sentry,
	moment,
	capQR,
	formatDialogFlow,
	waitTypingEffect,
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
};
