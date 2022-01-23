import Color from 'color';
import { Dictionary } from 'lodash';
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
declare type Semantic = Dictionary<string | undefined>[];
declare type Config = {
    mapping: Semantic;
    r1: number;
    r2: number;
    todoSize: number;
};
export declare const defaultConfig: Config;
export declare function getNamedColors(palette: Color[], cfg?: Config): NamedColors;
export declare type NamedColors = {
    [k: string]: ColorWithFormat | NamedColors | undefined;
};
export declare function render(template: string, cs: Color[], cfg?: Config): string;
export {};
