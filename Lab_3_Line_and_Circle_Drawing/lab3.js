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

    // Configure the WebGL viewport and clear the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);  // white background
    gl.clear(gl.COLOR_BUFFER_BIT);

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

    // Locate the position attribute in the shader and enable it
    const posAttrLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttrLoc);

    // Create a buffer to hold point positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Describe the layout of the buffer data for the shader (2 floats per attribute instance)
    gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 0, 0);

    // Variables to track the first click (start point)
    let startPoint = null;
    
    // Array to store all drawn shapes
    const shapes = [];

    // Set up event listener for canvas clicks to get line endpoints
    canvas.addEventListener('click', function (event) {
        // Get mouse coordinates relative to the canvas
        // (Using offsetX/offsetY which gives position within the canvas element)
        const canvasX = event.offsetX;
        const canvasY = event.offsetY;
        // Convert canvas Y (top-left origin) to pixel grid Y (bottom-left origin)
        const pixelX = canvasX;
        const pixelY = canvas.height - 1 - canvasY;  // invert Y axis

        if (startPoint === null) {
            // First click: record the starting point
            startPoint = { x: pixelX, y: pixelY };
        } else {
            // Second click: we have an end point, so draw the line
            const endPoint = { x: pixelX, y: pixelY };

            // Select mode to draw between line and circle.
            const drawMode = document.querySelector('input[name="mode"]:checked').value;

            let pixels = [];
            
            if (drawMode === 'line') {
                // Use Bresenham's algorithm to get all points on the line
                pixels = bresenhamLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            } else if (drawMode === 'circle') {
                // Calculate radius as distance from center to the clicked point
                const dx = endPoint.x - startPoint.x;
                const dy = endPoint.y - startPoint.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                // Use Bresenham's circle algorithm
                pixels = bresenhamCircle(startPoint.x, startPoint.y, radius);
            }

            // Save the shape to our collection
            shapes.push(pixels);
            
            // Clear the canvas and redraw all shapes
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Draw all saved shapes
            for (const shapePixels of shapes) {
                const positions = [];
                for (const [x, y] of shapePixels) {
                    positions.push(x, y);
                }

                // Copy the coordinates to the GPU buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

                // Draw the points as a series of GL_POINTS
                gl.drawArrays(gl.POINTS, 0, shapePixels.length);
            }
            
            // Reset start point for next drawing
            startPoint = null;
        }
    });
    
    // Set up clear button to reset all shapes
    document.getElementById('clearBtn').addEventListener('click', function() {
        shapes.length = 0; // Clear the shapes array
        startPoint = null; // Reset start point
        gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas
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
