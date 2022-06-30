import Color from 'color';
import _, { Dictionary, isString } from 'lodash';
import Mustache from 'mustache';
import { rgb, xyz } from 'color-convert';
import type { RGB } from 'color-convert/conversions';
import semantic from './semantic.json';

/** List of 9 colors */
export type ColorPalette = [
  Color, Color, Color, Color, Color, Color, Color, Color, Color,
];

export const PALETTE_REGEX = /^([0-9a-fA-F]{6}-){8}[0-9a-fA-F]{6}$/;

export function toPaletteString(colors: ColorPalette) {
  return _.map(colors, (c) => c.hex().toString().substring(1)).join('-');
}

export function fromPaletteString(palette: string): ColorPalette | undefined {
  if (!PALETTE_REGEX.test(palette)) {
    return undefined;
  }
  return _.map(palette.split('-'), (s) => Color(`#${s}`)) as ColorPalette;
}

function mixRaw(a: number, b: number, ratio: number) {
  return a * (1 - ratio) + b * ratio;
}

/**
 * Mix two color in lab space.
 * Mix A,B linearly.
 * Mix L in it's contrast scale defined by:
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 * @param c1 first color
 * @param c2 second color
 * @param ratio 0 produces c1, 1 produces c2, number out side of [0,1] will
 * try to produce something make sense.
 * @returns mixed color
 */
function customMix(c1: Color, c2: Color, ratio: number) {
  const c1xyz = rgb.xyz(c1.rgb().array() as RGB);
  const c2xyz = rgb.xyz(c2.rgb().array() as RGB);
  const c1lab = xyz.lab(c1xyz);
  const c2lab = xyz.lab(c2xyz);
  // color convert uses 0-100 for xyz.
  const c1contrast = Math.log(c1xyz[1] + 5);
  const c2contrast = Math.log(c2xyz[1] + 5);
  const c3contrast = mixRaw(c1contrast, c2contrast, ratio);
  const c3y = _.clamp(Math.exp(c3contrast) - 5, 0, 100);
  const c3l = xyz.lab([0, c3y, 0])[0];
  const c3lab = [
    c3l,
    mixRaw(c1lab[1], c2lab[1], ratio),
    mixRaw(c1lab[2], c2lab[2], ratio),
  ];
  return Color.lab(c3lab).rgb();
}

// a = "asd",)]
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

function difference(c1: Color, c2: Color) {
  const f = Math.abs;
  const l1 = c1.rgb().array();
  const l2 = c2.rgb().array();
  return f(l1[0] - l2[0]) + f(l1[1] - l2[1]) + f(l1[2] - l2[2]);
}

function iteratePermutations(f: (order: number[]) => void) {
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
    } else {
      c[i] = 0;
      i += 1;
    }
  }
}

const ABSOLUTE_COLORS = [
  {name: 'red', goal: Color('#FF0000')},
  {name: 'yellow', goal: Color('#FFFF00')},
  {name: 'green', goal: Color('#00FF00')},
  {name: 'cyan', goal: Color('#00FFFF')},
  {name: 'blue', goal: Color('#0000FF')},
  {name: 'magenta', goal: Color('#FF00FF')},
] as const;

