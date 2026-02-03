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
        // Head
        [-0.6, 0.8, 0.6, 0.8],
        [0.6, 0.8, 0.9, 0.3],
        [0.9, 0.3, 0.6, -0.4],
        [0.6, -0.4, 0, -0.7],
        [0, -0.7, -0.6, -0.4],
        [-0.6, -0.4, -0.9, 0.3],
        [-0.9, 0.3, -0.6, 0.8],

        // Beak
        [-0.1, -0.1, 0.2, -0.2],
        [0.2, -0.2, -0.1, -0.3],
        [-0.1, -0.3, -0.1, -0.1],

        // Glasses - Left lens
        [-0.5, 0.2, -0.2, 0.2],
        [-0.2, 0.2, -0.2, -0.1],
        [-0.2, -0.1, -0.5, -0.1],
        [-0.5, -0.1, -0.5, 0.2],

        // Glasses - Right lens
        [0.1, 0.2, 0.4, 0.2],
        [0.4, 0.2, 0.4, -0.1],
        [0.4, -0.1, 0.1, -0.1],
        [0.1, -0.1, 0.1, 0.2],

        // Glasses bridge
        [-0.2, 0.05, 0.1, 0.05],

        // Eyebrows
        [-0.55, 0.35, -0.25, 0.45],
        [0.25, 0.45, 0.55, 0.35],

        // Extra lines to test clipping
        [-0.8, -1.0, -0.8, 1.0],
        [-1, -0.8, 1, -0.8],
        [-1, 0.8, 1, 0.8],
        [0.8, -1.0, 0.8, 1.0],
        [-1, -1, -0.8, -0.8],
        [-1, 1, -0.8, 0.8],
        [1, -1, 0.8, -0.8],
        [1, 1, 0.8, 0.8]
    ];

    let clippingEnabled = true;

    // Return list of vertices for clipping window
    function getClipBorderVertices() {
        return [
            clipWindow.left, clipWindow.bottom, clipWindow.right, clipWindow.bottom,  // Bottom edge
            clipWindow.right, clipWindow.bottom, clipWindow.right, clipWindow.top,     // Right edge
            clipWindow.right, clipWindow.top, clipWindow.left, clipWindow.top,      // Top edge
            clipWindow.left, clipWindow.top, clipWindow.left, clipWindow.bottom    // Left edge
        ];
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
        const zoomStep = 0.85;  // Adjusted for faster zoom that can reach maximum
        const minWindowSize = 0.05;  // Minimum window size to prevent over-zooming
        const maxWindowSize = 2.0;   // Maximum window size (full screen)
        const screenBounds = { left: -1.0, right: 1.0, bottom: -1.0, top: 1.0 };

        switch (e.key) {
            case 'ArrowLeft':
                // Pan left with bounds checking
                if (clipWindow.left - moveStep >= screenBounds.left) {
                    clipWindow.left -= moveStep;
                    clipWindow.right -= moveStep;
                }
                break;
            case 'ArrowRight':
                if (clipWindow.right + moveStep <= screenBounds.right) {
                    clipWindow.left += moveStep;
                    clipWindow.right += moveStep;
                }
                break;
            case 'ArrowUp':
                if (clipWindow.top + moveStep <= screenBounds.top) {
                    clipWindow.top += moveStep;
                    clipWindow.bottom += moveStep;
                }
                break;
            case 'ArrowDown':
                if (clipWindow.bottom - moveStep >= screenBounds.bottom) {
                    clipWindow.top -= moveStep;
                    clipWindow.bottom -= moveStep;
                }
                break;
            case 's':
            case 'S':
                const centerX_out = (clipWindow.left + clipWindow.right) / 2;
                const centerY_out = (clipWindow.top + clipWindow.bottom) / 2;
                let width_out = (clipWindow.right - clipWindow.left) / zoomStep;
                let height_out = (clipWindow.top - clipWindow.bottom) / zoomStep;
                
                width_out = Math.min(width_out, maxWindowSize);
                height_out = Math.min(height_out, maxWindowSize);
                
                let newLeft = centerX_out - width_out / 2;
                let newRight = centerX_out + width_out / 2;
                let newBottom = centerY_out - height_out / 2;
                let newTop = centerY_out + height_out / 2;
                
                clipWindow.left = Math.max(newLeft, screenBounds.left);
                clipWindow.right = Math.min(newRight, screenBounds.right);
                clipWindow.bottom = Math.max(newBottom, screenBounds.bottom);
                clipWindow.top = Math.min(newTop, screenBounds.top);
                break;
            case 'w':
            case 'W':
                const centerX_in = (clipWindow.left + clipWindow.right) / 2;
                const centerY_in = (clipWindow.top + clipWindow.bottom) / 2;
                const width_in = (clipWindow.right - clipWindow.left) * zoomStep;
                const height_in = (clipWindow.top - clipWindow.bottom) * zoomStep;
                
                if (width_in >= minWindowSize && height_in >= minWindowSize) {
                    clipWindow.left = centerX_in - width_in / 2;
                    clipWindow.right = centerX_in + width_in / 2;
                    clipWindow.bottom = centerY_in - height_in / 2;
                    clipWindow.top = centerY_in + height_in / 2;
                }
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
