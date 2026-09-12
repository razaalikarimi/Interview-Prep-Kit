const app = require('../apps/api/dist/server.js');

module.exports = app.default || app.app || app;