function getTrueColorOrder(colors: Color[]) {
  let min = Infinity;
  let minOrder: number[] = [];
  iteratePermutations((order) => {
    //Do not consider orders that ignores primary or secondary color.
    if(order[6] < 2) {
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
// purpose.variant
type Semantic = Dictionary<string|Semantic>;
type Config = {
    semantic: Semantic,
    shades: {
      p10: number,
      p25: number,
      p50: number,
      p75: number,
      p125: number,
    }
}
export const DEFAULT_CONFIG: Config = {
  semantic: semantic,
  shades: {
    p10: 0.1,
    p25: 0.25,
    p50: 0.5,
    p75: 0.75,
    p125: 1.25,
  },
};

export const FORMATS = {
  hex(c: Color) { return c.hex().substring(1); },

  hex_bgr(c: Color) { const x = c.hex().substring(1); return x[4] + x[5] + x[2] + x[3] + x[0] + x[1]; },

  hex_r(c: Color) { return c.red().toString(16).padStart(2, '0'); },

  hex_g(c: Color) { return c.green().toString(16).padStart(2, '0'); },

  hex_b(c: Color) { return c.blue().toString(16).padStart(2, '0'); },

  dec_r(c: Color) { return c.red().toString(); },

  dec_g(c: Color) { return c.green().toString(); },

  dec_b(c: Color) { return c.blue().toString(); },

  frac_r(c: Color) { return (c.red() / 255).toString(); },

  frac_g(c: Color) { return (c.green() / 255).toString(); },

  frac_b(c: Color) { return (c.blue() / 255).toString(); },
}

type ColorMap = Map<string, Color|ColorMap>;
type NestedObj<T> = Dictionary<T|NestedObj<T>>;
export type ColorData = NestedObj<Color>;
export type FormattedColorData = {
  [k in keyof typeof FORMATS]: NestedObj<string>;
};

function formatColorData(obj: ColorData, f: (c: Color) => string): NestedObj<string> {
  return _.mapValues(obj, v => {
    if(v instanceof Color) {
      return f(v);
    } else {
      return formatColorData(v, f);
    }
  })
}

function colorDataToFormatted(obj: ColorData): FormattedColorData {
  return _.mapValues(FORMATS, (f: (c: Color) => string) => formatColorData(obj, f));
}

function mapToObj(map: ColorMap): ColorData {
  const entries = _.map(
    Array.from(map.entries()),
    ([k, v]): [string, ColorData|Color] => {
      if (v instanceof Color) {
        return [k, v];
      }
      return [k, mapToObj(v)];
    },
  );

  return Object.fromEntries(entries);
}

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};

export function getColorData(palette: Color[], cfg: Config = DEFAULT_CONFIG): ColorData {
  // const cfg = DEFAULT_CONFIG;
  const background = palette[0];
  const foreground = palette[1];
  const colors = palette.slice(2);
  const order = getTrueColorOrder(colors);
  const map: ColorMap = new Map();

  function setColor(key: string, c: Color) {
    const m = new Map<string, Color>();
    m.set('p10', customMix(background, c, cfg.shades.p10));
    m.set('p25', customMix(background, c, cfg.shades.p25));
    m.set('p50', customMix(background, c, cfg.shades.p50));
    m.set('p75', customMix(background, c, cfg.shades.p75));
    m.set('p100', c);
    m.set('p125', new Color(customMix(background, c, cfg.shades.p125)));
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

  map.set(ABSOLUTE_COLORS[0].name, map.get(`c${order[0] + 1}`)!);
  map.set(ABSOLUTE_COLORS[1].name, map.get(`c${order[1] + 1}`)!);
  map.set(ABSOLUTE_COLORS[2].name, map.get(`c${order[2] + 1}`)!);
  map.set(ABSOLUTE_COLORS[3].name, map.get(`c${order[3] + 1}`)!);
  map.set(ABSOLUTE_COLORS[4].name, map.get(`c${order[4] + 1}`)!);
  map.set(ABSOLUTE_COLORS[5].name, map.get(`c${order[5] + 1}`)!);

  const todoMap = new Map<string, Color>();
  const todoBase = [
    Color('#FFFFFF'), // white
    Color('#FF0000'), // red
    Color('#FFFF00'), // yellow
    Color('#00FF00'), // green
    Color('#00FFFF'), // cyan
    Color('#0000FF'), // blue
    Color('#FF00FF'), // magenta
    Color('#FF8000'), // orange
    Color('#000000'), // black
    Color('#808080'), // gray
  ];
  _.each(todoBase, (c, i) => {
    todoMap.set(`base${i}`, c);
  });
  _.times(500, (i) => {
    todoMap.set(`c${i}`, todoBase[i % todoBase.length]);
  });
  map.set('todo', todoMap);

  function iterateSemantic(s: Semantic, currentMap: ColorMap) {
    _.each(Object.entries(s), ([key, value]) => {
      if (isString(value)) {
        if(value === "BUILT_IN") {
          return;
        }
        const values = value.split('.');
        let ptr: ColorMap|Color= map;
        _.each(values, (v) => { ptr = (ptr as ColorMap).get(v)!; });
        currentMap.set(key, ptr);
      } else {
        const map2: ColorMap = new Map();
        currentMap.set(key, map2);
        iterateSemantic(value, map2);
      }
    });
  }

  iterateSemantic(cfg.semantic, map);
  return mapToObj(map);
}

export function render(template: string, cs: Color[], cfg: Config = DEFAULT_CONFIG) {
  const colorObj = getColorData(cs, cfg);
  return Mustache.render(template, colorDataToFormatted(colorObj));
}
