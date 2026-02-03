attribute vec2 a_position;

void main() {
    // Pass-through: use the provided 2D position as is.
    gl_Position = vec4(a_position, 0.0, 1.0);
}
