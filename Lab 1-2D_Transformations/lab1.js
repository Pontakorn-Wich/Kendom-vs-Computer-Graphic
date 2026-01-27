// Get WebGL rendering context
const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  alert('WebGL not supported');
}

// Adjust viewport to canvas size
gl.viewport(0, 0, canvas.width, canvas.height);

// Load Shader source files asynchronously and initialize WebGL program
Promise.all([
  fetch('shaders/vertex.glsl').then(res => res.text()),
  fetch('shaders/fragment.glsl').then(res => res.text())
]).then(([vsSource, fsSource]) => {
  // Compile and link the shader program
  const program = createProgram(gl, vsSource, fsSource);
  gl.useProgram(program);

  // Look up attribute and uniform locations from the compiled program
  const aPositionLoc = gl.getAttribLocation(program, 'a_position');
  const uMatrixLoc = gl.getUniformLocation(program, 'u_matrix');
  const uColorLoc = gl.getUniformLocation(program, 'u_color');

  // Create a buffer and put the triangle's vertex position in it
  const vertices = new Float32Array([
    0.0, 0.2,   // Vertex 1: top point of the triangle
    -0.1, -0.1,   // Vertex 2: bottom left
    0.1, -0.1    // Vertex 3: bottom right
  ]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Enable the position attribute and point it to the position buffer
  gl.enableVertexAttribArray(aPositionLoc);
  gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

  // Set the triangle color (RGBA uniform). Here it's a teal color.
  gl.uniform4f(uColorLoc, 0.0, 0.8, 0.8, 1.0);

  // Initialize transformation state
  let posX = 0.0, posY = 0.0; // translation offsets
  let angle = 0.0;            // rotation angle in radians
  let scale = 1.0;            // uniform scale factor

  // Draw the scene with the current transform
  function draw() {
    // Clear the canvas
    gl.clearColor(0, 0, 0, 1);  //black background
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Compute the combined transformation matrix

    // Combine transformations: first scale, then rotate, then translate
    const scaleMatrix = Mat3.scaling(scale, scale);
    const rotationMatrix = Mat3.rotation(angle);
    const translationMatrix = Mat3.translation(posX, posY);
    
    let matrix = Mat3.multiply(translationMatrix, Mat3.multiply(rotationMatrix, scaleMatrix));

    // Pass the 3x3 matrix to the vertex shader
    gl.uniformMatrix3fv(uMatrixLoc, false, matrix);

    // Draw the triangle (3 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // Initial draw
  draw();

  //Listen for keyboard events to control the transformation
  window.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowLeft': posX -= 0.05; break;              // move left
      case 'ArrowRight': posX += 0.05; break;             // move right
      case 'ArrowUp': posY += 0.05; break;                // move up
      case 'ArrowDown': posY -= 0.05; break;              // move down
      case 'a': case 'A': angle += Math.PI / 36; break;   // rotate counterclockwise
      case 'd': case 'D': angle -= Math.PI / 36; break;   // rotate clockwise
      case 'w': case 'W': scale *= 1.1; break;            // scale up
      case 's': case 'S': scale *= 0.9; break;            // scale down
    }

    // Prevent the scale from becoming too small or negative
    if (scale < 0.1) {
      scale = 0.1;
    } else if (scale > 5.0) {
      scale = 5.0;
    }

    // Redraw the scene with updated transformations
    draw();
  });
});

// Helper functions to compile shaders and link the program
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}