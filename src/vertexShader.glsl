// Arsalaan Syed
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vTexCoord;

void main() {
    vec4 worldPosition = uModel * vec4(aPosition, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormal    = mat3(uModel) * aNormal;
    vTexCoord  = aTexCoord;
    gl_Position = uProjection * uView * worldPosition;
}
