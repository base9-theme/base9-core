"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = exports.getNamedColors = exports.defaultConfig = void 0;
const color_1 = __importDefault(require("color"));
const lodash_1 = __importDefault(require("lodash"));
const mustache_1 = __importDefault(require("mustache"));
const semantic_1 = __importDefault(require("./semantic"));
class ColorWithFormat {
    constructor(color) {
        this.color = color;
    }
    get hex() { return this.color.hex().substring(1); }
    get hexbgr() { const x = this.color.hex().substring(1); return x[4] + x[5] + x[2] + x[3] + x[0] + x[1]; }
    get hexr() { return this.color.red().toString(16).padStart(2, "0"); }
    get hexg() { return this.color.green().toString(16).padStart(2, "0"); }
    get hexb() { return this.color.blue().toString(16).padStart(2, "0"); }
    get decr() { return this.color.red().toString(); }
    get decg() { return this.color.green().toString(); }
    get decb() { return this.color.blue().toString(); }
    get fracr() { return (this.color.red() / 255).toString(); }
    get fracg() { return (this.color.green() / 255).toString(); }
    get fracb() { return (this.color.blue() / 255).toString(); }
}
// a = "asd",)]
// asdfaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
// 282936-e9e9f4-ffffff-ea51b2-b45bcf-00f769-ebff87-a1efe4-62d6e8-b45bcf
// 282936-e9e9f4-ffffff-ff5555-ffb86c-f1fa8c-50fa7b-8be9fd-bd93f9-ff79c6
// - &SELECTION '#44475A'
//     - &COMMENT   '#6272A4'
//     - &CYAN      '#8BE9FD'
//     - &GREEN     '#50FA7B'
//     - &ORANGE    '#FFB86C'
//     - &PINK      '#FF79C6'
//     - &PURPLE    '#BD93F9'
//     - &RED       '#FF5555'
//     - &YELLOW    '#F1FA8C'
function difference(c1, c2) {
    const f = Math.abs;
    const l1 = c1.rgb().array();
    const l2 = c2.rgb().array();
    return f(l1[0] - l2[0]) + f(l1[1] - l2[1]) + f(l1[2] - l2[2]);
}
function iteratePermutations(f) {
    // c is an encoding of the stack state. c[k] encodes the for-loop counter for when generate(k - 1, A) is called
    const c = [0, 0, 0, 0, 0, 0, 0];
    const A = [0, 1, 2, 3, 4, 5, 6];
    f(A);
    const n = 7;
    let tmp = 0;
    let i = 0;
    while (i < n) {
        if (c[i] < i) {
            const swapI = (i % 2) === 0 ? 0 : c[i];
            tmp = A[swapI];
            A[swapI] = A[i];
            A[i] = tmp;
            f(A);
            c[i] += 1;
            i = 0;
        }
        else {
            c[i] = 0;
            i += 1;
        }
    }
}
const hues = [
    (0, color_1.default)("#FF0000"),
    (0, color_1.default)("#FFFF00"),
    (0, color_1.default)("#00FF00"),
    (0, color_1.default)("#00FFFF"),
    (0, color_1.default)("#0000FF"),
    (0, color_1.default)("#FF00FF"),
];
function getTrueColorOrder(colors) {
    let min = Infinity;
    let minOrder = [];
    iteratePermutations(order => {
        const diff = difference(colors[order[0]].color, hues[0]) +
            difference(colors[order[1]].color, hues[1]) +
            difference(colors[order[2]].color, hues[2]) +
            difference(colors[order[3]].color, hues[3]) +
            difference(colors[order[4]].color, hues[4]) +
            difference(colors[order[5]].color, hues[5]);
        if (min > diff) {
            min = diff;
            minOrder = order.slice();
        }
    });
    return minOrder;
}
exports.defaultConfig = {
    mapping: semantic_1.default.mappings,
    r1: 0.25,
    r2: 0.5,
    todoSize: 1000,
};
function isColorWithFormat(obj) {
    return obj.constructor === ColorWithFormat;
}
function getMapByKeys(map, keys) {
    let mapIter = map;
    lodash_1.default.each(keys.slice(0, keys.length - 1), (k, i) => {
        if (mapIter.has(k)) {
            const tmpIter = mapIter.get(k);
            if (isColorWithFormat(tmpIter)) {
                throw new Error(`${keys.slice(0, i)} is already a color when writing ${keys.join(".")}`);
            }
            mapIter = tmpIter;
        }
        else {
            const tmp = new Map();
            mapIter.set(k, tmp);
            mapIter = tmp;
        }
    });
    return mapIter;
}
function mapToObj(map) {
    return Object.fromEntries(lodash_1.default.map(Array.from(map.entries()), ([k, v], i) => {
        if (isColorWithFormat(v)) {
            return [k, v];
        }
        else {
            return [k, mapToObj(v)];
        }
    }));
}
function getNamedColors(palette, cfg = exports.defaultConfig) {
    const paletteWithFormat = lodash_1.default.map(palette, c => new ColorWithFormat(c));
    // const cfg = defaultConfig;
    const background = paletteWithFormat[0];
    const foreground = paletteWithFormat[1];
    const colors = paletteWithFormat.slice(2);
    const order = getTrueColorOrder(colors);
    const map = new Map();
    function setColor(key, c) {
        const m = new Map();
        m.set('o', c);
        m.set('b', new ColorWithFormat(c.color.mix(background.color, 1 - cfg.r2)));
        m.set('m', new ColorWithFormat(c.color.mix(background.color, cfg.r1)));
        m.set('s', new ColorWithFormat(c.color.mix(background.color, cfg.r2)));
        m.set('h', new ColorWithFormat(c.color.mix(foreground.color, cfg.r1)));
        map.set(key, m);
    }
    setColor("c1", colors[0]);
    setColor("c2", colors[1]);
    setColor("c3", colors[2]);
    setColor("c4", colors[3]);
    setColor("c5", colors[4]);
    setColor("c6", colors[5]);
    setColor("c7", colors[6]);
    map.set("red", map.get(`c${order[0] + 1}`));
    map.set("yellow", map.get(`c${order[1] + 1}`));
    map.set("green", map.get(`c${order[2] + 1}`));
    map.set("cyan", map.get(`c${order[3] + 1}`));
    map.set("blue", map.get(`c${order[4] + 1}`));
    map.set("magenta", map.get(`c${order[5] + 1}`));
    const backgroundMap = new Map();
    backgroundMap.set('o', background);
    backgroundMap.set('s', new ColorWithFormat(foreground.color.mix(background.color, 1 - cfg.r2 / 4)));
    backgroundMap.set('ss', new ColorWithFormat(foreground.color.mix(background.color, 1 - cfg.r2)));
    map.set('background', backgroundMap);
    const foregroundMap = new Map();
    foregroundMap.set('o', foreground);
    foregroundMap.set('s', new ColorWithFormat(foreground.color.mix(background.color, cfg.r2)));
    foregroundMap.set('ss', new ColorWithFormat(foreground.color.mix(background.color, cfg.r1)));
    map.set('foreground', backgroundMap);
    const todoMap = new Map();
    const todoBase = [
        new ColorWithFormat((0, color_1.default)("#FFFFFF")),
        new ColorWithFormat((0, color_1.default)("#FF0000")),
        new ColorWithFormat((0, color_1.default)("#FFFF00")),
        new ColorWithFormat((0, color_1.default)("#00FF00")),
        new ColorWithFormat((0, color_1.default)("#00FFFF")),
        new ColorWithFormat((0, color_1.default)("#0000FF")),
        new ColorWithFormat((0, color_1.default)("#FF00FF")),
        new ColorWithFormat((0, color_1.default)("#FF8000")),
        new ColorWithFormat((0, color_1.default)("#000000")),
        new ColorWithFormat((0, color_1.default)("#808080")), //gray
    ];
    lodash_1.default.each(todoBase, (c, i) => {
        todoMap.set(`base${i}`, c);
    });
    lodash_1.default.times(500, (i) => {
        todoMap.set(`c${i}`, todoBase[i % todoBase.length]);
    });
    map.set('todo', todoMap);
    lodash_1.default.each(cfg.mapping, (obj, i) => {
        const objKey = lodash_1.default.keys(obj);
        if (objKey.length !== 1) {
            throw new Error(`More than 1 key at ${i}-th obj`);
        }
        const keys = objKey[0].split(".");
        const values = obj[objKey[0]].split(".");
        const keyMap = getMapByKeys(map, keys);
        const valueMap = getMapByKeys(map, values);
        const valueObj = valueMap.get(values[values.length - 1]);
        if (valueObj === undefined) {
            throw new Error(`Cannot fetch '${values.join(".")}'`);
        }
        keyMap.set(keys[keys.length - 1], valueObj);
    });
    return mapToObj(map);
}
exports.getNamedColors = getNamedColors;
function render(template, cs, cfg = exports.defaultConfig) {
    const namedColors = getNamedColors(cs, cfg);
    return mustache_1.default.render(template, namedColors);
}
exports.render = render;
