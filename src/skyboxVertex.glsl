// Arsalaan Syed
attribute vec3 aPosition;
uniform mat4 uView;
uniform mat4 uProjection;
varying vec3 vTexCoord;
void main() {
    vTexCoord = aPosition;
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}