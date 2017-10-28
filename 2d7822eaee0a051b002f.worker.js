/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar __assign = (this && this.__assign) || Object.assign || function(t) {\n    for (var s, i = 1, n = arguments.length; i < n; i++) {\n        s = arguments[i];\n        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))\n            t[p] = s[p];\n    }\n    return t;\n};\nObject.defineProperty(exports, \"__esModule\", { value: true });\nvar common_1 = __webpack_require__(1);\nself.addEventListener('message', function (e) {\n    var request = e.data;\n    var mainThread = self;\n    try {\n        var hduSources = decode(request);\n        var response = {\n            requestId: request.requestId,\n            hduSources: hduSources,\n        };\n        mainThread.postMessage(response, hduSources.map(function (s) { return s.data; }));\n    }\n    catch (error) {\n        var response = {\n            requestId: request.requestId,\n            error: error,\n        };\n        mainThread.postMessage(response);\n    }\n});\nvar CARD_LENGTH = 80;\nvar CARDS_PER_BLOCK = 36;\nvar BLOCK_SIZE = CARD_LENGTH * CARDS_PER_BLOCK;\nfunction decode(request) {\n    var offset = 0;\n    var headers = [];\n    var dataBuffers = [];\n    // parse only headers and stride all HDUs\n    for (var hduIndex = 0; offset < request.fileContent.byteLength; ++hduIndex) {\n        var header = {};\n        while (true) {\n            var blockBytes = new Uint8Array(request.fileContent, offset, offset + BLOCK_SIZE);\n            offset += BLOCK_SIZE;\n            var _a = parseHeaderBlock(blockBytes), end = _a.end, newHeader = _a.header;\n            header = __assign({}, header, newHeader);\n            if (end)\n                break;\n        }\n        var byteLength = calcDataSize(header).byteLength;\n        headers.push(header);\n        dataBuffers.push(new DataView(request.fileContent, offset, byteLength));\n        offset += align(byteLength, BLOCK_SIZE);\n    }\n    // fill hduDecodeOptions\n    if (request.hduDecodeOptions == undefined)\n        request.hduDecodeOptions = headers.map(function (h, index) { return ({\n            sourceIndex: index,\n            outputDataType: bitpix2dataType(common_1.card(h, 'BITPIX', 'number')),\n        }); });\n    return request.hduDecodeOptions.map((function (o) {\n        var header = headers[o.sourceIndex];\n        var buffer = dataBuffers[o.sourceIndex];\n        var nPixels = calcDataSize(header).nPixels;\n        var dataType = o.outputDataType;\n        var outTypedArray = new ((_a = {},\n            _a[common_1.DataType.float32] = Float32Array,\n            _a[common_1.DataType.uint8] = Uint8Array,\n            _a)[dataType])(nPixels);\n        if (!o.doNotScaleImageData && common_1.card(header, 'BITPIX', 'number') > 0)\n            console.warn(\"B{SCALE,ZERO} not supported\");\n        var picker = (_b = {},\n            _b[-32] = function (i) { return buffer.getFloat32(4 * i); },\n            _b[8] = function (i) { return buffer.getUint8(i); },\n            _b)[common_1.card(header, 'BITPIX', 'number')];\n        for (var i = 0; i < nPixels; ++i) {\n            outTypedArray[i] = picker(i);\n        }\n        var data = outTypedArray.buffer;\n        return { header: header, data: data, dataType: dataType };\n        var _a, _b;\n    }));\n}\nfunction bitpix2dataType(bitpix) {\n    switch (bitpix) {\n        case 8:\n            return common_1.DataType.uint8;\n        case -32:\n            return common_1.DataType.float32;\n        default:\n            throw new Error(\"unknwon BITPIX: \" + bitpix);\n    }\n}\nfunction align(n, blockSize) {\n    return (Math.floor((n - 1) / blockSize) + 1) * blockSize;\n}\nfunction calcDataSize(header) {\n    var naxis = common_1.card(header, 'NAXIS', 'number');\n    var naxes = range(1, naxis + 1).map(function (i) { return common_1.card(header, \"NAXIS\" + i, 'number'); });\n    var nPixels = naxes.reduce(function (memo, next) { return memo * next; }, 1);\n    var byteDepth = Math.abs(common_1.card(header, 'BITPIX', 'number')) / 8;\n    var byteLength = nPixels * byteDepth;\n    return { nPixels: nPixels, byteDepth: byteDepth, byteLength: byteLength, naxis: naxis, naxes: naxes };\n}\nfunction range(a, b) {\n    var array = [];\n    for (var i = a; i < b; ++i)\n        array.push(i);\n    return array;\n}\nfunction parseHeaderBlock(bytes) {\n    var text = String.fromCharCode.apply(String, bytes);\n    var header = {};\n    if (text.length != BLOCK_SIZE)\n        throw new Error(\"invalid byte sequence: \" + text);\n    var end = false;\n    cardLoop: for (var i = 0; i < CARDS_PER_BLOCK; ++i) {\n        var cardString = text.substr(i * CARD_LENGTH, CARD_LENGTH);\n        var card_1 = Card.parse(cardString);\n        switch (card_1.type) {\n            case CardType.END:\n                end = true;\n                break cardLoop;\n            case CardType.KEY_VALUE:\n                header[card_1.key] = card_1.value;\n                break;\n        }\n    }\n    return { end: end, header: header };\n}\nvar CardType;\n(function (CardType) {\n    CardType[CardType[\"END\"] = 0] = \"END\";\n    CardType[CardType[\"COMMENT\"] = 1] = \"COMMENT\";\n    CardType[CardType[\"HISTORY\"] = 2] = \"HISTORY\";\n    CardType[CardType[\"KEY_VALUE\"] = 3] = \"KEY_VALUE\";\n    CardType[CardType[\"UNKNOWN\"] = 4] = \"UNKNOWN\";\n})(CardType || (CardType = {}));\nvar Card = /** @class */ (function () {\n    function Card(type, _a) {\n        var _b = _a === void 0 ? {} : _a, key = _b.key, value = _b.value, comment = _b.comment;\n        this.type = type;\n        this.key = key;\n        this.value = value;\n        this.comment = comment;\n    }\n    Card.parse = function (raw) {\n        switch (raw.substr(0, 8)) {\n            case 'END     ':\n                return new Card(CardType.END);\n            case 'COMMENT ': {\n                var comment = strip(raw.substr(8));\n                return new Card(CardType.COMMENT, { comment: comment });\n            }\n            case 'HISTORY ': {\n                var comment = strip(raw.substr(8));\n                return new Card(CardType.HISTORY, { comment: comment });\n            }\n            default: {\n                var _a = raw.split('='), left = _a[0], right = _a[1];\n                if (!right) {\n                    return new Card(CardType.UNKNOWN);\n                }\n                if (left.match(/^HIERARCH /))\n                    left = left.substr(9);\n                var key = strip(left);\n                var _b = this.parseValueString(right), value = _b.value, comment = _b.comment;\n                return new Card(CardType.KEY_VALUE, { key: key, value: value, comment: comment });\n            }\n        }\n    };\n    Card.parseValueString = function (raw) {\n        var _a = raw.split('/'), valueString = _a[0], commentString = _a[1];\n        var comment;\n        if (commentString) {\n            comment = strip(commentString);\n        }\n        valueString = strip(valueString);\n        var value;\n        if (valueString == 'T')\n            value = true;\n        else if (valueString == 'F')\n            value = false;\n        else if (valueString.substr(0, 1) == \"'\") {\n            value = valueString.substring(1, valueString.length - 1);\n        }\n        else {\n            value = Number(valueString);\n        }\n        return { value: value, comment: comment };\n    };\n    return Card;\n}());\nfunction strip(s) {\n    return s.match(/\\s*(.*?)\\s*$/)[1];\n}\n\n\n//////////////////\n// WEBPACK FOOTER\n// ../node_modules/ts-loader!../src/decode_worker.ts\n// module id = 0\n// module chunks = 0\n\n//# sourceURL=webpack:///../src/decode_worker.ts?../node_modules/ts-loader");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nObject.defineProperty(exports, \"__esModule\", { value: true });\nvar DataType;\n(function (DataType) {\n    DataType[DataType[\"uint8\"] = 0] = \"uint8\";\n    DataType[DataType[\"float32\"] = 1] = \"float32\";\n})(DataType = exports.DataType || (exports.DataType = {}));\nfunction card(header, key, type) {\n    var value = header[key];\n    if (typeof value != type)\n        throw new Error(\"Type mismatch: \" + value + \" for \" + key);\n    return value;\n}\nexports.card = card;\n\n\n//////////////////\n// WEBPACK FOOTER\n// ../src/common.ts\n// module id = 1\n// module chunks = 0\n\n//# sourceURL=webpack:///../src/common.ts?");

/***/ })
/******/ ]);