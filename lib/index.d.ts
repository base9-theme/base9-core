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
declare class ColorWithFormat {
    color: Color;
    constructor(color: Color);
    get hex(): string;
    get hexbgr(): string;
    get hexr(): string;
    get hexg(): string;
    get hexb(): string;
    get decr(): string;
    get decg(): string;
    get decb(): string;
    get fracr(): string;
    get fracg(): string;
    get fracb(): string;
}
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
export declare const defaultConfig: Config;
export declare type NamedColors = {
    [k: string]: ColorWithFormat | NamedColors;
};
export declare function getNamedColors(palette: Color[], cfg?: Config): NamedColors;
export declare function render(template: string, cs: Color[], cfg?: Config): string;
export {};
