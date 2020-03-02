require('dotenv').config();

const help = require('../app/utils/helper');

jest.mock('../app/chatbot_api');

it('formatDialogFlow - 250 chars or more, upperCase, remove-accents', async () => {
	const largetext = 'Estou sentado num escritório, cercado de cabeças e corpos. Minha postura está conscientemente moldada ao formato da cadeira dura. '
	+ 'Trata-se de uma sala fria da Administração da Universidade, com paredes revestidas de madeira e enfeitadas com Remingtons, janelas duplas contra o calor '
	+ 'de novembro, insulada dos sons administrativos pela área da recepção à sua frente, onde o Tio Charles, o sr.deLint e eu tínhamos sido recebidos um pouco antes.';

	const expectedResult = 'estou sentado num escritorio, cercado de cabecas e corpos. minha postura esta conscientemente moldada ao formato da cadeira dura. '
    + 'trata-se de uma sala fria da administracao da universidade, com paredes revestidas de madeira e enfeitadas com remington';
	const actualResult = await help.formatDialogFlow(largetext);

	expect(expectedResult === actualResult).toBeTruthy();
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
