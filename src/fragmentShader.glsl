// Arsalaan Syed
precision mediump float;

uniform sampler2D uTexture;
uniform vec3       uLightPos;
uniform bool       uIsSun;
uniform bool       uUseMask;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vTexCoord;

void main() {
    vec4 texColor = texture2D(uTexture, vTexCoord);

    float alpha = uUseMask ? texColor.r : texColor.a;

    if (uIsSun) {
        gl_FragColor = vec4(texColor.rgb, alpha);
    } else {
        vec3 L = normalize(uLightPos - vWorldPos);
        float diff = max(dot(normalize(vNormal), L), 0.0);
        gl_FragColor = vec4(texColor.rgb * diff, alpha);
    }
}
