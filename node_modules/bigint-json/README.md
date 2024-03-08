# bigint-json

[![GitHub issues](https://img.shields.io/github/issues/david-storm94/bigint-json)](https://github.com/david-storm94/bigint-json/issues)
[![GitHub license](https://img.shields.io/github/license/david-storm94/bigint-json)](https://github.com/david-storm94/bigint-json/blob/master/LICENSE)



Simple package that allows you to use `JSON.parse` & `JSON.stringify` with `BigInt` support.

It works by converting bigints to string and appending `n` when stringifying and finding strings representing numbers ending with `n` and converting then to `BigInt` when parsing


## Install

```shell
$ npm install bigint-json
```

## Usage
```js
const bigintJSON = require('bigint-json');

const someObject = {someKey: 1234n};

const json = bigintJSON.stringify(someObject); // '{"someKey":"1234n"}'

const parsed = bigintJSON.parse(json); // { someKey: 1234n }

```

Works with nested objects as well

It uses Douglas Crockford [JSON.js](https://github.com/douglascrockford/JSON-js) package


