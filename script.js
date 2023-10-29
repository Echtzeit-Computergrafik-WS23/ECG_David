////////////////////////////////////////////////////////////////////////////////
// BOILERPLATE START

// Get the WebGL context
const canvas = document.getElementById('canvas')
const gl = canvas.getContext('webgl2')

// Add mouse move event handlers to the canvas to update the cursor[] array.
const cursor = [0, 0]
canvas.addEventListener('mousemove', (event) => {
    cursor[0] = (event.offsetX / canvas.width) * 2 - 1
    cursor[1] = (event.offsetY / canvas.height) * -2 + 1
})

// Basic render loop manager.
function setRenderLoop(callback) {
    function renderLoop(time) {
        if (setRenderLoop._callback !== null) {
            setRenderLoop._callback(time)
            requestAnimationFrame(renderLoop)
        }
    }
    setRenderLoop._callback = callback
    requestAnimationFrame(renderLoop)
}
setRenderLoop._callback = null

// BOILERPLATE END
////////////////////////////////////////////////////////////////////////////////
// Shader //////////////////////////////////////////////////////////////////////

const vertexShaderSource = `#version 300 es
    precision highp float; // Calculate the varying outputs with high precision

    in vec2 a_pos;
    in vec3 a_color;

    out vec3 f_color;

    void main() {
         gl_Position = vec4(a_pos, 0.0, 1.0);
         f_color = a_color;
    }
`

const fragmentShaderSource = `#version 300 es
    precision mediump float; // Fragment shader calculations require less precision.


    uniform float u_time;
    uniform vec2 u_cursor;
    uniform vec2 iResolution;

    in vec3 f_color;
    out vec4 FragColor;

    // video tutorial src: https://www.youtube.com/watch?v=f4s1h2YETNY&ab_channel=kishimisu
    
    vec3 palette(float t) {
        vec3 a = vec3(1.0, 0.5, 0.5);
        vec3 b = vec3(0.5, 1.0, 0.5);
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec3 d = vec3(0.263, 0.416, 0.557);

        return a + b * cos(6.28318 * (c * t + d));
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = (fragCoord * 2.0 - iResolution) / min(iResolution.y, iResolution.x);

        vec2 uv0 = uv;
        vec3 finalColor = vec3(0.0);

        for (float i = 0.0; i < 2.0; i++) {
            uv = fract(uv * 1.5) - 0.5;

            float d = length(uv) * exp(-length(uv0));

            vec3 col = palette(length(uv0) + i * 0.4 + u_time * 0.4);

            d = sin(d * 8.0 + u_time) / 8.0;
            d = abs(d);

            d = pow(0.02 / d, 2.0);

            finalColor += col * d;
        }

        fragColor = vec4(finalColor, 1.0);
    }

    void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        mainImage(FragColor, fragCoord);
    }
`



// Create the Vertex Shader
const vertexShader = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vertexShader, vertexShaderSource)
gl.compileShader(vertexShader)

// Create the Fragment Shader
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fragmentShader, fragmentShaderSource)
gl.compileShader(fragmentShader)

// Link the two into a single Shader Program
const shaderProgram = gl.createProgram()
gl.attachShader(shaderProgram, vertexShader)
gl.attachShader(shaderProgram, fragmentShader)
gl.linkProgram(shaderProgram)
gl.useProgram(shaderProgram)

// Data ////////////////////////////////////////////////////////////////////////

const vertexPositions = new Float32Array([
    -1., -1., 1, 0, 0,
    +1., -1., 0, 1, 0,
    +1., +1., 0, 0, 1,
    -1., +1., 1, 1, 1,
])

// Create the position buffer
const positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
gl.bufferData(gl.ARRAY_BUFFER, vertexPositions, gl.STATIC_DRAW)

const faceIndices = new Uint16Array([
    0, 1, 2, // first triangle
    0, 2, 3, // second triangle
])

// Create the index buffer
const indexBuffer = gl.createBuffer()
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faceIndices, gl.STATIC_DRAW)

// Attribute Mapping ///////////////////////////////////////////////////////////

// Map the contents of the buffer to the vertex shader
const vertexAttribute = gl.getAttribLocation(shaderProgram, 'a_pos')
gl.enableVertexAttribArray(vertexAttribute)
gl.vertexAttribPointer(
    vertexAttribute,
    2,        // numComponents
    gl.FLOAT, // type
    false,    // normalize
    20,       // stride
    0         // offset
)

const colorAttribute = gl.getAttribLocation(shaderProgram, 'a_color')
gl.enableVertexAttribArray(colorAttribute)
gl.vertexAttribPointer(
    colorAttribute,
    3,        // numComponents
    gl.FLOAT, // type
    false,    // normalize
    20,       // stride
    8         // offset
)

// Uniforms ////////////////////////////////////////////////////////////////////

const timeUniform = gl.getUniformLocation(shaderProgram, "u_time")
const cursorUniform = gl.getUniformLocation(shaderProgram, "u_cursor")

// Rendering ///////////////////////////////////////////////////////////////////

function renderLoop(time) {
    gl.uniform1f(timeUniform, time / 5000)
    gl.uniform2f(cursorUniform, cursor[0], cursor[1])
    gl.uniform2f(gl.getUniformLocation(shaderProgram,"iResolution"),canvas.width, canvas.height);

    // Draw the scene.
    gl.drawElements(
        gl.TRIANGLES,       // primitive type
        faceIndices.length, // vertex count
        gl.UNSIGNED_SHORT,  // type of indices
        0                   // offset
    )
}
setRenderLoop(renderLoop)