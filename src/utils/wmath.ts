// @ts-nocheck


export const tau: number = Math.PI * 2.0
export const pi: number = Math.PI
export const halfPi: number = Math.PI/2


export function max(a: number, b: number): number {
  return Math.max(a, b)
}



// export const nkingSin = (x: number) => {
//   const sq = (x: number) => x * x;
//   const step = (a: number, b: number) => {
//     if (a < b) return 0;
//     else return 1;
//   };
//    val - Math.floor(val)
//   return (sq(((x % pi) * 2) / pi - 1) - 1) * (1 - 2 * step(x % (2 * pi), pi));
// };

const r2pi = 0.63661977236;

export const nkingSin = (x: number) => {
  const xtau = x*tau
  if ((xtau - Math.floor(xtau)) > pi) {
    const mod = (x - pi) * r2pi - 1;
    return mod*mod - 1;
  } else {
    const mod = x * r2pi - 1;
    return 1 - mod*mod;
  }
};

const smoothsin = (x: number) => {
  const b = x * x * (3.0 - 2.0 * x);
  const a = x * (3 - 1.0 * x);
  return a + (b - a) * b;
};
const oneOverHalfPi = 1 / (pi / 2);
export const fastSin = (x: number) => {
  x *= oneOverHalfPi;

  const id = Math.floor(x);
  x = x % 1;

  let side = 1;
  if ((id - 2) % 4 < 2) {
    side = -1;
  }
  if (id % 2 === 1) {
    x = 1 - x;
  }
  let approx = smoothsin(x);
  approx *= side;
  return approx;
};



export function quantize(a: number, b:number): number{

  return Math.floor(a/b)*b
}

export function dmod(a:number, b:number, c?:number = 2){
  return max(mod(a,b) - b + 2,0)
}

export function abs(a: number): number {
  return Math.abs(a)
}

export function tri(a: number): number {
  const fr = a - Math.floor(a)
  return abs(fr - 0.5)*2. - 1
}

export function floor(a: number): number {
  return Math.floor(a)
}

export function ceil(a: number): number {
  return Math.ceil(a)
}
// export function floorVec2(a: Vector2): number {
//   return new Vector2(floor(a.x), floor(a.y)) 
// }
export function pow(a:number, b:number){
  return Math.pow(a,b)
}
export function wrap(a: number, from: number, to: number){
  const range = to - from
  a -= from
  a = mod(a, range)
  return from + a
}
export function fract(a:number){
  return mod(a,1)
}

export const lerp = ( a, b, x ) => a + ( b - a ) * x;
export const clamp = ( x, l, h ) => Math.min( Math.max( x, l ), h );
export const saturate = ( x ) => Math.min( Math.max( x, 0.0 ), 1.0 );
export const linearstep = ( a, b, x ) => saturate( ( x - a ) / ( b - a ) );
export const smoothstep = ( a, b, x ) => {
  const t = linearstep( a, b, x );
  return t * t * ( 3.0 - 2.0 * t );
};

// From dave hoskins on shadertoy
export class Hash{
  static h11(p:number):number {
      p = fract(p * .1031);
      p *= p + 33.33;
      p *= p + p;
      return fract(p);
  }
}



export function valueNoise(a: number){
  const fla = floor(a)
  const ceila = fla + 1 
  const rcurr = Hash.h11(fla)
  const rnext = Hash.h11(ceila)
  let fr = fract(a)
  fr = smoothstep(0.,1.,fr);
  return lerp(rcurr, rnext,fr)
}

export function valueNoisePow(a: number, b:number){
  const fla = floor(a)
  const ceila = fla + 1 
  const rcurr = Hash.h11(fla)
  const rnext = Hash.h11(ceila)
  let fr = fract(a)
  fr = smoothstep(0.,1.,fr);
  fr = pow(fr,b)
  return lerp(rcurr, rnext,fr)
}
export function rand(){return Math.random()}


