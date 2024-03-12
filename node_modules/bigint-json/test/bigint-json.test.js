const mocha = require('mocha');
const expect = require('chai').expect;
const bigintJSON = require('../index');


describe('Tests for bigint json', () => {
    let object;
    let stringified;
    beforeEach(() => {
        object = {
            someKey: 'someString',
            someKey2: 1234,
            someKey3: 1234n,
            someKey4: {
                nestedKey: 'someString',
                nestedKey2: 1234,
                nestedKey3: 1234n,
                nestedKey4: {
                    nestedNestedKey: {
                        nestedNestedKey: 'someString',
                        nestedNestedKey2: 1234,
                        nestedNestedKey3: 12349912312323891374291847012983471209384712098347012983741029834710298374102983741092837412093847120938471023n,
                        nestedNestedKey5: null,
                        nestedNestedKey6: undefined,
                        nestedNestedKey7: () => {},
                        nestedNestedKey8: true,
                        nestedNestedKey9: false
                    }
                },
                nestedKey5: null,
                nestedKey6: undefined,
                nestedKey7: () => {},
                nestedKey8: true,
                nestedKey9: false
            },
            somekey5: null,
            somekey6: undefined,
            somekey7: () => {},
            somekey8: true,
            somekey9: false
        };
        stringified = '{"someKey":"someString","someKey2":1234,"someKey3":"1234n","someKey4":{"nestedKey":"someString","nestedKey2":1234,"nestedKey3":"1234n","nestedKey4":{"nestedNestedKey":{"nestedNestedKey":"someString","nestedNestedKey2":1234,"nestedNestedKey3":"12349912312323891374291847012983471209384712098347012983741029834710298374102983741092837412093847120938471023n","nestedNestedKey5":null,"nestedNestedKey8":true,"nestedNestedKey9":false}},"nestedKey5":null,"nestedKey8":true,"nestedKey9":false},"somekey5":null,"somekey8":true,"somekey9":false}';
    });

    describe('parse', () => {
        it('Should parse as json', () => {
            let parsed = bigintJSON.parse(stringified);
            delete(object.somekey6);
            delete(object.somekey7);
            delete(object.someKey4.nestedKey6);
            delete(object.someKey4.nestedKey7);
            delete(object.someKey4.nestedKey4.nestedNestedKey.nestedNestedKey6);
            delete(object.someKey4.nestedKey4.nestedNestedKey.nestedNestedKey7);
            expect(parsed).to.eql(object);
        });

        it('throw error if input is not string', () => {
            expect(bigintJSON.parse.bind(bigintJSON, {})).to.throw('TypeError: Do not know to parse a object');
        });

        it('trow error if input is falsy', () => {
            expect(bigintJSON.parse.bind(bigintJSON)).to.throw('Invalid input');
        });


    });

    describe('stringify', () => {
        it('should not mutate input object', () => {
            let someKey3 = object.someKey3;
            let nestedKey3 = object.someKey4.nestedKey3;
            let nestedNestedKey3 = object.someKey4.nestedNestedKey3;
            bigintJSON.stringify(object);
            expect(someKey3).to.equal(object.someKey3);
            expect(nestedKey3).to.equal(object.someKey4.nestedKey3);
            expect(nestedNestedKey3).to.equal(object.someKey4.nestedNestedKey3);
        });

        it('throw error if input is not object', () => {
            expect(bigintJSON.stringify.bind(bigintJSON, 'sadfsadfasdf')).to.throw('TypeError: Do not know to stringify a string');
        });

        it('trow error if input is falsy', () => {
            expect(bigintJSON.stringify.bind(bigintJSON)).to.throw('Invalid input');
        });

        it('Should be able to stringify with bigints to JSON', () => {
            let newStringified = bigintJSON.stringify(object);
            expect(newStringified).to.equal(stringified)
        });
    });
});
