const sessionsFolder = './../.sessions';
const fs = require('fs');


const listNames = fs.readdirSync(sessionsFolder);
console.log('listNames', listNames);
