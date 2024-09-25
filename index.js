#!/usr/bin/env node

var app = require('./app');

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;