/**
@param {number} 
@param {number} 
@param {number} 
@returns {Array} 
 */

function bresenhamCircle(xc, yc, r) {
    // Round to integers
    xc = Math.round(xc);
    yc = Math.round(yc);
    r = Math.round(r);

    const pixels = [];
    
    let x = 0;
    let y = r;
    let p = 1 - r;  /* initial decision parameter */
    
    // Helper function to add all 8 symmetric points
    function plotCirclePoints(xc, yc, x, y) {
        pixels.push([xc + x, yc + y]);  
        pixels.push([xc - x, yc + y]);  
        pixels.push([xc + x, yc - y]);  
        pixels.push([xc - x, yc - y]);  
        pixels.push([xc + y, yc + x]);  
        pixels.push([xc - y, yc + x]);  
        pixels.push([xc + y, yc - x]);  
        pixels.push([xc - y, yc - x]);  
    }
    
    plotCirclePoints(xc, yc, x, y);
    
    while (x < y) {
        x++;
        if (p < 0) {
            p = p + 2 * x + 1;
        } else {
            y--;
            p = p + 2 * (x - y) + 1;
        }
        
        plotCirclePoints(xc, yc, x, y);
    }
    
    return pixels;
}