// Some easing functions
class Ease {
  // no easing, no acceleration
  static linear(t: number): number {
    return 0
    // (t) => t
  }
  // accelerating from zero velocity
  static easeInQuad(t: number): number {
    return t * t
  }
  // decelerating to zero velocity
  static easeOutQuad(t: number): number {
    return t * (2 - t)
  }
  // acceleration until halfway, then deceleration
  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
  // accelerating from zero velocity
  static easeInCubic(t: number): number {
    return t * t * t
  }
  // decelerating to zero velocity
  static easeOutCubic(t: number): number {
    return --t * t * t + 1
  }
  // acceleration until halfway, then deceleration
  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }
  // accelerating from zero velocity
  static easeInQuart(t: number): number {
    return t * t * t * t
  }
  // decelerating to zero velocity
  static easeOutQuart(t: number): number {
    return 1 - --t * t * t * t
  }
  // acceleration until halfway, then deceleration
  static easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t
  }
  // accelerating from zero velocity
  static easeInQuint(t: number): number {
    return t * t * t * t * t
  }
  // decelerating to zero velocity
  static easeOutQuint(t: number): number {
    return 1 + --t * t * t * t * t
  }
  // acceleration until halfway, then deceleration
  static easeInOutQuint(t: number): number {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t
  }
  static easeInElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3

    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
  }
  static easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }
  // easeInOutElastic: t => {
  //   var s = 2 * t - 1 // remap: [0,0.5] -> [-1,0]
  //   var k = ((80 * s - 9) * Math.PI) / 18 // and    [0.5,1] -> [0,+1]
  //   if (s < 0) return -0.5 * Math.pow(2, 10 * s) * Math.sin(k)
  //   else return 1 + 0.5 * Math.pow(2, -10 * s) * Math.sin(k)
  // },
}
// export class WMath {
//   static macos(x: number) {
//     return Math.acos(x)
//   }
//   static masin(x: number) {
//     return Math.asin(x)
//   }
//   static matan(y, x) {
//     return Math.atan2(y, x)
//   }
//   static mcos(x) {
//     return Math.cos(x)
//   }
//   static msin(x) {
//     return Math.sin(x)
//   }
//   static cos2(x) {
//     return [Math.cos(x[0]), Math.cos(x[1])]
//   }
//   static cos3(x) {
//     return [Math.cos(x[0]), Math.cos(x[1]), Math.cos(x[2])]
//   }
//   static sin2(x) {
//     return [Math.sin(x[0]), Math.sin(x[1])]
//   }
//   static sin3(x) {
//     return [Math.sin(x[0]), Math.sin(x[1]), Math.sin(x[2])]
//   }
//   static sin4(x) {
//     return [Math.sin(x[0]), Math.sin(x[1]), Math.sin(x[2]), Math.sin(x[3])]
//   }
//   static SC(x) {
//     return [Math.sin(x), Math.cos(x)]
//   }
//   static add2(a, b) {
//     return [a[0] + b[0], a[1] + b[1]]
//   }
//   static add3(a, b) {
//     return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
//   }
//   static add31(a, b) {
//     return [a[0] + b, a[1] + b, a[2] + b]
//   }
//   static add4(a, b) {
//     return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]]
//   }
//   static sub3(a, b) {
//     return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
//   }
//   static sub2(a, b) {
//     return [a[0] - b[0], a[1] - b[1]]
//   }
//   static dot3(a, b) {
//     return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
//   }
//   static abs3(a) {
//     return [a[0] > 0 ? a[0] : -a[0], a[1] > 0 ? a[1] : -a[1], a[2] > 0 ? a[2] : -a[2]]
//   }
//   static scale2(a, b) {
//     return [a[0] * b, a[1] * b]
//   }
//   static scale3(a, b) {
//     return [a[0] * b, a[1] * b, a[2] * b]
//   }
//   static scale4(a, b) {
//     return [a[0] * b, a[1] * b, a[2] * b, a[3] * b]
//   }
//   static mul3(a, b) {
//     return [a[0] * b[0], a[1] * b[1], a[2] * b[2]]
//   }
//   static mul4(a, b) {
//     return [a[0] * b[0], a[1] * b[1], a[2] * b[2], a[3] * b[3]]
//   }
//   static mymix(a, b, f) {
//     return a * (1.0 - f) + b * f
//   }
//   static mymix22(a, b, f) {
//     return [a[0] * (1.0 - f[0]) + b[0] * f[0], a[1] * (1.0 - f[1]) + b[1] * f[1]]
//   }
//   static mix1(a, b, f) {
//     return a * (1.0 - f) + b * f
//   }
//   static mix3(a, b, f) {
//     return add3(scale3(a, 1.0 - f), scale3(b, f))
//   }
//   static length2(a) {
//     return Math.sqrt(a[0] * a[0] + a[1] * a[1])
//   }
//   static length3(a) {
//     return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
//   }
//   static length4(a) {
//     return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3])
//   }
//   static normalize3(a) {
//     return scale3(a, 1.0 / length3(a))
//   }
//   static normalize4(a) {
//     return scale4(a, 1.0 / length4(a))
//   }
//   static cross(a, b) {
//     return [a[1] * b[2] - b[1] * a[2], a[2] * b[0] - b[2] * a[0], a[0] * b[1] - b[0] * a[1]]
//   }
//   G = 0.5 + Math.sqrt(5 / 4)
//   static fract1(a) {
//     return a - Math.floor(a)
//   }
//   static floor2(a) {
//     return [Math.floor(a[0]), Math.floor(a[1])]
//   }
//   static fract2(a) {
//     return [fract1(a[0]), fract1(a[1])]
//   }
//   static fract3(a) {
//     return [fract1(a[0]), fract1(a[1]), fract1(a[2])]
//   }
//   static fract4(a) {
//     return [fract1(a[0]), fract1(a[1]), fract1(a[2]), fract1(a[3])]
//   }
//   static clamp1(a, a1, a2) {
//     return a < a1 ? a1 : a > a2 ? a2 : a
//   }
//   static clamp31(a, a1, a2) {
//     return [clamp1(a[0], a1, a2), clamp1(a[1], a1, a2), clamp1(a[2], a1, a2)]
//   }
//   static rotX(ph, v) {
//     return [v[0], v[1] * mcos(ph) + v[2] * msin(ph), v[2] * mcos(ph) - v[1] * msin(ph)]
//   }
//   static rotY(ph, v) {
//     return [v[0] * mcos(ph) + v[2] * msin(ph), v[1], v[2] * mcos(ph) - v[0] * msin(ph)]
//   }
//   static rotZ(ph, v) {
//     return [v[0] * mcos(ph) + v[1] * msin(ph), v[1] * mcos(ph) - v[0] * msin(ph), v[2]]
//   }
//   static hsv2rgb(c) {
//     var K = [1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0]
//     var p = abs3(sub3(scale3(fract3(add3([c[0], c[0], c[0]], K)), 6.0), [3, 3, 3]))
//     return scale3(mix3([1, 1, 1], clamp31(sub3(p, [1, 1, 1]), 0.0, 1.0), c[1]), c[2])
//   }
// }


