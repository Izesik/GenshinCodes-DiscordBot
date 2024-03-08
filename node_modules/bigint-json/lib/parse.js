/**
 ** Parses object with bigints just like JSON.parse,
 *  but converts strings of numbers ending with n into bigints
 *
 * @example
 * parse('{"key":"1234n"}')
 * // returns { key: 1234n }
 *
 * @returns {Object} Returns parsed object with bigints
 */
function parse (input, receiver = null) {
     if (!input) {
          throw new Error('Invalid input')
     }

     if (typeof input !== "string") {
          throw new Error('TypeError: Do not know to parse a ' + typeof input);
     }

     const parsed = JSON.parse(input, receiver);

     return stringToBigint(parsed);
}

function stringToBigint(o) {
     Object.keys(o).forEach(k => {
          if (o[k] != null && typeof o[k] === 'object') {
               return stringToBigint(o[k]);
          }


          if (typeof o[k] === "string") {
               if (/^\d+n$/.test(o[k])) {
                    o[k] = BigInt(o[k].substring(0, o[k].length - 1));
                    // console.log(o[k]);
               }
          }
     });
     return o;
}


module.exports = parse;
