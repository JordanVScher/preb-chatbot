require('dotenv').config();

const testFolder = './.sessions/';
const fs = require('fs');


const { addCityLabel } = require('./app/utils/labels');

async function load() {
	fs.readdirSync(testFolder).forEach(async (file) => {
		const obj = JSON.parse(await fs.readFileSync(testFolder + file, 'utf8'));

		const res = await addCityLabel(obj.user.id, obj._state.user.city);
		console.log(`Added ${obj.user.first_name} to label city ${obj._state.user.city} ->`, res);
	});
}

load();
