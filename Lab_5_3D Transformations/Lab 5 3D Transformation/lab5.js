window.onload = () => {
    main();
};

async function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert("Unable to initialize WebGL.");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1.0);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const [vsSource, fsSource] = await Promise.all([
        fetch('shaders/vertex.glsl').then(res => res.text()),
        fetch('shaders/fragment.glsl').then(res => res.text())
    ]);

    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    
    // Link shaders into a program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return;
    }
    gl.useProgram(program);

    let tx = 0.0, ty = 0.0, tz = -5.0;
    let rotX = 0.0, rotY = 0.0, rotZ = 0.0;
    let scale = 1.0;

    const transStep = 0.2;
    const rotStep = 5.0;
    const scaleStep = 0.1;

    // Coordinates of 8 cube corners
    const vertices = [
        // x, y, z
        -1.0, -1.0, -1.0,   // 0
        -1.0, -1.0, 1.0,    // 1
        -1.0, 1.0, -1.0,    // 2
        -1.0, 1.0, 1.0,     // 3
        1.0, -1.0, -1.0,    // 4
        1.0, -1.0, 1.0,     // 5
        1.0, 1.0, -1.0,     // 6
        1.0, 1.0, 1.0,      // 7
    ];
    const indices = [
        1, 5, 7, 1, 7, 3,
        5, 7, 3, 5, 1, 3,
        0, 6, 4, 0, 2, 6,
        4, 6, 2, 0, 2, 4,
        0, 3, 2, 0, 1, 3,
        1, 2, 3, 2, 0, 1,
        4, 7, 5, 4, 6, 7,
        5, 7, 6, 4, 5, 6,
        2, 3, 7, 2, 7, 6,
        3, 7, 6, 2, 3, 6,
        0, 4, 5, 0, 5, 1,
        4, 1, 5, 4, 0, 1
    ];

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    const uMatrixLoc = gl.getUniformLocation(program, "uMatrix");
    const projMatrix = matPerspective(60.0, canvas.width / canvas.height, 0.1, 100.0);

    const uColorLoc = gl.getUniformLocation(program, 'u_color');
    gl.uniform4f(uColorLoc, 1.0, 0.0, 1.0, 1.0);

    function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let modelMatrix = matIdentity();
        // Coding for transforming object here.

        const mvpMatrix = matMultiply(projMatrix, modelMatrix);
        gl.uniformMatrix4fv(uMatrixLoc, false, mvpMatrix);
        gl.uniform4f(uColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        gl.uniform4f(uColorLoc, 0.0, 0.0, 1.0, 1.0);
        gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    drawScene();

    document.addEventListener('keydown', (event) => {
        const key = event.key;
        switch (key) {
            // w: move up
            // s: move down
            // a: move left
            // d: move right
            // r: move forward (into screen)
            // f: move backward (out of screen)
            // ArrowUp: rotate around X-axis (+)
            // ArrowDown: rotate around X-axis (-)
            // ArrowLeft: rotate around Y-axis (-)
            // ArrowRight: rotate around Y-axis (+)
            // q: rotate around Z-axis (-)
            // e: rotate around Z-axis (+)
            // t: enlarge
            // g: shrink
            default:
        }
        // Redraw scene with updated parameters
        drawScene();
    });
}

function compileShader(gl, source, shaderType) {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
