// Arsalaan Syed
precision mediump float;
uniform samplerCube uSkybox;
varying vec3 vTexCoord;
void main() {
    gl_FragColor = textureCube(uSkybox, vTexCoord);
}