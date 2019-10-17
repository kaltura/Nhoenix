const express = require('express');

const parser = require('./lib/parser.js');


const app = express();
 
app.get('/', function (req, res) {
  res.send('Hello World')
})
 


module.exports = {

    configure: options => {
        options = options || {};
        options.http = options.http || {
            port: 80
        };
        options.https = options.https || {
            port: 443
        };
        options.basePath = options.basePath || '/';

        this.options = options;
    },

    /**
     * @param {object}
     */
    use: controllers => {
        parser.controllers(controllers);
        this.controllers = controllers;
    },

    start: () => {
        app.listen(3000)
    }
};