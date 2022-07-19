import Color from 'color';
import _, { Dictionary, isString } from 'lodash';
import Mustache from 'mustache';
import { rgb, xyz, lab } from 'color-convert';
import type { RGB, LAB } from 'color-convert/conversions';
import DEFAULT_CONFIG from './default_config.json';

export { DEFAULT_CONFIG };

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

// purpose.variant
type Semantic = Dictionary<string|Semantic>;
type Config = {
    palette: string,
    shades: {
      p10: number,
      p25: number,
      p50: number,
      p75: number,
      p100: number,
      p125: number,
    }
    colors: Semantic,
}

export const FORMATS = {
  hex(c: Color) { return c.hex().substring(1).toLowerCase(); },

  hex_bgr(c: Color) { const x = c.hex().substring(1); return x[4] + x[5] + x[2] + x[3] + x[0] + x[1]; },

  hex_r(c: Color) { return c.hex().substring(1,3).toLocaleLowerCase(); },
  hex_g(c: Color) { return c.hex().substring(3,5).toLocaleLowerCase(); },
  hex_b(c: Color) { return c.hex().substring(5,7).toLocaleLowerCase(); },
  int_r(c: Color) { return c.red().toString(); },
  int_g(c: Color) { return c.green().toString(); },
  int_b(c: Color) { return c.blue().toString(); },
  dec_r(c: Color) { return (c.red() / 255).toString(); },

  dec_g(c: Color) { return (c.green() / 255).toString(); },

  dec_b(c: Color) { return (c.blue() / 255).toString(); },
}

type ColorMap = Map<string, Color|ColorMap>;
type NestedObj<T> = Dictionary<T|NestedObj<T>>;
export type ColorData = NestedObj<Color>;
// export type FormattedColorData = {
//   [k in keyof typeof FORMATS]: NestedObj<string>;
// };

function formatColorData(obj: ColorData, f: (c: Color) => string): NestedObj<string> {
  return _.mapValues(obj, v => {
    if(v instanceof Color) {
      return f(v);
    } else {
      return formatColorData(v, f);
    }
  })
}

export function colorDataToFormatted(obj: ColorData): NestedObj<string> {
  return _.mapValues(obj, v => {
    if(v instanceof Color) {
      return _.mapValues(FORMATS, f => f(v));
    } else {
      return colorDataToFormatted(v);
    }
  });

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
  const background = palette[0];
  const foreground = palette[1];
  const colors = palette.slice(2);
  const order = getTrueColorOrder(colors, ABSOLUTE_COLORS);
  const map: ColorMap = new Map();

  function setColor(key: string, c: Color) {
    const m = new Map<string, Color>();
    _.forIn(cfg.shades, (v, k) => {
        m.set(k, customMix(background, c, v));
    })
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

  iterateSemantic(cfg.colors, map);
  return mapToObj(map);
}

export function render(template: string, cs: Color[], cfg: Config = DEFAULT_CONFIG) {
  const colorObj = getColorData(cs, cfg);
  const data = colorDataToFormatted(colorObj)
  return Mustache.render(template, colorDataToFormatted(colorObj));
}
