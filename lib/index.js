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
exports.render = exports.getColorData = exports.colorDataToFormatted = exports.FORMATS = exports.DEFAULT_CONFIG = exports.fromPaletteString = exports.toPaletteString = exports.PALETTE_REGEX = void 0;
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
    const c1xyz = color_convert_1.rgb.xyz.raw(c1.rgb().array());
    const c2xyz = color_convert_1.rgb.xyz.raw(c2.rgb().array());
    const c1lab = color_convert_1.xyz.lab.raw(c1xyz);
    const c2lab = color_convert_1.xyz.lab.raw(c2xyz);
    const c1contrast = Math.log(c1xyz[1] + 5);
    const c2contrast = Math.log(c2xyz[1] + 5);
    const c3contrast = mixRaw(c1contrast, c2contrast, ratio);
    const c3y = lodash_1.default.clamp(Math.exp(c3contrast) - 5, 0, 100);
    const c3l = color_convert_1.xyz.lab.raw([0, c3y, 0])[0];
    const c3lab = [
        c3l,
        mixRaw(c1lab[1], c2lab[1], ratio),
        mixRaw(c1lab[2], c2lab[2], ratio),
    ];
    const result = color_1.default.lab(c3lab).rgb();
    return color_1.default.rgb(Math.round(result.red()), Math.round(result.green()), Math.round(result.blue()));
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
const ABSOLUTE_COLORS = [
    { name: 'red', goal: (0, color_1.default)('#FF0000') },
    { name: 'yellow', goal: (0, color_1.default)('#FFFF00') },
    { name: 'green', goal: (0, color_1.default)('#00FF00') },
    { name: 'cyan', goal: (0, color_1.default)('#00FFFF') },
    { name: 'blue', goal: (0, color_1.default)('#0000FF') },
    { name: 'magenta', goal: (0, color_1.default)('#FF00FF') },
];
function getTrueColorOrder(colors) {
    let min = Infinity;
    let minOrder = [];
    iteratePermutations((order) => {
        if (order[6] < 2) {
            return;
        }
        const diff = difference(colors[order[0]], ABSOLUTE_COLORS[0].goal)
            + difference(colors[order[1]], ABSOLUTE_COLORS[1].goal)
            + difference(colors[order[2]], ABSOLUTE_COLORS[2].goal)
            + difference(colors[order[3]], ABSOLUTE_COLORS[3].goal)
            + difference(colors[order[4]], ABSOLUTE_COLORS[4].goal)
            + difference(colors[order[5]], ABSOLUTE_COLORS[5].goal);
        if (min > diff) {
            min = diff;
            minOrder = order.slice();
        }
    });
    return minOrder;
}
exports.DEFAULT_CONFIG = {
    semantic: semantic_json_1.default,
    shades: {
        p10: 0.1,
        p25: 0.25,
        p50: 0.5,
        p75: 0.75,
        p125: 1.25,
    },
};
exports.FORMATS = {
    hex(c) { return c.hex().substring(1).toLowerCase(); },
    hex_bgr(c) { const x = c.hex().substring(1); return x[4] + x[5] + x[2] + x[3] + x[0] + x[1]; },
    hex_r(c) { return c.hex().substring(1, 3).toLocaleLowerCase(); },
    hex_g(c) { return c.hex().substring(3, 5).toLocaleLowerCase(); },
    hex_b(c) { return c.hex().substring(5, 7).toLocaleLowerCase(); },
    int_r(c) { return c.red().toString(); },
    int_g(c) { return c.green().toString(); },
    int_b(c) { return c.blue().toString(); },
    dec_r(c) { return (c.red() / 255).toString(); },
    dec_g(c) { return (c.green() / 255).toString(); },
    dec_b(c) { return (c.blue() / 255).toString(); },
};
function formatColorData(obj, f) {
    return lodash_1.default.mapValues(obj, v => {
        if (v instanceof color_1.default) {
            return f(v);
        }
        else {
            return formatColorData(v, f);
        }
    });
}
function colorDataToFormatted(obj) {
    return lodash_1.default.mapValues(obj, v => {
        if (v instanceof color_1.default) {
            return lodash_1.default.mapValues(exports.FORMATS, f => f(v));
        }
        else {
            return colorDataToFormatted(v);
        }
    });
    return lodash_1.default.mapValues(exports.FORMATS, (f) => formatColorData(obj, f));
}
exports.colorDataToFormatted = colorDataToFormatted;
function mapToObj(map) {
    const entries = lodash_1.default.map(Array.from(map.entries()), ([k, v]) => {
        if (v instanceof color_1.default) {
            return [k, v];
        }
        return [k, mapToObj(v)];
    });
    return Object.fromEntries(entries);
}
function getColorData(palette, cfg = exports.DEFAULT_CONFIG) {
    const background = palette[0];
    const foreground = palette[1];
    const colors = palette.slice(2);
    const order = getTrueColorOrder(colors);
    const map = new Map();
    function setColor(key, c) {
        const m = new Map();
        m.set('p10', customMix(background, c, cfg.shades.p10));
        m.set('p25', customMix(background, c, cfg.shades.p25));
        m.set('p50', customMix(background, c, cfg.shades.p50));
        m.set('p75', customMix(background, c, cfg.shades.p75));
        m.set('p100', c);
        m.set('p125', new color_1.default(customMix(background, c, cfg.shades.p125)));
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
    map.set(ABSOLUTE_COLORS[0].name, map.get(`c${order[0] + 1}`));
    map.set(ABSOLUTE_COLORS[1].name, map.get(`c${order[1] + 1}`));
    map.set(ABSOLUTE_COLORS[2].name, map.get(`c${order[2] + 1}`));
    map.set(ABSOLUTE_COLORS[3].name, map.get(`c${order[3] + 1}`));
    map.set(ABSOLUTE_COLORS[4].name, map.get(`c${order[4] + 1}`));
    map.set(ABSOLUTE_COLORS[5].name, map.get(`c${order[5] + 1}`));
    const todoMap = new Map();
    const todoBase = [
        (0, color_1.default)('#FFFFFF'),
        (0, color_1.default)('#FF0000'),
        (0, color_1.default)('#FFFF00'),
        (0, color_1.default)('#00FF00'),
        (0, color_1.default)('#00FFFF'),
        (0, color_1.default)('#0000FF'),
        (0, color_1.default)('#FF00FF'),
        (0, color_1.default)('#FF8000'),
        (0, color_1.default)('#000000'),
        (0, color_1.default)('#808080'),
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
                if (value === "BUILT_IN") {
                    return;
                }
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
exports.getColorData = getColorData;
function render(template, cs, cfg = exports.DEFAULT_CONFIG) {
    const colorObj = getColorData(cs, cfg);
    const data = colorDataToFormatted(colorObj);
    return mustache_1.default.render(template, colorDataToFormatted(colorObj));
}
exports.render = render;
