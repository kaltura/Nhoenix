const sha1 = require('sha1');
const crypto = require('crypto');
const querystring = require('querystring');

const types = require('./types.js');

const SHA1_SIZE = 20;
const RANDOM_SIZE = 16;
const FIELD_EXPIRY =              'e';
const FIELD_TYPE =                't';
const FIELD_USER =                'u';
const FIELD_MASTER_PARTNER_ID =   'm';
const FIELD_ADDITIONAL_DATA =     'd';   
const REPLACE_UNDERSCORE = /\^\^\^/g;

var KalturaExceptionTypes = {
    INVALID_KS_FORMAT: new types.KalturaExceptionType('INVALID_KS_FORMAT', 'Invalid KS format'),
    KS_EXPIRED: new types.KalturaExceptionType('KS_EXPIRED', 'KS expired'),
    PARTNER_INVALID: new types.KalturaExceptionType('PARTNER_INVALID', 'Partner invalid'),
};

function ksToBuffer(ks) {
    let base64 = ks.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64');
}

function sha1Raw(str) {
    let sha = sha1(str);
    let codes = [];
    for(let i = 0; i < sha.length; i += 2) {
        codes.push(parseInt(sha.substr(i, 2), 16));
    }
    return Buffer.from(String.fromCharCode.apply(null, codes), 'binary');
}

function decrypt(secret, encrypted) {
    const iv = '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0';
    const decipher = crypto.createDecipheriv('aes-128-cbc', secret, iv);
    decipher.setAutoPadding(false);
    let content =  decipher.update(encrypted, "binary", "binary");
    content += decipher.final("binary");
    return Buffer.from(content, 'binary');

}

var config;

function getSecrets(partnerId) {
    if(config.partners && config.partners[partnerId]) {
        return config.partners[partnerId];
    }
    else if (config.partnerConfigCallback) {
        var secrets = config.partnerConfigCallback(partnerId);
        if(secrets) {
            return secrets;
        }
    }
    throw new types.KalturaAPIException(KalturaExceptionTypes.PARTNER_INVALID);
}

function validate(session) {
    const now = Date.now() / 1000;
    if(session.expiry < now) {
        throw new types.KalturaAPIException(KalturaExceptionTypes.KS_EXPIRED);
    }
}

module.exports = {

    configure: options => {
        if(!options.partners && !options.partnerConfigCallback) {
            throw 'Partners configuration or callback required'
        }
        config = options;
    },

    /**
     * @returns {Promise}
     */
    parse: ks => {
        let buf = ksToBuffer(ks);
        let [version, partnerId] = buf.toString('binary').split('|', 2);
        
        if(version != 'v2') {
            throw new types.KalturaAPIException(KalturaExceptionTypes.INVALID_KS_FORMAT);
        }

        let session = {
            ks: ks,
            partnerId: parseInt(partnerId)
        };

        let indexOfSeperator = `v2|${session.partnerId}|`.length;
        let encrypted = buf.slice(indexOfSeperator);

        let secrets = getSecrets(session.partnerId);

        let fields;
        let valid = false;
        while(secrets.length) {
            let secret = secrets.pop();
            
            let key = sha1Raw(secret).slice(0, 16);
            let decrypted = decrypt(key, encrypted);
            let hash = decrypted.slice(0, SHA1_SIZE).toString('hex');
            fields = decrypted.slice(SHA1_SIZE);
            let fieldsHash = sha1Raw(fields).toString('hex');

            fields = Buffer.from(fields.toString('hex').replace(/(00)+$/, ''), 'hex');
            let trimmedfieldsHash = sha1Raw(fields).toString('hex');

            if (hash === fieldsHash || hash === trimmedfieldsHash) {
                valid = true;
                break;
            }
        }
        if (!valid) {
            throw new types.KalturaAPIException(KalturaExceptionTypes.INVALID_KS_FORMAT);
        }

        fields = Buffer.from(fields, 'hex');
        fields = fields.slice(RANDOM_SIZE).toString('utf8');
        fields = querystring.parse(fields, '&_');

        for (let key in fields) {
            switch (key) {
                case FIELD_EXPIRY:
                    session.expiry = parseInt(fields[key]);
                    break;

                case FIELD_TYPE:
                    session.type = parseInt(fields[key]);
                    break;

                case FIELD_USER:
                    session.userId = fields[key];
                    break;

                case FIELD_MASTER_PARTNER_ID:
                    session.masterPartnerId = parseInt(fields[key]);
                    break;

                case FIELD_ADDITIONAL_DATA:
                    let data = querystring.parse(fields[key], ';');                    
                    for(let subKey in data) {
                        switch(subKey) {
                            case 'UDID':
                                session.udid = data[subKey] ? decodeURI(data[subKey]).replace(REPLACE_UNDERSCORE, '_') : data[subKey]; 
                                break;
                                
                            case 'CreateDate':
                                session.createDate = parseInt(data[subKey]);
                                break;
                        }
                    }
                    break;

                default:
                    session[key] = fields[key];
            }
        }
        //validate(session);
        return session;
    }
};