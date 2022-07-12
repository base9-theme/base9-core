import Color from 'color';
import { Dictionary } from 'lodash';
export declare type ColorPalette = [
    Color,
    Color,
    Color,
    Color,
    Color,
    Color,
    Color,
    Color,
    Color
];
export declare const PALETTE_REGEX: RegExp;
export declare function toPaletteString(colors: ColorPalette): string;
export declare function fromPaletteString(palette: string): ColorPalette | undefined;
declare type Semantic = Dictionary<string | Semantic>;
declare type Config = {
    semantic: Semantic;
    shades: {
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p125: number;
    };
};
export declare const DEFAULT_CONFIG: Config;
export declare const FORMATS: {
    hex(c: Color): string;
    hex_bgr(c: Color): string;
    hex_r(c: Color): string;
    hex_g(c: Color): string;
    hex_b(c: Color): string;
    int_r(c: Color): string;
    int_g(c: Color): string;
    int_b(c: Color): string;
    dec_r(c: Color): string;
    dec_g(c: Color): string;
    dec_b(c: Color): string;
};
declare type NestedObj<T> = Dictionary<T | NestedObj<T>>;
export declare type ColorData = NestedObj<Color>;
export declare function colorDataToFormatted(obj: ColorData): NestedObj<string>;
export declare function getColorData(palette: Color[], cfg?: Config): ColorData;
export declare function render(template: string, cs: Color[], cfg?: Config): string;
export {};
