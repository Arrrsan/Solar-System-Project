
import { createProgram } from './shaderUtils.js';
import { createSphere } from './sphereUtils.js';

const canvas = document.getElementById('glCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const gl = canvas.getContext('webgl');
if (!gl) throw new Error('WebGL not supported');

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);

const vertexSource         = await (await fetch('vertexShader.glsl')).text();
const fragmentSource       = await (await fetch('fragmentShader.glsl')).text();
const skyboxVertexSource   = await (await fetch('skyboxVertex.glsl')).text();
const skyboxFragmentSource = await (await fetch('skyboxFragment.glsl')).text();
const program       = createProgram(gl, vertexSource, fragmentSource);
const skyboxProgram = createProgram(gl, skyboxVertexSource, skyboxFragmentSource);

const sphere = createSphere(1, 40, 40);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(sphere.positions), gl.STATIC_DRAW);

const normalsBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(sphere.normals), gl.STATIC_DRAW);

const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(sphere.texCoords), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(sphere.indices), gl.STATIC_DRAW);

const aPosition    = gl.getAttribLocation(program, 'aPosition');
const aNormal      = gl.getAttribLocation(program, 'aNormal');
const aTexCoord    = gl.getAttribLocation(program, 'aTexCoord');
const uModel       = gl.getUniformLocation(program, 'uModel');
const uView        = gl.getUniformLocation(program, 'uView');
const uProjection  = gl.getUniformLocation(program, 'uProjection');
const uTexture     = gl.getUniformLocation(program, 'uTexture');
const uLightPos    = gl.getUniformLocation(program, 'uLightPos');
const uIsSun       = gl.getUniformLocation(program, 'uIsSun');
const uUseMask  = gl.getUniformLocation(program, 'uUseMask');

function loadTexture(gl, src) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255,255,255,255]));
    const img = new Image();
    img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    img.src = src;
    return tex;
}

function loadCubemap(paths) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    const targets = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];
    paths.forEach((p, i) => {
        const img = new Image();
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(targets[i], 0, gl.RGBA,
                gl.RGBA, gl.UNSIGNED_BYTE, img);
        };
        img.src = p;
    });
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,
        gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,
        gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
}

const sunTexture     = loadTexture(gl, 'textures/sun.jpg');
const earthTexture   = loadTexture(gl, 'textures/earth.jpg');
const moonTexture    = loadTexture(gl, 'textures/moon.png');

const mercuryTexture = loadTexture(gl, 'textures/planets/mercury.jpg');
const venusTexture   = loadTexture(gl, 'textures/planets/venusat.jpg');
const marsTexture    = loadTexture(gl, 'textures/planets/mars.jpg');
const jupiterTexture = loadTexture(gl, 'textures/planets/jupiter.jpg');
const saturnTexture  = loadTexture(gl, 'textures/planets/saturn.jpg');
const uranusTexture  = loadTexture(gl, 'textures/planets/uranus.jpg');
const neptuneTexture = loadTexture(gl, 'textures/planets/neptune.jpg');

const earthCloudTexture = loadTexture(gl, 'textures/earth_daynight_clouds/2k_earth_clouds.jpg');


gl.useProgram(program);
gl.uniform1i(uTexture, 0);

const skyboxTexture = loadCubemap([
    'textures/skybox/GalaxyTex_PositiveX.png',
    'textures/skybox/GalaxyTex_NegativeX.png',
    'textures/skybox/GalaxyTex_PositiveY.png',
    'textures/skybox/GalaxyTex_NegativeY.png',
    'textures/skybox/GalaxyTex_PositiveZ.png',
    'textures/skybox/GalaxyTex_NegativeZ.png'
]);

gl.useProgram(skyboxProgram);
gl.uniform1i(gl.getUniformLocation(skyboxProgram, 'uSkybox'), 0);

const SUN   = { SCALE: 2,    ROTATION_SPEED: 0.004   };
const EARTH = {
    SCALE: 0.5,
    ORBIT_RADIUS: 5,
    ORBIT_SPEED: 0.001,
    ROTATION_SPEED: 0.002
};
const MOON  = {
    SCALE: 0.27,
    ORBIT_RADIUS: 1.5,
    ORBIT_SPEED: 0.0003,
    ROTATION_SPEED: 0.0006
};

