// gl-matrix.js – Manual implementation of 4x4 matrix operations (column-major order)
function matIdentity() {
    // Returns a new identity matrix (4x4)
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

function matMultiply(a, b) {
    
}

function matTranslate(tx, ty, tz) {
    
}

function matScale(sx, sy, sz) {
    
}

function matRotateX(angleRad) {
    
}

function matRotateY(angleRad) {
    
}

function matRotateZ(angleRad) {
    
}

function matPerspective(fovDeg, aspect, near, far) {
    // Creates a perspective projection matrix with given field-of-view (degrees), aspect ratio, near and far planes
    const fovRad = fovDeg * Math.PI / 180.0;
    const f = 1.0 / Math.tan(fovRad / 2.0);   // focal length (cotangent of half FOV)
    const nf = 1.0 / (near - far);           // reciprocal of (near - far)
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
}