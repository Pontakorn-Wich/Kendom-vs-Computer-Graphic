/**
 * @param {number} x0 - Starting x coordinate
 * @param {number} y0 - Starting y coordinate
 * @param {number} x1 - Ending x coordinate
 * @param {number} y1 - Ending y coordinate
 * @returns {Array} Array of [x, y] coordinate pairs representing the line pixels
 */
function bresenhamLine(x0, y0, x1, y1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const pixels = [];
    
    let dx = x1 - x0;
    let dy = y1 - y0;

    const sx = dx > 0 ? 1 : -1;
    const sy = dy > 0 ? 1 : -1;
    
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    
    if (dx > dy) {
        let d = 2 * dy - dx; 
        const dD = 2 * dy;
        const dU = 2 * (dy - dx);
        
        let x = x0;
        let y = y0;
        
        pixels.push([x, y]);
        
        while (x !== x1) {
            if (d < 0) {
                d = d + dD;
                x = x + sx;
            } else {
                d = d + dU;
                x = x + sx;
                y = y + sy;
            }
            pixels.push([x, y]);
        }
    } else {
        let d = 2 * dx - dy;
        const dD = 2 * dx;
        const dU = 2 * (dx - dy);
        
        let x = x0;
        let y = y0;
        
        pixels.push([x, y]);
        
        while (y !== y1) {
            if (d < 0) {
                d = d + dD;
                y = y + sy;
            } else {
                d = d + dU;  
                x = x + sx;
                y = y + sy;
            }
            pixels.push([x, y]);
        }
    }
    
    return pixels;
}