const MERCURY = {
    SCALE: 0.2,
    ORBIT_RADIUS: 3,
    ORBIT_SPEED: 0.0016,
    ROTATION_SPEED: 0.001
};
const VENUS   = {
    SCALE: 0.3,
    ORBIT_RADIUS: 4,
    ORBIT_SPEED: 0.0012,
    ROTATION_SPEED: 0.0008
};
const MARS    = {
    SCALE: 0.4,
    ORBIT_RADIUS: 6,
    ORBIT_SPEED: 0.0009,
    ROTATION_SPEED: 0.001
};
const JUPITER = {
    SCALE: 1.2,
    ORBIT_RADIUS: 8,
    ORBIT_SPEED: 0.0005,
    ROTATION_SPEED: 0.0015
};
const SATURN  = {
    SCALE: 1.0,
    ORBIT_RADIUS: 10,
    ORBIT_SPEED: 0.0004,
    ROTATION_SPEED: 0.0012
};
const URANUS  = {
    SCALE: 0.8,
    ORBIT_RADIUS: 12,
    ORBIT_SPEED: 0.0003,
    ROTATION_SPEED: 0.001
};
const NEPTUNE = {
    SCALE: 0.7,
    ORBIT_RADIUS: 14,
    ORBIT_SPEED: 0.0002,
    ROTATION_SPEED: 0.0009
};

const CLOUD_SCALE = EARTH.SCALE * 1.02;

const EARTH_TILT = 23.4 * Math.PI / 180;


let cameraAz   = 0,
    cameraEl   = Math.PI/6,
    cameraDist = 15,
    dragging   = false,
    lastX, lastY;

let followEarth = false;

canvas.addEventListener('mousedown', e => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    cameraAz  += dx * 0.005;
    cameraEl  = Math.max(0.1,
        Math.min(Math.PI/2 - 0.1,
            cameraEl - dy * 0.005));
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mouseup', () => dragging = false);
canvas.addEventListener('mouseleave', () => dragging = false);
canvas.addEventListener('wheel', e => {
    cameraDist = Math.max(5, cameraDist + e.deltaY * 0.01);
});

window.addEventListener('keydown', e => {
    if (e.key === 'c' || e.key === 'C') {
        followEarth = !followEarth;
    }
});

const skyboxVertices = new Float32Array([
    -1,  1, -1,  -1, -1, -1,   1, -1, -1,
    -1,  1, -1,   1, -1, -1,   1,  1, -1,
    -1, -1,  1,  -1,  1,  1,   1,  1,  1,
    -1, -1,  1,   1,  1,  1,   1, -1,  1,
    -1,  1, -1,  -1,  1,  1,  -1, -1,  1,
    -1,  1, -1,  -1, -1,  1,  -1, -1, -1,
    1,  1, -1,   1, -1, -1,   1, -1,  1,
    1,  1, -1,   1, -1,  1,   1,  1,  1,
    -1,  1,  1,   1,  1,  1,   1,  1, -1,
    -1,  1,  1,   1,  1, -1,  -1,  1, -1,
    -1, -1,  1,  -1, -1, -1,   1, -1, -1,
    -1, -1,  1,   1, -1, -1,   1, -1,  1
]);

const skyboxVBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVBO);
gl.bufferData(gl.ARRAY_BUFFER, skyboxVertices, gl.STATIC_DRAW);

const skyboxPosLoc = gl.getAttribLocation(skyboxProgram, 'aPosition');

function rotationY(a) {
    const c = Math.cos(a),
        s = Math.sin(a);
    return [c,0,s,0,  0,1,0,0,  -s,0,c,0,  0,0,0,1];
}

function rotationX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [
        1, 0,  0, 0,
        0, c, -s, 0,
        0, s,  c, 0,
        0, 0,  0, 1
    ];
}

function scale(x,y,z) {
    return [x,0,0,0,  0,y,0,0,  0,0,z,0,  0,0,0,1];
}

function translation(x,y,z) {
    return [1,0,0,0,  0,1,0,0,  0,0,1,0,  x,y,z,1];
}

function multiply(a,b) {
    const r = new Array(16);
    for (let i=0; i<4; i++) for (let j=0; j<4; j++) {
        let s = 0;
        for (let k=0; k<4; k++) s += a[k*4+j]*b[i*4+k];
        r[i*4+j] = s;
    }
    return r;
}

function perspectiveMatrix(fovy,aspect,near,far) {
    const f  = 1/Math.tan(fovy/2),
        nf = 1/(near - far);
    return [
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(far+near)*nf,-1,
        0,0,2*far*near*nf,0
    ];
}

function lookAt(e,c,u) {
    const z = normalize([e[0]-c[0],e[1]-c[1],e[2]-c[2]]),
        x = normalize(cross(u,z)),
        y = cross(z,x);
    return [
        x[0],y[0],z[0],0,
        x[1],y[1],z[1],0,
        x[2],y[2],z[2],0,
        -dot(x,e),-dot(y,e),-dot(z,e),1
    ];
}

