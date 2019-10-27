const fs = require('fs');
const get_ = require('lodash/get');
const has_ = require('lodash/has');
const util = require('util');
const path = require('path');
const sync = require('promise-synchronizer');
const requestPromise = require('request-promise');

function load() {
    try {
        const appPath = path.dirname(require.main.filename);        
        const settingsJsonPath = path.resolve(appPath, 'settings.json');        
        if(fs.existsSync(settingsJsonPath)) {
            console.log(settingsJsonPath);
            return JSON.parse(fs.readFileSync(settingsJsonPath, 'utf-8'));
        }
        const packageJsonPath = path.resolve(appPath, 'package.json');
        const package = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const tcmUrl = process.env['TCM_URL'] || 'http://tcm:8080';
        const tcmAppId =  process.env['TCM_APP_ID'] || '5bf8cf60';
        const tcmAppSecret =  process.env['TCM_APP_SECRET'] || '5aaa99331c18f6bad4adeef93ab770c2';
        const appVersion =  package.version.replace(/[.]/g, '_');
        const appName =  package.name.toUpperCase().replace(/-/g, '_');
        const tcmApp =  process.env['TCM_APP'] || `${appName}_${appVersion}`;
        const tcmSection =  process.env['TCM_SECTION'] || 'config';
        const tcm = `${tcmUrl}/${tcmApp}/main/${tcmSection}?app_id=${tcmAppId}&app_secret=${tcmAppSecret}`;
        
        console.log(`TCM URL: ${tcm}`);
        const json = sync(requestPromise({
            uri: tcm,
            json: true
        }));
        return json;
    }   
    catch (err) {
        //console.error(`Failed to load configuration: ${util.inspect(err)}`);
        return {
            partners: {}
        };
    }
}

const config = load();

module.exports = {
    get: path => {
        const splittedPath = path.split('.');
        return get_(config, splittedPath);
    },

    has: path => {
        const splittedPath = path.split('.');
        return has_(config, splittedPath);
    }
};