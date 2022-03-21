/**
 * http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 *
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h: number, s: number, l: number) {
  let r
  let g
  let b

  if (s === 0) {
    r = g = b = l // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)]
}

// convert a number to a color using hsl
export function numberToColorHsl(i: number) {
  // as the function expects a value between 0 and 100, and red = 100° and green = 0°
  // we convert the input to the appropriate hue value
  const hue = ((100 - i) * 1.2) / 360
  // we convert hsl to rgb (saturation 100%, lightness 50%)
  const rgb = hslToRgb(hue, 0.9, 0.4)
  // we format to css value and return
  return "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")"
}

export function durationPercentToClass(i: number): number {
  if (i > 90) {
    return 4
  } else if (i > 40) {
    return 3
  } else if (i > 10) {
    return 2
  }
  return 1
}

function hue2rgb(p: number, q: number, t: number) {
  if (t < 0) {
    t += 1
  }
  if (t > 1) {
    t -= 1
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t
  }
  if (t < 1 / 2) {
    return q
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6
  }
  return p
}
