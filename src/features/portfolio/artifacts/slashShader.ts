export const SLASH_VS = `
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const SLASH_FS = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;
varying vec2 vUv;

float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    if (u_progress >= 0.999) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Exact pure background matching --background (#fdfdfd)
    vec3 paperColor = vec3(253.0 / 255.0, 253.0 / 255.0, 253.0 / 255.0);

    if (u_progress <= 0.001) {
        gl_FragColor = vec4(paperColor, 1.0);
        return;
    }

    // Slash goes from BOTTOM-LEFT to TOP-RIGHT (~35 degrees)
    vec2 pA = vec2(0.0, 0.0);
    vec2 pB = u_resolution;
    vec2 lineDir = normalize(pB - pA);
    vec2 normal = vec2(-lineDir.y, lineDir.x);

    vec2 center = u_resolution * 0.5;
    vec2 toFrag = gl_FragCoord.xy - center;

    float along = abs(dot(toFrag, lineDir));
    float across = abs(dot(toFrag, normal));

    vec2 polarUv = vec2(atan(toFrag.y, toFrag.x), length(toFrag) / length(u_resolution));
    float angleWobble = fbm(vec2(polarUv.x * 2.5, polarUv.y * 1.5)) * 0.35;

    float morphTear = smoothstep(0.20, 0.80, u_progress);
    float p = mix(0.52, 1.85, morphTear);
    float invP = 1.0 / p;
    float a = mix(4.0 + angleWobble, 1.0, morphTear);
    float b = mix(1.05 + angleWobble * 0.45, 1.0, morphTear);
    float safeAlong = max(along / a, 0.0001);
    float safeAcross = max(across / b, 0.0001);
    float r = pow(pow(safeAlong, p) + pow(safeAcross, p), invP);

    vec2 flowUv = vUv * 6.0 + vec2(u_time * 0.04, -u_time * 0.03);
    float nChunk = (fbm(flowUv * 0.8) - 0.5) * 2.0;
    float nRip = (fbm(flowUv * 2.4) - 0.5) * 2.0;
    float nFine = (fbm(vUv * 45.0) - 0.5) * 2.0;
    float nMicro = (fbm(vUv * 110.0) - 0.5) * 2.0;

    float violentTearNoise = (nChunk * 95.0 + nRip * 65.0 + nFine * 35.0 + nMicro * 15.0);

    // Natural reach to clear 4 corners without racing across screen (0.85x diagonal)
    float maxReachPx = length(u_resolution) * 0.85;
    float currentTearPx = u_progress * maxReachPx;

    float displaceScale = 1.0 - smoothstep(0.75, 0.95, u_progress);
    float displacedEdgePx = r - violentTearNoise * displaceScale;

    float edgeFeatherPx = 1.6;
    float torn = 1.0 - smoothstep(currentTearPx - edgeFeatherPx, currentTearPx, displacedEdgePx);

    float finalSafety = smoothstep(0.92, 0.99, u_progress);
    torn = mix(torn, 1.0, finalSafety);

    // Outside the tear: paper remains visible (alpha = 1.0) with pure #fdfdfd
    // Inside the tear: paper vanishes (alpha = 0.0), revealing Magnum Opus & dark forge beneath
    float paperAlpha = 1.0 - torn;

    gl_FragColor = vec4(paperColor, paperAlpha);
}
`;
