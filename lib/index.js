"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = exports.getNamedColors = exports.defaultConfig = exports.fromPaletteString = exports.toPaletteString = exports.PALETTE_REGEX = void 0;
const color_1 = __importDefault(require("color"));
const lodash_1 = __importStar(require("lodash"));
const mustache_1 = __importDefault(require("mustache"));
const color_convert_1 = require("color-convert");
const semantic_json_1 = __importDefault(require("./semantic.json"));
exports.PALETTE_REGEX = /^([0-9a-fA-F]{6}-){8}[0-9a-fA-F]{6}$/;
function toPaletteString(colors) {
    return lodash_1.default.map(colors, (c) => c.hex().toString().substring(1)).join('-');
}
exports.toPaletteString = toPaletteString;
function fromPaletteString(palette) {
    if (!exports.PALETTE_REGEX.test(palette)) {
        return undefined;
    }
    return lodash_1.default.map(palette.split('-'), (s) => (0, color_1.default)(`#${s}`));
}
exports.fromPaletteString = fromPaletteString;
function mixRaw(a, b, ratio) {
    return a * (1 - ratio) + b * ratio;
}
function customMix(c1, c2, ratio) {
    const c1xyz = color_convert_1.rgb.xyz(c1.rgb().array());
    const c2xyz = color_convert_1.rgb.xyz(c2.rgb().array());
    const c1lab = color_convert_1.xyz.lab(c1xyz);
    const c2lab = color_convert_1.xyz.lab(c2xyz);
    const c1contrast = Math.log(c1xyz[1] + 5);
    const c2contrast = Math.log(c2xyz[1] + 5);
    const c3contrast = mixRaw(c1contrast, c2contrast, ratio);
    const c3y = lodash_1.default.clamp(Math.exp(c3contrast) - 5, 0, 100);
    const c3l = color_convert_1.xyz.lab([0, c3y, 0])[0];
    const c3lab = [
        c3l,
        mixRaw(c1lab[1], c2lab[1], ratio),
        mixRaw(c1lab[2], c2lab[2], ratio),
    ];
    return color_1.default.lab(c3lab).rgb();
}
class ColorWithFormat {
    constructor(color) {
        this.color = color;
    }
    get hex() { return this.color.hex().substring(1); }
    get hexbgr() { const x = this.hex; return x[4] + x[5] + x[2] + x[3] + x[0] + x[1]; }
    get hexr() { return this.color.red().toString(16).padStart(2, '0'); }
    get hexg() { return this.color.green().toString(16).padStart(2, '0'); }
    get hexb() { return this.color.blue().toString(16).padStart(2, '0'); }
    get decr() { return this.color.red().toString(); }
    get decg() { return this.color.green().toString(); }
    get decb() { return this.color.blue().toString(); }
    get fracr() { return (this.color.red() / 255).toString(); }
    get fracg() { return (this.color.green() / 255).toString(); }
    get fracb() { return (this.color.blue() / 255).toString(); }
}
function difference(c1, c2) {
    const f = Math.abs;
    const l1 = c1.rgb().array();
    const l2 = c2.rgb().array();
    return f(l1[0] - l2[0]) + f(l1[1] - l2[1]) + f(l1[2] - l2[2]);
}
function iteratePermutations(f) {
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
    (0, color_1.default)('#FF0000'),
    (0, color_1.default)('#FFFF00'),
    (0, color_1.default)('#00FF00'),
    (0, color_1.default)('#00FFFF'),
    (0, color_1.default)('#0000FF'),
    (0, color_1.default)('#FF00FF'),
];
function getTrueColorOrder(colors) {
    let min = Infinity;
    let minOrder = [];
    iteratePermutations((order) => {
        const diff = difference(colors[order[0]].color, hues[0])
            + difference(colors[order[1]].color, hues[1])
            + difference(colors[order[2]].color, hues[2])
            + difference(colors[order[3]].color, hues[3])
            + difference(colors[order[4]].color, hues[4])
            + difference(colors[order[5]].color, hues[5]);
        if (min > diff) {
            min = diff;
            minOrder = order.slice();
        }
    });
    return minOrder;
}
exports.defaultConfig = {
    semantic: semantic_json_1.default,
    shades: {
        p10: 0.1,
        p25: 0.25,
        p50: 0.5,
        p75: 0.75,
        p125: 1.25,
    },
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
                throw new Error(`${keys.slice(0, i)} is already a color when writing ${keys.join('.')}`);
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
    const entries = lodash_1.default.map(Array.from(map.entries()), ([k, v]) => {
        if (isColorWithFormat(v)) {
            return [k, v];
        }
        return [k, mapToObj(v)];
    });
    return Object.fromEntries(entries);
}
function getNamedColors(palette, cfg = exports.defaultConfig) {
    const paletteWithFormat = lodash_1.default.map(palette, (c) => new ColorWithFormat(c));
    const background = paletteWithFormat[0];
    const foreground = paletteWithFormat[1];
    const colors = paletteWithFormat.slice(2);
    const order = getTrueColorOrder(colors);
    const map = new Map();
    function setColor(key, c) {
        const m = new Map();
        m.set('p10', new ColorWithFormat(customMix(background.color, c.color, cfg.shades.p10)));
        m.set('p25', new ColorWithFormat(customMix(background.color, c.color, cfg.shades.p25)));
        m.set('p50', new ColorWithFormat(customMix(background.color, c.color, cfg.shades.p50)));
        m.set('p75', new ColorWithFormat(customMix(background.color, c.color, cfg.shades.p75)));
        m.set('p100', c);
        m.set('p125', new ColorWithFormat(customMix(background.color, c.color, cfg.shades.p125)));
        map.set(key, m);
    }
    map.set('background', background);
    setColor('foreground', foreground);
    setColor('c1', colors[0]);
    setColor('c2', colors[1]);
    setColor('c3', colors[2]);
    setColor('c4', colors[3]);
    setColor('c5', colors[4]);
    setColor('c6', colors[5]);
    setColor('c7', colors[6]);
    map.set('red', map.get(`c${order[0] + 1}`));
    map.set('yellow', map.get(`c${order[1] + 1}`));
    map.set('green', map.get(`c${order[2] + 1}`));
    map.set('cyan', map.get(`c${order[3] + 1}`));
    map.set('blue', map.get(`c${order[4] + 1}`));
    map.set('magenta', map.get(`c${order[5] + 1}`));
    const todoMap = new Map();
    const todoBase = [
        new ColorWithFormat((0, color_1.default)('#FFFFFF')),
        new ColorWithFormat((0, color_1.default)('#FF0000')),
        new ColorWithFormat((0, color_1.default)('#FFFF00')),
        new ColorWithFormat((0, color_1.default)('#00FF00')),
        new ColorWithFormat((0, color_1.default)('#00FFFF')),
        new ColorWithFormat((0, color_1.default)('#0000FF')),
        new ColorWithFormat((0, color_1.default)('#FF00FF')),
        new ColorWithFormat((0, color_1.default)('#FF8000')),
        new ColorWithFormat((0, color_1.default)('#000000')),
        new ColorWithFormat((0, color_1.default)('#808080')),
    ];
    lodash_1.default.each(todoBase, (c, i) => {
        todoMap.set(`base${i}`, c);
    });
    lodash_1.default.times(500, (i) => {
        todoMap.set(`c${i}`, todoBase[i % todoBase.length]);
    });
    map.set('todo', todoMap);
    function iterateSemantic(s, currentMap) {
        lodash_1.default.each(Object.entries(s), ([key, value]) => {
            if ((0, lodash_1.isString)(value)) {
                const values = value.split('.');
                let ptr = map;
                lodash_1.default.each(values, (v) => { ptr = ptr.get(v); });
                currentMap.set(key, ptr);
            }
            else {
                const map2 = new Map();
                currentMap.set(key, map2);
                iterateSemantic(value, map2);
            }
        });
    }
    iterateSemantic(cfg.semantic, map);
    return mapToObj(map);
}
exports.getNamedColors = getNamedColors;
function render(template, cs, cfg = exports.defaultConfig) {
    const namedColors = getNamedColors(cs, cfg);
    return mustache_1.default.render(template, namedColors);
}
exports.render = render;
