const Sentry = require('@sentry/node');
const moment = require('moment');
const accents = require('remove-accents');
const encodeUrl = require('encodeurl');
const flow = require('./flow');

// Sentry - error reporting
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.ENV, captureUnhandledRejections: false });
moment.locale('pt-BR');

// separates string in the first dot on the second half of the string
async function separateString(someString) {
	let removeLastChar = false;
	if (someString.trim()[someString.length - 1] !== '.') { // trying to guarantee the last char is a dot so we never use halfLength alone as the divisor
		someString += '.'; // eslint-disable-line no-param-reassign
		removeLastChar = true;
	}
	const halfLength = Math.ceil(someString.length / 2.5); // getting more than half the length (the bigger the denominator the shorter the firstString tends to be)
	const newString = someString.substring(halfLength); // get the second half of the original string
	const sentenceDot = new RegExp('(?<!www|sr|sra|mr|mrs|srta|srto)\\.(?!com|br|rj|sp|mg|bh|ba|sa|bra|gov|org)', 'i');// Regex -> Don't consider dots present in e-mails and urls
	// getting the index (in relation to the original string -> halfLength) of the first dot on the second half of the string. +1 to get the actual dot.
	const dotIndex = halfLength + newString.search(sentenceDot) + 1;

	let firstString = someString.substring(0, dotIndex);
	let secondString = someString.substring(dotIndex);

	// if we added a dot on the last char, remove it
	if (removeLastChar && !secondString) firstString = firstString.slice(0, -1);
	if (removeLastChar && secondString) secondString = secondString.slice(0, -1);

	return { firstString, secondString };
}

function buildWhatsappLink(phone, msg) {
	if (!phone || !msg) return null;
	const template = 'https://api.whatsapp.com/send?phone=<PHONE>&text=<TEXT>';
	const res = [];

	const format = phone.replace(/[^a-zA-Z0-9]/g, '');
	const phones = format.split('ou');
	const newMessage = encodeUrl(msg);

	phones.forEach((e) => {
		let aux = template;
		aux = aux.replace('<PHONE>', `55${e}`).replace('<TEXT>', newMessage);
		res.push(aux);
	});

	return res.join('\nou\n');
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

async function horarioDictionary(cityID, cityType) {
	if (cityID.toString() === '1') return 'segundas feira das 17h as 19h e terças feira das 16h as 18h';
	if (cityID.toString() === '2') return '9h30m até 16h';
	if (cityID.toString() === '3') { // SP has two locations, if we dont know the type send both locations, type 0 is a special case,
		const one = 'manda um zap pra gente marcar o melhor horário para a retirada do seu autoteste.';
		const two = '10h as 19h de segunda a sexta';
		if (cityType && cityType.toString() === '1') return one;
		if (cityType && cityType.toString() === '2') return two;
		return `${one} ou ${two}`;
	}

	return null;
}
const instagramDictionary = { 1: '@nodeumatch', 2: '@preparasalvador', 3: '@vcprepsp' };

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
		const whatsapp = buildWhatsappLink(phones[cityId], flow.whatsappText.agendamento);
		if (whatsapp) text += `\nWhatsapp: ${whatsapp}`;
	} else { // if it isnt send every valid phone number
		validOptions.forEach((element) => { text += `\n${locationDictionary[element]}: ${phones[element]}`; });
	}

	if (extraMsg && extraMsg.length > 0) text += `\n\n${extraMsg}`; // check if we have a extra msg to send together with the phone

	return text;
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
	text = text.replace('<NOME>', context.state.name);
	text += 'Segue abaixo os dados:\n\n';

	text += `Nome: ${context.state.name}\n`;
	if (context.state.user.integration_token) { text += `Voucher: ${context.state.user.integration_token}\n`; }
	if (tipo && dado) { text += `${tipo}: ${dado}\n`; }
	text += 'Assunto: Agendamento\n';

	return text;
}

