'use client';

import { useEffect, useRef } from 'react';

export type HeroFluidRevealProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Solid veil color (matches --background) shown everywhere the fluid hasn't touched. */
  veilColor?: [number, number, number];
  className?: string;
};

/**
 * A real WebGL fluid simulation (Navier-Stokes: velocity advection, vorticity
 * confinement, pressure projection — the same "SplashCursor" technique used
 * for colorful ink-splash cursors) repurposed as a reveal mask instead of a
 * dye display: the display shader outputs the veil color with alpha inverted
 * against dye density, so wherever the simulated "ink" has flowed becomes
 * transparent (revealing whatever renders behind this canvas — the site's
 * persistent 3D scene) while everywhere else stays a solid opaque veil. This
 * is what gives the reveal genuinely organic, swirling, fluid-like edges
 * instead of hand-stamped circles.
 */
export function HeroFluidReveal({ containerRef, veilColor = [0.0196, 0.0196, 0.0196], className }: HeroFluidRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || typeof window === 'undefined') return;

    let isActive = true;

    const config = {
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 720,
      DENSITY_DISSIPATION: 5,
      VELOCITY_DISSIPATION: 2.4,
      PRESSURE: 0.1,
      PRESSURE_ITERATIONS: 20,
      CURL: 3,
      SPLAT_RADIUS: 0.055,
      SPLAT_FORCE: 3200,
    };

    function pointerPrototype(this: any) {
      this.texcoordX = 0;
      this.texcoordY = 0;
      this.prevTexcoordX = 0;
      this.prevTexcoordY = 0;
      this.deltaX = 0;
      this.deltaY = 0;
      this.moved = false;
    }
    const pointer = new (pointerPrototype as any)();

    const params: WebGLContextAttributes = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params) as WebGL2RenderingContext | null;
    const isWebGL2 = !!gl;
    if (!gl) gl = (canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)) as any;
    if (!gl) return;

    let halfFloat: any;
    let supportLinearFiltering: any;
    if (isWebGL2) {
      (gl as WebGL2RenderingContext).getExtension('EXT_color_buffer_float');
      supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    const halfFloatTexType = isWebGL2 ? (gl as WebGL2RenderingContext).HALF_FLOAT : halfFloat && halfFloat.HALF_FLOAT_OES;

    function getSupportedFormat(internalFormat: number, format: number, type: number): { internalFormat: number; format: number } | null {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        const g = gl as WebGL2RenderingContext;
        if (internalFormat === g.R16F) return getSupportedFormat(g.RG16F, g.RG, type);
        if (internalFormat === g.RG16F) return getSupportedFormat(g.RGBA16F, g.RGBA, type);
        return null;
      }
      return { internalFormat, format };
    }

    function supportRenderTextureFormat(internalFormat: number, format: number, type: number): boolean {
      const g = gl!;
      const texture = g.createTexture();
      g.bindTexture(g.TEXTURE_2D, texture);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.texImage2D(g.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
      const fbo = g.createFramebuffer();
      g.bindFramebuffer(g.FRAMEBUFFER, fbo);
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);
      return g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
    }

    const rgba = isWebGL2 ? getSupportedFormat((gl as WebGL2RenderingContext).RGBA16F, gl.RGBA, halfFloatTexType) : { internalFormat: gl.RGBA, format: gl.RGBA };
    const rg = isWebGL2 ? getSupportedFormat((gl as WebGL2RenderingContext).RG16F, (gl as WebGL2RenderingContext).RG, halfFloatTexType) : { internalFormat: gl.RGBA, format: gl.RGBA };
    const rFmt = isWebGL2 ? getSupportedFormat((gl as WebGL2RenderingContext).R16F, (gl as WebGL2RenderingContext).RED, halfFloatTexType) : { internalFormat: gl.RGBA, format: gl.RGBA };

    function compileShader(type: number, source: string, keywords?: string[]): WebGLShader {
      let src = source;
      if (keywords) src = keywords.map((k) => `#define ${k}\n`).join('') + src;
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) console.error(gl!.getShaderInfoLog(shader));
      return shader;
    }

    function createProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram {
      const program = gl!.createProgram()!;
      gl!.attachShader(program, vs);
      gl!.attachShader(program, fs);
      gl!.linkProgram(program);
      if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) console.error(gl!.getProgramInfoLog(program));
      return program;
    }

    function getUniforms(program: WebGLProgram): Record<string, WebGLUniformLocation> {
      const uniforms: Record<string, WebGLUniformLocation> = {};
      const count = gl!.getProgramParameter(program, gl!.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const name = gl!.getActiveUniform(program, i)!.name;
        uniforms[name] = gl!.getUniformLocation(program, name)!;
      }
      return uniforms;
    }

    class GLProgram {
      program: WebGLProgram;
      uniforms: Record<string, WebGLUniformLocation>;
      constructor(vs: WebGLShader, fs: WebGLShader) {
        this.program = createProgram(vs, fs);
        this.uniforms = getUniforms(this.program);
      }
      bind() { gl!.useProgram(this.program); }
    }

    const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL, vR, vT, vB;
      uniform vec2 texelSize;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);

    const copyShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture;
      void main () { gl_FragColor = texture2D(uTexture, vUv); }
    `);

    const clearShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; uniform sampler2D uTexture; uniform float value;
      void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
    `);

    // The one meaningful change from a stock "splash cursor": instead of
    // displaying dye as color on a transparent background, this outputs the
    // veil color with alpha *inverted* against dye density (premultiplied,
    // to match the existing ONE/ONE_MINUS_SRC_ALPHA blend below) — so dye
    // erases the veil instead of painting on top of it.
    const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      uniform vec3 uVeilColor;
      uniform float uRevealGain;
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float density = max(c.r, max(c.g, c.b));
        float revealed = clamp(density * uRevealGain, 0.0, 1.0);
        float veilAlpha = 1.0 - revealed;
        gl_FragColor = vec4(uVeilColor * veilAlpha, veilAlpha);
      }
    `;

    const splatShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float; precision highp sampler2D; varying vec2 vUv;
      uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
      void main () {
        vec2 p = vUv - point.xy; p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `);

    const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float; precision highp sampler2D; varying vec2 vUv;
      uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation;
      void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
      }
    `);

    const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL, vR, vT, vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x; if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
        gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
      }
    `);

    const curlShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL, vR, vT, vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x;
        gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
      }
    `);

    const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
      precision highp float; precision highp sampler2D; varying vec2 vUv; varying vec2 vL, vR, vT, vB;
      uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
      void main () {
        float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x; float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001; force *= curl * C; force.y *= -1.0;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

    const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL, vR, vT, vB;
      uniform sampler2D uPressure; uniform sampler2D uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
        float divergence = texture2D(uDivergence, vUv).x;
        gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
      }
    `);

    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float; precision mediump sampler2D; varying highp vec2 vUv; varying highp vec2 vL, vR, vT, vB;
      uniform sampler2D uPressure; uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

    const displayFragmentShader = compileShader(gl.FRAGMENT_SHADER, displayShaderSource);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(target: any, clear = false) {
      const g = gl!;
      if (target == null) {
        g.viewport(0, 0, g.drawingBufferWidth, g.drawingBufferHeight);
        g.bindFramebuffer(g.FRAMEBUFFER, null);
      } else {
        g.viewport(0, 0, target.width, target.height);
        g.bindFramebuffer(g.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        g.clearColor(0, 0, 0, 1);
        g.clear(g.COLOR_BUFFER_BIT);
      }
      g.drawElements(g.TRIANGLES, 6, g.UNSIGNED_SHORT, 0);
    }

    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
      const g = gl!;
      g.activeTexture(g.TEXTURE0);
      const texture = g.createTexture()!;
      g.bindTexture(g.TEXTURE_2D, texture);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, param);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, param);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.texImage2D(g.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = g.createFramebuffer()!;
      g.bindFramebuffer(g.FRAMEBUFFER, fbo);
      g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, texture, 0);
      g.viewport(0, 0, w, h);
      g.clear(g.COLOR_BUFFER_BIT);
      return {
        texture, fbo, width: w, height: h,
        texelSizeX: 1 / w, texelSizeY: 1 / h,
        attach(id: number) { g.activeTexture(g.TEXTURE0 + id); g.bindTexture(g.TEXTURE_2D, texture); return id; },
      };
    }

    function createDoubleFBO(w: number, h: number, internalFormat: number, format: number, type: number, param: number) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(w, h, internalFormat, format, type, param);
      return {
        width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; }, set read(v) { fbo1 = v; },
        get write() { return fbo2; }, set write(v) { fbo2 = v; },
        swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
      };
    }

    function getResolution(resolution: number) {
      let aspectRatio = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      return gl!.drawingBufferWidth > gl!.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    const copyProgram = new GLProgram(baseVertexShader, copyShader);
    const clearProgram = new GLProgram(baseVertexShader, clearShader);
    const splatProgram = new GLProgram(baseVertexShader, splatShader);
    const advectionProgram = new GLProgram(baseVertexShader, advectionShader);
    const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
    const curlProgram = new GLProgram(baseVertexShader, curlShader);
    const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
    const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
    const gradientSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);
    const displayProgram = new GLProgram(baseVertexShader, displayFragmentShader);

    let dye: ReturnType<typeof createDoubleFBO>;
    let velocity: ReturnType<typeof createDoubleFBO>;
    let divergence: ReturnType<typeof createFBO>;
    let curl: ReturnType<typeof createFBO>;
    let pressure: ReturnType<typeof createDoubleFBO>;

    function initFramebuffers() {
      const simRes = getResolution(config.SIM_RESOLUTION);
      const dyeRes = getResolution(config.DYE_RESOLUTION);
      const texType = halfFloatTexType;
      const filtering = supportLinearFiltering ? gl!.LINEAR : gl!.NEAREST;
      gl!.disable(gl!.BLEND);
      dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba!.internalFormat, rgba!.format, texType, filtering);
      velocity = createDoubleFBO(simRes.width, simRes.height, rg!.internalFormat, rg!.format, texType, filtering);
      divergence = createFBO(simRes.width, simRes.height, rFmt!.internalFormat, rFmt!.format, texType, gl!.NEAREST);
      curl = createFBO(simRes.width, simRes.height, rFmt!.internalFormat, rFmt!.format, texType, gl!.NEAREST);
      pressure = createDoubleFBO(simRes.width, simRes.height, rFmt!.internalFormat, rFmt!.format, texType, gl!.NEAREST);
    }

    function scaleByPixelRatio(input: number) {
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      return Math.floor(input * pr);
    }

    function resizeCanvasToContainer() {
      const rect = container!.getBoundingClientRect();
      const w = scaleByPixelRatio(rect.width);
      const h = scaleByPixelRatio(rect.height);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        return true;
      }
      return false;
    }

    resizeCanvasToContainer();
    initFramebuffers();

    function splat(x: number, y: number, dx: number, dy: number) {
      splatProgram.bind();
      gl!.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl!.uniform1f(splatProgram.uniforms.aspectRatio, canvas!.width / canvas!.height);
      gl!.uniform2f(splatProgram.uniforms.point, x, y);
      gl!.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      let radius = config.SPLAT_RADIUS / 100.0;
      const aspectRatio = canvas!.width / canvas!.height;
      if (aspectRatio > 1) radius *= aspectRatio;
      gl!.uniform1f(splatProgram.uniforms.radius, radius);
      blit(velocity.write);
      velocity.swap();

      gl!.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl!.uniform3f(splatProgram.uniforms.color, 1.0, 1.0, 1.0);
      blit(dye.write);
      dye.swap();
    }

    function correctDeltaX(delta: number) {
      const aspectRatio = canvas!.width / canvas!.height;
      return aspectRatio < 1 ? delta * aspectRatio : delta;
    }
    function correctDeltaY(delta: number) {
      const aspectRatio = canvas!.width / canvas!.height;
      return aspectRatio > 1 ? delta / aspectRatio : delta;
    }

    function updatePointerMove(posX: number, posY: number) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = posX / canvas!.width;
      pointer.texcoordY = 1.0 - posY / canvas!.height;
      pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
      pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = container!.getBoundingClientRect();
      const posX = scaleByPixelRatio(e.clientX - rect.left);
      const posY = scaleByPixelRatio(e.clientY - rect.top);
      updatePointerMove(posX, posY);
    };
    const onMouseLeave = () => { pointer.moved = false; };
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    let lastUpdateTime = Date.now();
    function calcDeltaTime() {
      const now = Date.now();
      const dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
      lastUpdateTime = now;
      return dt;
    }

    function step(dt: number) {
      const g = gl!;
      g.disable(g.BLEND);

      curlProgram.bind();
      g.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      vorticityProgram.bind();
      g.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      g.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
      g.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
      g.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      g.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      clearProgram.bind();
      g.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
      g.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      pressureProgram.bind();
      g.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        g.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      gradientSubtractProgram.bind();
      g.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      g.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
      g.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      g.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      let velocityId = velocity.read.attach(0);
      g.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      g.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      g.uniform1f(advectionProgram.uniforms.dt, dt);
      g.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      g.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      g.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      g.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      const g = gl!;
      g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
      g.enable(g.BLEND);
      displayProgram.bind();
      g.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
      g.uniform3f(displayProgram.uniforms.uVeilColor, veilColor[0], veilColor[1], veilColor[2]);
      g.uniform1f(displayProgram.uniforms.uRevealGain, 3.6);
      blit(null);
    }

    let rafId = 0;
    let visible = true;
    let onScreen = true;
    const onVisibility = () => { visible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVisibility);
    const io = new IntersectionObserver((entries) => { for (const e of entries) onScreen = e.isIntersecting; }, { rootMargin: '100px' });
    io.observe(container);

    function updateFrame() {
      if (!isActive) return;
      const dt = calcDeltaTime();
      if (visible && onScreen) {
        if (resizeCanvasToContainer()) initFramebuffers();
        if (pointer.moved) {
          pointer.moved = false;
          splat(pointer.texcoordX, pointer.texcoordY, pointer.deltaX * config.SPLAT_FORCE, pointer.deltaY * config.SPLAT_FORCE);
        }
        step(dt);
        render();
      }
      rafId = requestAnimationFrame(updateFrame);
    }
    rafId = requestAnimationFrame(updateFrame);

    return () => {
      isActive = false;
      cancelAnimationFrame(rafId);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? 'pointer-events-none absolute inset-0 h-full w-full'}
    />
  );
}
