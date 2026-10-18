/**
 * 3D background. A single full-screen fragment shader (see shader.ts) is drawn
 * to a fixed canvas. Keyframes tied to page sections decide the object's
 * position, scale, shape (ring of orbs -> blob -> card) and brightness.
 * Falls back silently (CSS orb stays visible) if WebGL is unavailable.
 */

/** [x, y, scale, ringWeight, cardWeight, intensity] */
type Pose = [number, number, number, number, number, number];
/** [scrollCentre, ...Pose] */
type SceneKey = [number, number, number, number, number, number, number];

function initWebGL(): void {
  const canvas = document.getElementById("bg") as HTMLCanvasElement | null;
  const motionBtn = document.getElementById("mt");
  const root = document.documentElement;
  if (!canvas || !motionBtn) return;

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;

  const VERTEX_SHADER = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
  const compile = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return;

  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);

  const uniform = {
    res: gl.getUniformLocation(program, "uRes"),
    time: gl.getUniformLocation(program, "uT"),
    pos: gl.getUniformLocation(program, "uPos"),
    weights: gl.getUniformLocation(program, "uW"),
    rot: gl.getUniformLocation(program, "uRot"),
  };

  root.classList.add("gl");

  const narrow = window.matchMedia("(max-width: 899px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const startTime = performance.now();
  let frame = 0;
  let keys: SceneKey[] = [];

  const isStatic = (): boolean => reducedMotion.matches || root.classList.contains("still");

  const resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Cap the pixel budget so phones and low-power GPUs stay smooth.
    const budget = narrow.matches ? 0.6e6 : 1.2e6;
    const scale = Math.min(1, Math.sqrt(budget / (w * h)));
    canvas.width = Math.max(2, Math.floor(w * scale));
    canvas.height = Math.max(2, Math.floor(h * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const topOf = (selector: string): number => {
    const el = document.querySelector<HTMLElement>(selector);
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  };
  const heightOf = (selector: string): number => document.querySelector<HTMLElement>(selector)?.offsetHeight ?? 0;

  const buildKeys = (): void => {
    const vh = window.innerHeight;
    const sceneTop = topOf("#scene");
    const sceneHeight = heightOf("#scene");
    keys = [
      [topOf("#top") + heightOf("#top") * 0.5, 0.62, 0.15, 0.62, 0, 0, 0.55], // hero: soft blob, off to the side
      [sceneTop + vh * 0.5, 0, 0, 1, 1, 0, 1], // scene start: ring of orbs, centred
      [sceneTop + sceneHeight - vh * 0.5, 0, 0, 1, 1, 0, 1], // scene end
      [topOf("#features") + heightOf("#features") * 0.5, 0.78, -0.15, 0.6, 0.5, 0, 0.4], // features: dim
      [topOf("#security") + heightOf("#security") * 0.5, -0.78, 0.1, 0.6, 0, 0, 0.4], // security: dim
      [topOf("footer") + heightOf("footer") * 0.4, 0, 0.45, 0.58, 0, 1, 0.9], // footer: 3D card
    ];
    keys.sort((a, b) => a[0] - b[0]);
  };

  const currentPose = (): Pose => {
    const centre = window.scrollY + window.innerHeight / 2;
    let i = 0;
    while (i < keys.length - 1 && centre > keys[i + 1][0]) i++;
    const a = keys[i];
    const b = keys[Math.min(i + 1, keys.length - 1)];
    let t = b[0] > a[0] ? Math.min(1, Math.max(0, (centre - a[0]) / (b[0] - a[0]))) : 0;
    t = t * t * (3 - 2 * t); // smoothstep
    const pose = [0, 0, 0, 0, 0, 0] as Pose;
    for (let j = 0; j < 6; j++) pose[j] = a[j + 1] + (b[j + 1] - a[j + 1]) * t;
    if (narrow.matches) {
      pose[0] *= 0.3;
      pose[2] *= 0.8;
      pose[5] *= 0.5;
    }
    return pose;
  };

  const draw = (): void => {
    frame = 0;
    const still = isStatic();
    // Static pose: dim ring parked at the edge, never behind body text.
    const pose: Pose = still ? (narrow.matches ? [0, 0.9, 0.55, 1, 0, 0.25] : [1.02, 0, 0.6, 1, 0, 0.4]) : currentPose();
    const time = still ? 2.4 : (performance.now() - startTime) / 1000;
    gl.uniform2f(uniform.res, canvas.width, canvas.height);
    gl.uniform1f(uniform.time, time);
    gl.uniform4f(uniform.pos, pose[0], pose[1], pose[2], pose[5]);
    gl.uniform3f(uniform.weights, pose[3], pose[4], 0);
    gl.uniform1f(uniform.rot, still ? 0.6 : time * 0.2 + window.scrollY * 0.0012);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still && !document.hidden) frame = requestAnimationFrame(draw);
  };

  const kick = (): void => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  const refresh = (): void => {
    resize();
    buildKeys();
    kick();
  };

  window.addEventListener("resize", refresh);
  window.addEventListener("load", refresh);
  document.addEventListener("visibilitychange", kick);
  motionBtn.addEventListener("click", kick);
  if (typeof reducedMotion.addEventListener === "function") reducedMotion.addEventListener("change", kick);
  refresh();
}
