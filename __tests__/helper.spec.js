require('dotenv').config();

const help = require('../app/utils/helper');

jest.mock('../app/chatbot_api');

const exampleText = 'Estou sentado num escritório, cercado de cabeças e corpos. Minha postura está conscientemente moldada ao formato da cadeira dura.'
			+ ' Trata-se de uma sala fria da Administração da Universidade, com paredes revestidas de madeira e enfeitadas com Remingtons, janelas duplas contra o calor '
			+ 'de novembro, insulada dos sons administrativos pela área da recepção à sua frente, onde o Tio Charles, o sr.deLint e eu tínhamos sido recebidos um pouco antes.'
			+ 'Eu estou aqui.'
			+ 'Três rostos ganharam nitidez logo acima de blazers esportivos de verão e meios - windsors do outro lado de uma mesa de reunião envernizada que reluzia sob a luz aracnoide de uma tarde do Arizona. '
			+ 'São os três Gestores — de Seleção, Assuntos Acadêmicos, Assuntos Esportivos. Não sei qual rosto é de quem.';

it('formatDialogFlow - 250 chars or more, upperCase, remove-accents', async () => {
	const expectedResult = 'estou sentado num escritorio, cercado de cabecas e corpos. minha postura esta conscientemente moldada ao formato da cadeira dura. '
    + 'trata-se de uma sala fria da administracao da universidade, com paredes revestidas de madeira e enfeitadas com remington';

	const actualResult = await help.formatDialogFlow(exampleText);
	expect(expectedResult === actualResult).toBeTruthy();
});

describe('separateString', () => {
	it('Short Text - dont split in two (dont split on "sr.", dont add missing dot)', async () => {
		const shortText = exampleText.slice(0, 40); // when we slit here, there's no dot at the end and it shouldn't be added

		const { firstString, secondString } = await help.separateString(shortText);
		await expect(firstString).toBeTruthy();
		await expect(firstString.length).toBe(shortText.length);
		await expect(secondString).toBeFalsy();
	});

	it('Large Text - split in two (dont split on "sr." nor e-mail nor website)', async () => {
		const test = 'foobar@email.com www.foobar.com.br';
		const text = `${exampleText.slice(0, 300)} ${test} ${exampleText.slice(300)}`;
		const { firstString, secondString } = await help.separateString(text);

		await expect(firstString).toBeTruthy();
		await expect(firstString.includes(test)).toBeTruthy();
		await expect(secondString).toBeTruthy();
		await expect(firstString.length < text.length).toBeTruthy();
		await expect(secondString.length < text.length).toBeTruthy();
		await expect(firstString.length + secondString.length === text.length).toBeTruthy();
	});

	it('Large Text, missing comma - split and dont add the missing comma', async () => {
		const text = exampleText.slice(0, -1);

		const { firstString, secondString } = await help.separateString(text);
		await expect(firstString).toBeTruthy();
		await expect(secondString).toBeTruthy();
		await expect(secondString.charAt(-1) !== '.').toBeTruthy();
		await expect(firstString.length < text.length).toBeTruthy();
		await expect(secondString.length < text.length).toBeTruthy();
		await expect(firstString.length + secondString.length === text.length).toBeTruthy();
	});
});

it('formatPhone', async () => {
	await expect(await help.formatPhone('901234567')).toBe('+55901234567');
	await expect(await help.formatPhone('901234567', 7)).toBe('+55901234567');
	await expect(await help.formatPhone('901234567', 1)).toBe('+5531901234567');
	await expect(await help.formatPhone('901234567', 2)).toBe('+5571901234567');
	await expect(await help.formatPhone('901234567', 3)).toBe('+5511901234567');
	await expect(await help.formatPhone('31901234567', 1)).toBe('+5531901234567');
	await expect(await help.formatPhone('71901234567', 2)).toBe('+5571901234567');
	await expect(await help.formatPhone('11901234567', 3)).toBe('+5511901234567');
	await expect(await help.formatPhone('55901234567', 1)).toBe('+5531901234567');
	await expect(await help.formatPhone('55901234567', 2)).toBe('+5571901234567');
	await expect(await help.formatPhone('55901234567', 3)).toBe('+5511901234567');
	await expect(await help.formatPhone('+55901234567', 1)).toBe('+5531901234567');
	await expect(await help.formatPhone('+55901234567', 2)).toBe('+5571901234567');
	await expect(await help.formatPhone('+55901234567', 3)).toBe('+5511901234567');
	await expect(await help.formatPhone('5531901234567', 1)).toBe('+5531901234567');
	await expect(await help.formatPhone('5571901234567', 2)).toBe('+5571901234567');
	await expect(await help.formatPhone('5511901234567', 3)).toBe('+5511901234567');
	await expect(await help.formatPhone('+5531901234567', 1)).toBe('+5531901234567');
	await expect(await help.formatPhone('+5571901234567', 2)).toBe('+5571901234567');
	await expect(await help.formatPhone('+5511901234567', 3)).toBe('+5511901234567');
});

