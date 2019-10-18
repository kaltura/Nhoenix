const path = require('path');
const Nhoenix = require('nhoenix');

Nhoenix.configure({
    https: {
        enable: false
    }
});

Nhoenix.use('./controllers');
Nhoenix.start();