function subtract(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function cross(a,b)    { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function dot(a,b)      { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function normalize(v)  { const l=Math.hypot(v[0],v[1],v[2]); return [v[0]/l,v[1]/l,v[2]/l]; }

function render(time) {
    let cx, cy, cz;
    if (followEarth) {
        const aEO = time * EARTH.ORBIT_SPEED;
        const eOM = multiply(rotationY(aEO), translation(EARTH.ORBIT_RADIUS, 0, 0));
        const ex = eOM[12], ey = eOM[13], ez = eOM[14];
        cx = ex + cameraDist * Math.cos(aEO);
        cy = ey + cameraDist * 0.2;
        cz = ez + cameraDist * Math.sin(aEO);
    } else {
        cx = cameraDist * Math.sin(cameraEl) * Math.cos(cameraAz);
        cy = cameraDist * Math.cos(cameraEl);
        cz = cameraDist * Math.sin(cameraEl) * Math.sin(cameraAz);
    }


    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.depthMask(false);
    gl.useProgram(skyboxProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVBO);
    gl.enableVertexAttribArray(skyboxPosLoc);
    gl.vertexAttribPointer(skyboxPosLoc, 3, gl.FLOAT, false, 0, 0);
    let viewNoTrans = lookAt([cx, cy, cz], [0, 0, 0], [0, 1, 0]);
    viewNoTrans[12] = viewNoTrans[13] = viewNoTrans[14] = 0;
    gl.uniformMatrix4fv(gl.getUniformLocation(skyboxProgram, 'uView'), false, viewNoTrans);
    gl.uniformMatrix4fv(gl.getUniformLocation(skyboxProgram, 'uProjection'), false,
        perspectiveMatrix(Math.PI / 4, canvas.width / canvas.height, 0.1, 100)
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.depthMask(true);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.uniformMatrix4fv(uView, false, lookAt([cx, cy, cz], [0, 0, 0], [0, 1, 0]));
    gl.uniformMatrix4fv(uProjection, false,
        perspectiveMatrix(Math.PI / 4, canvas.width / canvas.height, 0.1, 100)
    );
    gl.uniform3fv(uLightPos, [0, 0, 0]);

    gl.uniform1i(uIsSun, 1);
    gl.uniformMatrix4fv(uModel, false,
        multiply(scale(SUN.SCALE, SUN.SCALE, SUN.SCALE), rotationY(time * SUN.ROTATION_SPEED))
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sunTexture);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(uIsSun, 0);

    const aEO = time * EARTH.ORBIT_SPEED;
    const eOM = multiply(rotationY(aEO), translation(EARTH.ORBIT_RADIUS, 0, 0));
    const aES = time * EARTH.ROTATION_SPEED;

    const eM = multiply(
        eOM,
        multiply(
            scale(EARTH.SCALE, EARTH.SCALE, EARTH.SCALE),
            multiply(
                rotationX(EARTH_TILT),
                rotationY(aES)
            )
        )
    );
    gl.uniformMatrix4fv(uModel, false, eM);
    gl.bindTexture(gl.TEXTURE_2D, earthTexture);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

    const aMO = time * MOON.ORBIT_SPEED;
    const mOM = multiply(eM, multiply(rotationY(aMO), translation(MOON.ORBIT_RADIUS, 0, 0)));
    const aMS = time * MOON.ROTATION_SPEED;
    const mM  = multiply(mOM,
        multiply(rotationY(aMS), scale(MOON.SCALE, MOON.SCALE, MOON.SCALE))
    );
    gl.uniformMatrix4fv(uModel, false, mM);
    gl.bindTexture(gl.TEXTURE_2D, moonTexture);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);


    gl.uniform1i(uUseMask, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform1i(uUseMask, 1);
    const cloudModel = multiply(
        eOM,
        multiply(scale(CLOUD_SCALE, CLOUD_SCALE, CLOUD_SCALE), rotationY(aES))
    );
    gl.uniformMatrix4fv(uModel, false, cloudModel);
    gl.bindTexture(gl.TEXTURE_2D, earthCloudTexture);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.BLEND);
    gl.uniform1i(uUseMask, 0);

    function draw(planet, tex) {
        const ao = time * planet.ORBIT_SPEED;
        const orbit = multiply(rotationY(ao), translation(planet.ORBIT_RADIUS, 0, 0));
        const spin = time * planet.ROTATION_SPEED;
        const model = multiply(orbit,
            multiply(scale(planet.SCALE, planet.SCALE, planet.SCALE), rotationY(spin))
        );
        gl.uniformMatrix4fv(uModel, false, model);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    draw(MERCURY, mercuryTexture);
    draw(VENUS,   venusTexture);
    draw(MARS,    marsTexture);
    draw(JUPITER, jupiterTexture);
    draw(SATURN,  saturnTexture);
    draw(URANUS,  uranusTexture);
    draw(NEPTUNE, neptuneTexture);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
