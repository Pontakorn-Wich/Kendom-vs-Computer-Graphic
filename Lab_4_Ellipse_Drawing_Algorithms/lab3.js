// ── Ellipse helpers ──────────────────────────────────────────
function _plot4(px, xc, yc, x, y) {
    px.push([xc+x, yc+y], [xc-x, yc+y], [xc+x, yc-y], [xc-x, yc-y]);
}

// Midpoint Ellipse – Carpenter
// Region 1 (top arc): increment x; Region 2 (side arc): decrement y
// d1 uses floating-point 0.25*a²; d2 uses (x+0.5)² — one rounding
function carpenterMidpointEllipse(xc, yc, a, b) {
    xc = Math.round(xc); yc = Math.round(yc);
    a  = Math.round(Math.abs(a)); b = Math.round(Math.abs(b));
    const px = [], a2 = a*a, b2 = b*b;
    let x = 0, y = b;
    _plot4(px, xc, yc, x, y);
    // Region 1
    let d1 = b2 - a2*b + 0.25*a2;
    while (a2*(y-0.5) > b2*(x+1)) {
        if (d1 < 0) { d1 += b2*(2*x+3); }
        else        { d1 += b2*(2*x+3) + a2*(-2*y+2); y--; }
        x++; _plot4(px, xc, yc, x, y);
    }
    // Region 2
    let d2 = b2*(x+0.5)*(x+0.5) + a2*(y-1)*(y-1) - a2*b2;
    while (y > 0) {
        if (d2 < 0) { d2 += b2*(2*x+2) + a2*(-2*y+3); x++; }
        else        { d2 += a2*(-2*y+3); }
        y--; _plot4(px, xc, yc, x, y);
    }
    return px;
}

// Fast Ellipse – Kennedy
// Scales decision parameter ×4 → pure integer arithmetic, zero rounding
// p  = 4b² – 4a²b + a²   (= 4 × Carpenter d1)
// p2 = b²(2x+1)² + 4a²(y-1)² – 4a²b²  (avoids (x+0.5)²)
function kennedyFastEllipse(xc, yc, a, b) {
    xc = Math.round(xc); yc = Math.round(yc);
    a  = Math.round(Math.abs(a)); b = Math.round(Math.abs(b));
    const px = [], a2 = a*a, b2 = b*b;
    let x = 0, y = b;
    _plot4(px, xc, yc, x, y);
    // Region 1
    let p = 4*b2 - 4*a2*b + a2;
    while (a2*(y-0.5) > b2*(x+1)) {
        if (p < 0) { p += 4*b2*(2*x+3); }
        else       { p += 4*b2*(2*x+3) + 4*a2*(-2*y+2); y--; }
        x++; _plot4(px, xc, yc, x, y);
    }
    // Region 2
    p = b2*(2*x+1)*(2*x+1) + 4*a2*(y-1)*(y-1) - 4*a2*b2;
    while (y > 0) {
        if (p < 0) { p += 4*b2*(2*x+2) + 4*a2*(-2*y+3); x++; }
        else       { p += 4*a2*(-2*y+3); }
        y--; _plot4(px, xc, yc, x, y);
    }
    return px;
}

// ── Main ─────────────────────────────────────────────────────
window.onload = () => { main(); };

async function main() {
    // Inject extra UI into the existing .controls div
    const controls = document.querySelector('.controls');
    controls.insertAdjacentHTML('beforeend',
        '<label><input type="radio" name="mode" value="carpenter"> Ellipse – Carpenter</label>' +
        '<label><input type="radio" name="mode" value="kennedy"> Ellipse – Kennedy</label>'
    );
    document.querySelector('canvas').insertAdjacentHTML('afterend',
        '<div id="legend" style="margin-top:6px;font-size:.88em;display:none">'
        + '<span style="color:#e00">&#9679;</span> Carpenter &nbsp; '
        + '<span style="color:#06c">&#9679;</span> Kennedy</div>'
    );

    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert("Unable to initialize WebGL.");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const [vsSource, fsSource] = await Promise.all([
        fetch('shaders/vertex.glsl').then(r => r.text()),
        fetch('shaders/fragment.glsl').then(r => r.text()),
    ]);

    const vs  = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs  = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    const posAttrLoc   = gl.getAttribLocation(program, 'a_position');
    const colorUniLoc  = gl.getUniformLocation(program, 'u_color');
    gl.enableVertexAttribArray(posAttrLoc);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0);

    const RED  = [1, 0, 0, 1];
    const BLUE = [0, 0.4, 1, 1];

    let startPoint = null;
    const shapes = [];  // each: { pixels, color }

    function getMode() {
        return document.querySelector('input[name="mode"]:checked').value;
    }

    function isEllipse(m) {
        return m === 'carpenter' || m === 'kennedy';
    }

    document.querySelectorAll('input[name="mode"]').forEach(r =>
        r.addEventListener('change', () => {
            document.getElementById('legend').style.display =
                isEllipse(getMode()) ? 'block' : 'none';
            startPoint = null;
        })
    );

    function drawShapes() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (const { pixels, color } of shapes) {
            gl.uniform4fv(colorUniLoc, color);
            const pos = [];
            for (const [x, y] of pixels) pos.push(x, y);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
            gl.drawArrays(gl.POINTS, 0, pixels.length);
        }
    }

    canvas.addEventListener('click', function (e) {
        const px = e.offsetX;
        const py = canvas.height - 1 - e.offsetY;

        if (startPoint === null) {
            startPoint = { x: px, y: py };
            return;
        }

        const cx = startPoint.x, cy = startPoint.y;
        const ex = px,           ey = py;
        startPoint = null;
        const mode = getMode();

        if (mode === 'line') {
            shapes.push({ pixels: bresenhamLine(cx, cy, ex, ey), color: RED });
        } else if (mode === 'circle') {
            const r = Math.sqrt((ex-cx)**2 + (ey-cy)**2);
            shapes.push({ pixels: bresenhamCircle(cx, cy, r), color: RED });
        } else {
            const a = Math.max(1, Math.abs(ex - cx));
            const b = Math.max(1, Math.abs(ey - cy));
            if (mode === 'carpenter') {
                shapes.push({ pixels: carpenterMidpointEllipse(cx, cy, a, b), color: RED });
            } else if (mode === 'kennedy') {
                shapes.push({ pixels: kennedyFastEllipse(cx, cy, a, b), color: BLUE });
            }
        }
        drawShapes();
    });

    document.getElementById('clearBtn').addEventListener('click', function () {
        shapes.length = 0;
        startPoint = null;
        gl.clear(gl.COLOR_BUFFER_BIT);
    });
}

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
