'use strict';
const app = require('../lib/app');
const apm = require('elastic-apm-node').start();
exports.usage = [
    'lsc services start      - Start up LabShare API services.',
    ''
];
exports.start = async function () {
    this.log.info('Starting LabShare services with LoopBack ...');
    const lbApp = new app.LabShareApplication(LabShare.Config);
    global.LabShare.App = lbApp;
    await lbApp.setMiddleware();    
    await lbApp.boot();
    await lbApp.start();
    console.log(`LabShare Application Started`);
}