export function cos(a: number): number { return Math.cos(a) }; 
export function sin(a: number): number { return Math.sin(a) }; 
export function acos(a: number): number { return Math.acos(a) }; 
export function asin(a: number): number { return Math.asin(a) }; 
export function sqrt(a: number): number { return Math.sqrt(a) };

// FOR FUCKS SAKE JAVASCRIPT
export function mod(n: number, m: number) { return ((n % m) + m) % m; }

export class ArrVec {
    static sub(arr: Array<number>, val: number | Array<number>) {
        for (let idxArr = 0; idxArr < arr.length; idxArr++) {
            if (typeof val == "object") {
                arr[idxArr] -= val[idxArr];
            } else {
                arr[idxArr] -= val;
            }
        }
        return arr;
    }
    static div(arr: Array<number>, val: number | Array<number>) {
        for (let idxArr = 0; idxArr < arr.length; idxArr++) {
            if (typeof val == "object") {
                arr[idxArr] /= val[idxArr];
            } else {
                arr[idxArr] /= val;
            }
        }
        return arr;
    }
    static mul(arr: Array<number>, val: number | Array<number>) {
        for (let idxArr = 0; idxArr < arr.length; idxArr++) {
            if (typeof val == "object") {
                arr[idxArr] *= val[idxArr];
            } else {
                arr[idxArr] *= val;
            }
        }
        return arr;
    }
    static add(arr: Array<number>, val: number | Array<number>) {
        for (let idxArr = 0; idxArr < arr.length; idxArr++) {
            if (typeof val == "object") {
                arr[idxArr] += val[idxArr];
            } else {
                arr[idxArr] += val;
            }
        }
        return arr;
    }

}

