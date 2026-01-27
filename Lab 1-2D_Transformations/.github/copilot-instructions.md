# Copilot Instructions for WebGL 2D Transform Lab

## Project Overview
This is a WebGL-based 2D graphics application demonstrating triangle rendering with keyboard-controlled transformations (translate, rotate, scale).

## Key Architecture
- **index.html**: Canvas element and script includes
- **lab1.js**: Main WebGL setup, shader loading, buffer creation, event handling
- **shaders/**: GLSL vertex and fragment shaders
- **gl-matrix.js**: Custom 3x3 matrix utilities for transformations

## WebGL Setup Pattern
Always load shaders asynchronously using `Promise.all` and `fetch`, then compile/link program:
```javascript
Promise.all([
  fetch('shaders/vertex.glsl').then(res => res.text()),
  fetch('shaders/fragment.glsl').then(res => res.text())
]).then(([vsSource, fsSource]) => {
  const program = createProgram(gl, vsSource, fsSource);
  // ... setup attributes/uniforms
});
```

## Matrix Transformations
Use `Mat3` from gl-matrix.js for all transformations. Combine in order: scale → rotate → translate.
```javascript
let matrix = Mat3.multiply(
  Mat3.multiply(Mat3.scaling(scale, scale), Mat3.rotation(angle)),
  Mat3.translation(posX, posY)
);
gl.uniformMatrix3fv(uMatrixLoc, false, matrix);
```

## Keyboard Controls
- Arrows: translate (posX, posY)
- A/D: rotate (angle)
- W/S: scale (uniform)
- Clamp scale between 0.1 and 5.0

## Drawing Loop
Clear canvas, set uniforms, draw with `gl.drawArrays(gl.TRIANGLES, 0, 3)`.

## Shader Conventions
- Vertex shader: `attribute vec2 a_position`, `uniform mat3 u_matrix`
- Fragment shader: `uniform vec4 u_color`, `precision mediump float`

Focus on 2D transformations; avoid 3D concepts unless extending.</content>
<parameter name="filePath">vsls:/.github/copilot-instructions.md