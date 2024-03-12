let cloneDeep = require('lodash.clonedeep');


/**
 * Stringifies object with bigints just like JSON.stringify,
 * but converts bigints to string and appends n
 *
 * @example
 * stringify({key: 1234n})
 * // returns '{"key":"1234n"}'
 *
 * @returns {string} Returns stringified JSON
 */
function stringify(input, replacer = null) {
    if (!input) {
        throw new Error('Invalid input')
    }

    if (typeof input !== "object") {
        throw new Error('TypeError: Do not know to stringify a ' + typeof input);
    }

    let object = cloneDeep(input);

    object = bigintToString(object);

    return JSON.stringify(object, replacer);
}


function bigintToString(o) {
    Object.keys(o).forEach(k => {
        if (o[k] != null && typeof o[k] === 'object') {
            return bigintToString(o[k]);
        }
        if (typeof o[k] === "bigint") {
            o[k] = `${o[k]}n`
        }
    });
    return o;
}

module.exports = stringify;
