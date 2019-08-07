const flow = require('./flow');
const { sendMain } = require('./mainMenu');

async function sendCarouselSus(context, items) {
	const elements = [];


	items.forEach(async (element) => {
		elements.push({
			title: element.title,
			// subtitle: element.subtitle,
			buttons: element.buttons,
		});
	});
	await context.sendText(flow.sus.text1);
	await context.sendAttachment({
		type: 'template',
		payload: {
			template_type: 'generic',
			elements,
		},
	});
	await sendMain(context);
}

module.exports = { sendCarouselSus };