function buildMailAutoTeste(context) {
	let text = 'Olá, equipe PrEP.\n\n';
	text += 'O usuário <NOME>, deixou um endereço e contato pedindo uma autoteste pelo correio.\n\n';
	text = text.replace('<NOME>', context.state.name);
	text += 'Segue abaixo os dados:\n\n';

	text += `Nome: ${context.state.name}\n`;
	if (context.state.user.phone) text += `Telefone: ${context.state.user.phone}\n`;
	if (context.state.user.instagram) text += `Instagram: ${context.state.user.instagram}\n`;
	if (context.state.user.integration_token) text += `Voucher: ${context.state.user.integration_token}\n`;
	if (context.state.autoCorreioEndereco) text += `Endereço: ${context.state.autoCorreioEndereco}\n`;
	if (context.state.autoCorreioContato) text += `Contato: ${context.state.autoCorreioContato}\n`;

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
	let whatsapp = '';
	const phone = buildPhoneText(chosenHour.calendar, state.user.city);
	if (phone) whatsapp = buildWhatsappLink(phone, flow.whatsappText.agendamento);


	result += `🏠: ${buildCidadeText(chosenHour.calendar)}\n`;
	result += `⏰: ${await formatDate(chosenHour.datetime_start, chosenHour.time)}\n`;
	if (phone) result += `📞: ${phone}\n`;
	if (whatsapp) result += `Whatsapp: ${whatsapp}`;
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

function getTomarHoras(context) {
	const { user } = context.state;
	if (!user || !user.combina_reminder_hours_before || typeof user.combina_reminder_hours_before !== 'string') return '';
	return user.combina_reminder_hours_before.slice(0, 5);
}

const combinaCityDictionary = {
	1: `CRT São Paulo`,
	2: 'Campos Elíseos - SP',
	3: 'Fortaleza',
	4: 'Porto Alegre',
	5: 'Ribeirão Preto',
	6: 'Curitiba',
};

const combinaContactDictionary = {
	1: '(11) 94005-0601', //	CRT São Paulo
	2: '(11) 94701-5901', //	Campos Elíseos - SP
	3: '(85) 94701-5248', //	Fortaleza
	4: '(54) 94701-4561', //	Porto Alegre
	5: '(16) 94701-6803', //	Ribeirão Preto
	6: '(41) 94007-0011', //	Curitiba
};

const combinaText = {
	1: `\n\nCRT São Paulo: 📞 (11) 3896-1200\nEndereço: 🏠 Av. Dr. Arnaldo, 165 - Pacaembu, São Paulo - SP, 01246-900`, //	CRT São Paulo
	2: '\n\nCampos Elíseos - SP: 📞 (11) 3896-1200\nEndereço: 🏠 Av. Dr. Arnaldo, 165 - Pacaembu, São Paulo - SP, 01246-900', //	Campos Elíseos - SP
	3: '\n\nFortaleza: 📞 (85) 3101-2352\nEndereço: 🏠 R. Nestor Barbosa, 315 - Parquelândia, Fortaleza - CE, 60455-610', //	Fortaleza
	4: '\n\nPorto Alegre: 📞 (51) 3314-5200\nEndereço: 🏠 R. Mostardeiro, 17 - Rio Branco, Porto Alegre - RS, 90430-001', //	Porto Alegre
	5: '\n\nRibeirão Preto (UBDS Central): 📞 (16) 94701-6803\nEndereço: 🏠 Av. Jerônimo Gonçalves, 466 - (16) 3605-5000' + //	Ribeirão Preto
	   '\n\nRibeirão Preto (UPA 13 de Maio): 📞 (16) 99612-3203\nEndereço: 🏠 Av. Treze de Maio, 353\n(Verificar funcionamento normal devido à COVID-19)' + 
	   '\n\nRibeirão Preto (Hospital das Clínicas): 📞 (16) 3602-1000\nEndereço: 🏠 R. Ten. Catão Roxo, 3900\n(Apenas para pessoas que não são de Ribeirão Preto, ou não são cadastrados no sistema de saúde da cidade)	   ', 
	6: '\n\nCuritiba: 📞 (41) 3281-1000\nEndereço: 🏠 R. Ubaldino do Amaral, 545, Alto da Xv' //	Curitiba
};

function getCombinaContact(combinaCity) {
	const cityID = Object.keys(combinaCityDictionary).find((key) => combinaCityDictionary[key] === combinaCity);

	const city  = combinaCity;
	const phone = combinaContactDictionary[cityID];
	const text  = combinaText[cityID];

	if (cityID && phone) {
		let aux = flow.falarComHumano.combina;
		// aux += `\n\n${city}: 📞 ${phone}`;
		// aux += `\nEndereço: 🏠 ${address}`;
		// aux += `\nWhatsapp: ${buildWhatsappLink(phone, flow.whatsappText.combina)}`;
		aux += text;
		aux += `\nVeja tbm o site do MS: http://www.aids.gov.br/pt-br/onde-encontrar-pep`;
		return aux;
	}


	let res = `${flow.falarComHumano.combina}\n\n`;
	const keys = Object.keys(combinaCityDictionary);
	keys.forEach((e) => {
		res += `${combinaCityDictionary[e]}: 📞 ${combinaContactDictionary[e]}\n`;
	});

	return res.trim();
}

async function dateHorario(horario) {
	const [hour, minutes] = horario.split(':');
	let ts = new Date();
	ts.setHours(hour || 0);
	ts.setMinutes(minutes || 0);
	ts.setSeconds(0);
	ts.setMilliseconds(0);
	ts = await removeTimezone(ts);

	return { date: ts, string: ts.toISOString().slice(11, 19) };
}

async function checkSameDay(date1, date2) {
	const moment1 = moment(date1);
	const moment2 = moment(date2);

	return (moment1.isSame(moment2, 'day'));
}

function findConvidado(username) {
	if (!username || typeof username !== 'string') return false;

	const match = username.match(/Convidado\s\d{4}$/, 'i');
	return !!match;
}

async function Image(url) {
	try {
		if (findConvidado(this.state.name) === false) {
			await this.sendImage(url);
		}
	} catch (error) {
		Sentry.captureMessage('Não foi possível enviar imagem', { url, state: this.state });
	}
}

async function Video(url) {
	try {
		console.log('url', url);

		if (findConvidado(this.state.name) === false) {
			await this.sendVideo(url);
		}
	} catch (error) {
		Sentry.captureMessage('Não foi possível enviar vídeo', { url, state: this.state });
	}
}

async function Audio(url) {
	try {
		if (findConvidado(this.state.name) === false) {
			await this.sendAudio(url);
		}
	} catch (error) {
		Sentry.captureMessage('Não foi possível enviar áudio', { url, state: this.state });
	}
}

async function File(url) {
	try {
		if (findConvidado(this.state.name) === false) {
			await this.sendFile(url);
		}
	} catch (error) {
		Sentry.captureMessage('Não foi possível enviar arquivo', { url, state: this.state });
	}
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
	horarioDictionary,
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
	buildLabels,
	accents,
	siglaMap,
	formatPhone,
	buildCidadeText,
	removeTimezone,
	buildAlarmeMsg,
	checkValidAddress,
	getTomarHoras,
	combinaCityDictionary,
	combinaContactDictionary,
	getCombinaContact,
	instagramDictionary,
	dateHorario,
	checkSameDay,
	findConvidado,
	Image,
	Video,
	Audio,
	File,
};
