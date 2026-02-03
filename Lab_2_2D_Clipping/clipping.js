// Define outcode bit masks for the regions relative to the clipping window
const INSIDE = 0;   // 0000
const LEFT = 1;   // 0001 (point is to the left of window)
const RIGHT = 2;   // 0010 (point is to the right of window)
const BOTTOM = 4;   // 0100 (point is below the window)
const TOP = 8;   // 1000 (point is above the window)

/**
 * Computes the Cohen-Sutherland outcode for a point (x,y) given the clip window.
 */
function computeOutCode(x, y, xmin, xmax, ymin, ymax) {
  let code = INSIDE;

  if (x < xmin) {
    code |= LEFT;
  } else if (x > xmax) {
    code |= RIGHT;
  }

  if (y < ymin) {
    code |= BOTTOM;
  } else if (y > ymax) {
    code |= TOP;
  }

  return code;
}

/**
 * Clips a line segment to the rectangular clipping window.
 * @returns {object|null} Clipped line as {x1,y1,x2,y2} or null if fully outside.
 */
function clipLine(x1, y1, x2, y2, xmin, xmax, ymin, ymax) {
  let outcode1 = computeOutCode(x1, y1, xmin, xmax, ymin, ymax);
  let outcode2 = computeOutCode(x2, y2, xmin, xmax, ymin, ymax);
  let accept = false;

  while (true) {
    if ((outcode1 | outcode2) === 0) {
      // Both points inside window - accept line
      accept = true;
      break;
    } else if ((outcode1 & outcode2) !== 0) {
      // Both points share an outside region - reject line
      break;
    } else {
      // Line partially inside - clip it
      let x, y;

      // Pick the point that is outside
      const outcodeOut = outcode1 !== 0 ? outcode1 : outcode2;

      // Find intersection point using line equation
      if (outcodeOut & TOP) {
        // Point is above the clip window
        x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1);
        y = ymax;
      } else if (outcodeOut & BOTTOM) {
        // Point is below the clip window
        x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1);
        y = ymin;
      } else if (outcodeOut & RIGHT) {
        // Point is to the right of clip window
        y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1);
        x = xmax;
      } else if (outcodeOut & LEFT) {
        // Point is to the left of clip window
        y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1);
        x = xmin;
      }

      // Replace outside point with intersection point
      if (outcodeOut === outcode1) {
        x1 = x;
        y1 = y;
        outcode1 = computeOutCode(x1, y1, xmin, xmax, ymin, ymax);
      } else {
        x2 = x;
        y2 = y;
        outcode2 = computeOutCode(x2, y2, xmin, xmax, ymin, ymax);
      }
    }
  }

  if (accept) {
    return { x1: x1, y1: y1, x2: x2, y2: y2 };
  } else {
    return null;
  }
}
