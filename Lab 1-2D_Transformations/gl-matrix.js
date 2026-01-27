const Mat3 = {
    identity: function () {
        return new Float32Array([
            1, 0, 0,    // first column
            0, 1, 0,    // second column
            0, 0, 1     // third column
        ]);
    },


    translation: function (tx, ty) {
        return new Float32Array([
            1, 0, tx,    // first column
            0, 1, ty,    // second column
            tx, ty, 1   // third column (translation)
        ]);
    },


    rotation: function (angleRad) {
        const c = Math.cos(angleRad);
        const s = Math.sin(angleRad);
        return new Float32Array([
            c, s, 0,     // first column
            -s, c, 0,    // second column
            0, 0, 1      // third column
        ]);
    },


    scaling: function (sx, sy) {
        return new Float32Array([
            sx, 0, 0,    // first column
            0, sy, 0,    // second column
            0, 0, 1      // third column
        ]);
    },


    multiply: function (a, b) {
        const out = new Float32Array(9);
        
        // Column-major matrix multiplication: out = a * b
        // Each column of the result
        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                out[col * 3 + row] = 
                    a[0 * 3 + row] * b[col * 3 + 0] +
                    a[1 * 3 + row] * b[col * 3 + 1] +
                    a[2 * 3 + row] * b[col * 3 + 2];
            }
        }
        
        return out;
    }
};