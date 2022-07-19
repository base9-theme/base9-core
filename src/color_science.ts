import Color from 'color';
import _, { Dictionary, isString } from 'lodash';
import Mustache from 'mustache';
import { rgb, xyz, lab } from 'color-convert';
import type { RGB, LAB } from 'color-convert/conversions';
import DEFAULT_CONFIG from './default_config.json';

export { DEFAULT_CONFIG };

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
  const c1xyz = rgb.xyz.raw(c1.rgb().array() as RGB);
  const c2xyz = rgb.xyz.raw(c2.rgb().array() as RGB);
  const c1lab = xyz.lab.raw(c1xyz);
  const c2lab = xyz.lab.raw(c2xyz);
  // color convert uses 0-100 for xyz.
  const c1contrast = Math.log(c1xyz[1] + 5);
  const c2contrast = Math.log(c2xyz[1] + 5);
  const c3contrast = mixRaw(c1contrast, c2contrast, ratio);
  const c3y = Math.exp(c3contrast) - 5;
  const c3l = xyz.lab.raw([0, c3y, 0])[0];
  const c3lab: LAB = [
    c3l,
    mixRaw(c1lab[1], c2lab[1], ratio),
    mixRaw(c1lab[2], c2lab[2], ratio),
  ];
  return Color.rgb(lab.rgb(c3lab));
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
];


function getTrueColorOrder(colors: Color[], goals: {name: string, goal: Color}[] = ABSOLUTE_COLORS) {
  let average = [0,0,0];
  for(const c of colors) {
      const c_lab = c.lab().array();
      average[0] += c_lab[0];
      average[1] += c_lab[1];
      average[2] += c_lab[2];
  }
  average = [average[0]/colors.length, average[1]/colors.length, average[2]/colors.length];
  let min = Infinity;
  let minOrder: number[] = [];
  iteratePermutations((order) => {
    //Do not consider orders that ignores primary or secondary color.
    if(order[6] < 2) {
      return;
    }
    let distance = 0;
    _.times(6, i => {
        const c = colors[order[0]].lab().array() as LAB;
        c[0] -= average[0];
        c[1] -= average[1];
        c[2] -= average[2];
        const lch = lab.lch(c);
        const lch2 = ABSOLUTE_COLORS[i].goal.lch().array();
        const diff = [lch[0]-lch2[0],lch[1]-lch2[1],lch[2]-lch2[2]];

        distance += Math.sqrt(diff[0]*diff[0]*0 + diff[1]*diff[1]*1 + diff[2]*diff[2]*6);
    });

    if (min > distance) {
      min = distance;
      minOrder = order.slice();
    }
    _.times(6)
  });
  
}