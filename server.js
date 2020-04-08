require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const { bottender } = require('bottender');

const app = bottender({	dev: true });

const port = Number(process.env.API_PORT) || 5000;

const handle = app.getRequestHandler();

app.prepare().then(() => {
	const server = express();

	server.use(
		bodyParser.json({
			verify: (req, _, buf) => {
				req.rawBody = buf.toString();
			},
		}),
	);

	server.get('/api', (req, res) => {
		res.json({ ok: true });
	});

	server.all('*', (req, res) => handle(req, res));


	server.listen(port, (err) => {
		if (err) throw err;
		console.log(`Server is running on ${port} port...`);
		console.log(`App: ${process.env.APP} & Page: ${process.env.PAGE} - ${process.env.SHARE_LINK}`);
		console.log(`MA User: ${process.env.MA_USER}`);
	});
});