export class Vec {
    v: Array<number>;
    constructor(a: number, b: number) {
        if (a == NaN || b == undefined) throw "num error"; this.v = []; this.v[0] = a; this.v[1] = b;
    }
    setX(a: number) { this.v[0] = a; };
    setY(a: number) { this.v[1] = a; };
    get x(): number { return this.v[0]; };
    get y(): number { return this.v[1]; };
    mul(b: (number | Vec)) {
        if (typeof b == "object") {
            return new Vec(this.v[0] * b.v[0], this.v[1] * b.v[1])
        } else {
            return new Vec(this.v[0] * b, this.v[1] * b);
        }
    };
    div(b: (number | Vec)) {
        if (typeof b == "object")
            return new Vec(this.v[0] / b.v[0], this.v[1] / b.v[1])
        else
            return new Vec(this.v[0] / b, this.v[1] / b);
    };
    add(b: (number | Vec)) {
        if (typeof b == "object") return new Vec(this.v[0] + b.v[0], this.v[1] + b.v[1])
        else return new Vec(this.v[0] + b, this.v[1] + b);
    };
    sub(b: (number | Vec)) {
        if (typeof b == "object") return new Vec(this.v[0] - b.v[0], this.v[1] - b.v[1])
        else return new Vec(this.v[0] - b, this.v[1] - b);
    };
    dot(b: (number | Vec)) {
        if (typeof b == "object") return (this.v[0] * b.v[0] + this.v[1] * b.v[1])
        else return (this.v[0] * b + this.v[1] * b);
    };
    fromArr(a: Array<number>) { return new Vec(a[0], a[1]); };
    len(): number { return Math.sqrt(this.x * this.x + this.y * this.y); };
    normalize(): Vec { return this.div(this.len()); };
    rot(angle: number): Vec {
        var rmat = [
            cos(angle), -sin(angle),
            sin(angle), cos(angle)
        ];
        return new Vec(
            this.x * rmat[0] + this.y * rmat[2],
            this.x * rmat[1] + this.y * rmat[3]
        );
    }
}
// function Vec(a){this.v = [a,a]}

export class Vec3 {
    v: Array<number>;
    constructor(a: number, b: number, c: number) {
        if (a == NaN || b == undefined) throw "num error";
        this.v = []; this.v[0] = a; this.v[1] = b; this.v[2] = c;
    }
    get x(): number { return this.v[0]; };
    get y(): number { return this.v[1]; };
    get z(): number { return this.v[2]; };
    setX(a: number) { this.v[0] = a; };
    setY(a: number) { this.v[1] = a; };
    setZ(a: number) { this.v[2] = a; };
    // function Vec3(a){this.v = [a,a,a]}
    add(b: (Vec3 | number)) {
        if (typeof b == "object") return new Vec3(this.v[0] + b.v[0], this.v[1] + b.v[1], this.v[2] + b.v[2])
        else return new Vec3(this.x + b, this.y + b, this.z + b);
    };
    mul(b: (Vec3 | number)) {
        if (typeof b == "object") return new Vec3(this.v[0] * b.v[0], this.v[1] * b.v[1], this.v[2] * b.v[2])
        else return new Vec3(this.x * b, this.y * b, this.z * b);
    };
    div(b: (Vec3 | number)) {
        if (typeof b == "object") return new Vec3(this.v[0] / b.v[0], this.v[1] / b.v[1], this.v[2] / b.v[2])
        else return new Vec3(this.x / b, this.y / b, this.z / b);
    };
    sub(b: (Vec3 | number)) {
        if (typeof b == "object") return new Vec3(this.v[0] - b.v[0], this.v[1] - b.v[1], this.v[2] - b.v[2])
        else return new Vec3(this.x - b, this.y - b, this.z - b);
    };
    dot(b: (Vec3 | number)) {
        if (typeof b == "object") return (this.v[0] * b.v[0] + this.v[1] * b.v[1] + this.v[2] * b.v[2])
        else return this.x * b + this.y * b + this.z * b;
    };
    cross(b: Vec3) {
        var a = this;
        return new Vec3(
            a.y * b.z - a.z * b.y,
            a.z * b.x - a.x * b.z,
            a.x * b.y - a.y * b.x
        );
    };
    len(): number { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); };
    normalize(): Vec3 { return this.div(this.len()); };
    fromArr(a: Array<number>): Vec3 { return new Vec3(a[0], a[1], a[2]); };
    rot(angle: number, axis: string): Vec3 {
        let idxa = 0; let idxb = 0;
        if (axis == 'x') {
            idxa = 1; idxb = 2;
        } else if (axis == 'y') {
            idxa = 0; idxb = 2;
        } else if (axis == 'z') {
            idxa = 0; idxb = 1;
        }
        const rotated = new Vec(this.v[idxa], this.v[idxb]).rot(angle);
        let newVec = new Vec3(this.x, this.y, this.z);
        newVec.v[idxa] = rotated.x; newVec.v[idxb] = rotated.y;
        return newVec;
    }
}

