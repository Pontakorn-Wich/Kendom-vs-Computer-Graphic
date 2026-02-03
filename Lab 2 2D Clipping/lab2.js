window.onload = () => {
    main();
};

let clipWindow = {
    left: -0.5,
    right: 0.5,
    bottom: -0.5,
    top: 0.5
};

async function main() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert("Unable to initialize WebGL.");
        return;
    }

    // Load shader source code from files
    const [vsSource, fsSource] = await Promise.all([
        fetch('shaders/vertex.glsl').then(res => res.text()),
        fetch('shaders/fragment.glsl').then(res => res.text())
    ]);

    // Compile the vertex and fragment shaders
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

    // Look up the location of the position attribute and enable it
    const posLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLocation);

    // Create a buffer for line vertex data
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Tell the attribute how to get data out of vertexBuffer (2 floats per vertex)
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0);

    // Define a set of 2D line segments (each line as [x1, y1, x2, y2])
    const lines = [
        [-0.3, -0.2, 0.4, 0.3]
    ];

    let clippingEnabled = true;

    // Return list of vertices for clipping window
    function getClipBorderVertices() {
        return [];
    }

    // Function to update vertex buffer and draw the scene
    function render() {
        const vertices = [];
        for (const line of lines) {
            const [x1, y1, x2, y2] = line;
            if (clippingEnabled) {
                // Clip the line to the view window [-0.5,0.5]x[-0.5,0.5]
                const clipped = clipLine(x1, y1, x2, y2, clipWindow.left, clipWindow.right, clipWindow.bottom, clipWindow.top);
                if (!clipped) {
                    // Entire line is outside the window, skip drawing it
                    continue;
                }
                // Use the clipped line segment endpoints
                vertices.push(clipped.x1, clipped.y1, clipped.x2, clipped.y2);
            } else {
                // Clipping disabled: use the original line endpoints
                vertices.push(x1, y1, x2, y2);
            }
        }
        // Concatenate original/clipped lines with clipping window border
        const clipBorder = getClipBorderVertices();
        const allVertices = new Float32Array(vertices.concat(clipBorder));
        // Upload vertex data to the GPU
        gl.bufferData(gl.ARRAY_BUFFER, allVertices, gl.STATIC_DRAW);

        // Clear the canvas and draw the lines
        gl.clearColor(1.0, 1.0, 1.0, 1.0);  // black background
        gl.clear(gl.COLOR_BUFFER_BIT);

        const totalVertices = allVertices.length / 2;
        const clipLineVertices = clipBorder.length / 2;
        const lineVertices = totalVertices - clipLineVertices;

        // Draw line data
        gl.drawArrays(gl.LINES, 0, lineVertices);
        // Draw border of the clipping window
        gl.lineWidth(2);
        gl.drawArrays(gl.LINES, lineVertices, clipLineVertices);
    }

    // Initial draw (with clipping on by default)
    render();

    // Toggle clipping mode when checkbox is changed
    document.getElementById('toggleClip').addEventListener('change', (e) => {
        clippingEnabled = e.target.checked;
        render();
    });

    document.addEventListener('keydown', (e) => {
        const moveStep = 0.05;
        const zoomStep = 0.9;

        switch (e.key) {
            case 'ArrowLeft':
                clipWindow.left -= moveStep;
                break;
            case 'ArrowRight':
                break;
            case 'ArrowUp':
                break;
            case 'ArrowDown':
                break;
            case 's':
                break;
            case 'w':
                break;
        }
        render();
    });
}

// Helper function to compile a shader from source
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
