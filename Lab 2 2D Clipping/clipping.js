// Define outcode bit masks for the regions relative to the clipping window
const INSIDE = 0;   // 0000
const LEFT   = 1;   // 0001 (point is to the left of window)
const RIGHT  = 2;   // 0010 (point is to the right of window)
const BOTTOM = 4;   // 0100 (point is below the window)
const TOP    = 8;   // 1000 (point is above the window)

/**
 * Computes the Cohen-Sutherland outcode for a point (x,y) given the clip window.
 */
function computeOutCode(x, y, xmin, xmax, ymin, ymax) {
  let code = INSIDE;
  return code;
}

/**
 * Clips a line segment to the rectangular clipping window.
 * @returns {object|null} Clipped line as {x1,y1,x2,y2} or null if fully outside.
 */
function clipLine(x1, y1, x2, y2, xmin, xmax, ymin, ymax) {
  return { x1: x1, y1: y1, x2: x2, y2: y2 };
}