export class Vec4 {
    v: Array<number>;
    constructor(a: number, b: number, c: number, d: number) {
        if (a == NaN || b == undefined) throw "num error";
        this.v = []; this.v[0] = a; this.v[1] = b; this.v[2] = c; this.v[3] = d;
    }
    x(): number { return this.v[0]; };
    y(): number { return this.v[1]; };
    z(): number { return this.v[2]; };
    w(): number { return this.v[3]; };
    setX(a: number) { this.v[0] = a; };
    setY(a: number) { this.v[1] = a; };
    setZ(a: number) { this.v[2] = a; };
    setW(a: number) { this.v[3] = a; };
    // function Vec3(a){this.v = [a,a,a]}
    add(b: (Vec4 | number)) {
        if (typeof b == "object") return new Vec4(this.v[0] + b.v[0], this.v[1] + b.v[1], this.v[2] + b.v[2], this.v[3] + b.v[3])
        else return new Vec4(this.x() + b, this.y() + b, this.z() + b, this.w() + b);
    };
    mul(b: (Vec4 | number)) {
        if (typeof b == "object") return new Vec4(this.v[0] * b.v[0], this.v[1] * b.v[1], this.v[2] * b.v[2], this.v[3] * b.v[3])
        else return new Vec4(this.x() * b, this.y() * b, this.z() * b, this.w() * b);
    };
    div(b: (Vec4 | number)) {
        if (typeof b == "object") return new Vec4(this.v[0] / b.v[0], this.v[1] / b.v[1], this.v[2] / b.v[2], this.v[3] / b.v[3])
        else return new Vec4(this.x() / b, this.y() / b, this.z() / b, this.w() / b);
    };
    sub(b: (Vec4 | number)) {
        if (typeof b == "object") return new Vec4(this.v[0] - b.v[0], this.v[1] - b.v[1], this.v[2] - b.v[2], this.v[3] - b.v[3])
        else return new Vec4(this.x() - b, this.y() - b, this.z() - b, this.w() - b);
    };
    dot(b: (Vec4 | number)) {
        if (typeof b == "object") return (this.v[0] * b.v[0] + this.v[1] * b.v[1] + this.v[2] * b.v[2]  + this.v[3] * b.v[3])
        else return this.x() * b + this.y() * b + this.z() * b + this.w() * b;
    };

    len(): number { return Math.sqrt(this.x() * this.x() + this.y() * this.y() + this.z() * this.z() + this.w() * this.w()); };
    normalize(): Vec4 { return this.div(this.len()); };
    fromArr(a: Array<number>): Vec4 { return new Vec4(a[0], a[1], a[2], a[3]); };
    // rot(angle: number, axis: string): Vec3 {
    //     let idxa = 0; let idxb = 0;
    //     if (axis == 'x') {
    //         idxa = 1; idxb = 2;
    //     } else if (axis == 'y') {
    //         idxa = 0; idxb = 2;
    //     } else if (axis == 'z') {
    //         idxa = 0; idxb = 1;
    //     }
    //     const rotated = new Vec(this.v[idxa], this.v[idxb]).rot(angle);
    //     let newVec = new Vec4(this.x(), this.y(), this.z(), this.w());
    //     newVec.v[idxa] = rotated.x(); newVec.v[idxb] = rotated.y();
    //     return newVec;
    // }
}

class Shapes {
    cross(pos: Vec3, size: number): Array<Array<number>> {
        return [
            [pos.x + size, pos.y + size],
            [pos.x - size, pos.y - size],
            [0, 0],
            [pos.x + size, pos.y - size],
            [pos.x - size, pos.y + size],
        ]
    };

};