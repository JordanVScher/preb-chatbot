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