it('getPhoneValid', async () => {
	await expect(await help.getPhoneValid('')).toBeFalsy();
	await expect(await help.getPhoneValid('foobar')).toBeFalsy();
	await expect(await help.getPhoneValid('fo1o2b3a4r')).toBeFalsy();
	await expect(await help.getPhoneValid('1234567')).toBeFalsy();
	await expect(await help.getPhoneValid('1234567foo')).toBeFalsy();
	await expect(await help.getPhoneValid('12345678')).toBe('12345678');
	await expect(await help.getPhoneValid('1234-5678')).toBe('12345678');
	await expect(await help.getPhoneValid('912345678')).toBe('912345678');
	await expect(await help.getPhoneValid('91234-5678')).toBe('912345678');
	await expect(await help.getPhoneValid('11912345678')).toBe('11912345678');
	await expect(await help.getPhoneValid('(11)912345678')).toBe('11912345678');
	await expect(await help.getPhoneValid('5511912345678')).toBe('5511912345678');
	await expect(await help.getPhoneValid('+5511912345678')).toBe('5511912345678');
	await expect(await help.getPhoneValid('12345678901234')).toBeFalsy();
});

describe('buildAlarmeMsg', () => {
	it('empty user - no msg', async () => {
		const user = {};

		const res = await help.buildAlarmeMsg(user);
		await expect(res).toBe('');
	});

	it('user doesnt have alarm - no msg', async () => {
		const user = {
			prep_reminder_before: 0,
			prep_reminder_before_interval: null,
			prep_reminder_after: 0,
			prep_reminder_after_interval: null,
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res).toBe('');
	});

	it('user has before alarme but no interval - partial msg', async () => {
		const user = {
			prep_reminder_before: 1,
			prep_reminder_before_interval: null,
			prep_reminder_after: 0,
			prep_reminder_after_interval: null,
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res.includes('antes')).toBeTruthy();
		await expect(res.includes(', às')).toBeFalsy();
	});

	it('user has before alarme and interval - full msg', async () => {
		const user = {
			prep_reminder_before: 1,
			prep_reminder_before_interval: '12:00:00',
			prep_reminder_after: 0,
			prep_reminder_after_interval: null,
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res.includes('antes')).toBeTruthy();
		await expect(res.includes(', às')).toBeTruthy();
	});

	it('user has after alarme but no interval - partial msg', async () => {
		const user = {
			prep_reminder_before: 0,
			prep_reminder_before_interval: null,
			prep_reminder_after: 1,
			prep_reminder_after_interval: null,
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res.includes('depois')).toBeTruthy();
		await expect(res.includes(', às')).toBeFalsy();
	});

	it('user has after alarme and interval - full msg', async () => {
		const user = {
			prep_reminder_before: 0,
			prep_reminder_before_interval: null,
			prep_reminder_after: 1,
			prep_reminder_after_interval: '12:00:00',
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res.includes('depois')).toBeTruthy();
		await expect(res.includes(', às')).toBeTruthy();
	});

	it('user has before alarme and after interval - dont show different interval', async () => {
		const user = {
			prep_reminder_before: 1,
			prep_reminder_before_interval: null,
			prep_reminder_after: 0,
			prep_reminder_after_interval: '12:00:00',
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res.includes('antes')).toBeTruthy();
		await expect(res.includes(', às')).toBeFalsy();
	});

	it('user has before alarme but interval isnt a string - partial msg', async () => {
		const user = {
			prep_reminder_before: 1,
			prep_reminder_before_interval: 1,
			prep_reminder_after: 0,
			prep_reminder_after_interval: null,
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res.includes('antes')).toBeTruthy();
		await expect(res.includes(', às')).toBeFalsy();
	});

	it('user only has interval - no msg', async () => {
		const user = {
			prep_reminder_before: 0,
			prep_reminder_before_interval: '12:00:00',
			prep_reminder_after: 0,
			prep_reminder_after_interval: null,
		};

		const res = await help.buildAlarmeMsg(user);
		await expect(res).toBe('');
	});
});

describe('checkValidAddress', () => {
	it('empty address - returns false', async () => {
		const res = await help.checkValidAddress(null);

		await expect(res).toBe(false);
	});

	it('address is not a string - returns false', async () => {
		const res = await help.checkValidAddress(10);

		await expect(res).toBe(false);
	});

	it('address is too short - returns false', async () => {
		const res = await help.checkValidAddress('foobar');

		await expect(res).toBe(false);
	});

	it('address doesnt have number - returns false', async () => {
		const res = await help.checkValidAddress('avenida foobar');

		await expect(res).toBe(false);
	});

	it('address only has numbers - returns false', async () => {
		const res = await help.checkValidAddress('123456789');

		await expect(res).toBe(false);
	});

	it('valid address - returns address', async () => {
		const address = 'avenida foobar n2666';
		const res = await help.checkValidAddress(address);

		await expect(res).toBe(address);
	});
});

describe('findConvidado', () => {
	const testCases = [
		{ name: 'Empty String - failure', username: '', res: false },
		{ name: 'null - failure', username: null, res: false },
		{ name: 'undefined - failure', username: undefined, res: false },
		{ name: 'Object - failure', username: {}, res: false },
		{ name: 'Number - failure', username: 1234, res: false },
		{ name: 'Foobar - failure', username: 'foobar', res: false },
		{ name: 'Convidado - failure', username: 'Convidado', res: false },
		{ name: 'Convidado1234 - failure', username: 'Convidado1234', res: false },
		{ name: 'Convidado_1234 - failure', username: 'Convidado_1234', res: false },
		{ name: 'Convidado 123 - failure', username: 'Convidado 123', res: false },
		{ name: 'Convidado 12345 - failure', username: 'Convidado 12345', res: false },
		{ name: 'convidado 1234 - failure', username: 'convidado 1234', res: false },
		{ name: 'Convidado 1234 - success', username: 'Convidado 1234', res: true },
	];

	testCases.forEach((test) => {
		it(test.name, async () => {
			const res = help.findConvidado(test.username);
			await expect(res).toBe(test.res);
		});
	});
});
