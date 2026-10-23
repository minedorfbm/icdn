/** Original procedural renderer; research references are recorded in docs/atmospheric-transitions.md. */
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform vec3 origin;
uniform vec3 destination;
uniform vec3 daylight;
uniform float progress;
uniform float kind;

float hash(vec2 p) {
  p = fract(p * vec2(143.17, 317.43));
  p += dot(p, p.yx + 19.19);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), w.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0)), w.x), w.y);
}
float folds(vec2 p) {
  float sum = 0.0;
  float strength = 0.55;
  for (int i = 0; i < 3; i++) {
    sum += noise(p) * strength;
    p = mat2(1.7, 1.1, -1.1, 1.7) * p + 4.3;
    strength *= 0.45;
  }
  return sum;
}

void main() {
  float y = 1.0 - uv.y;
  float travel = (progress - 0.5) * 1.5;
  vec2 p = vec2(uv.x * 3.0, y * 1.8);
  float warp = folds(p + vec2(travel * 0.32, -travel * 0.2));
  float detail = folds(p * 2.0 + warp * 2.5 + vec2(-travel, 7.0));
  float envelope = sin(y * 3.14159265);
  // Long, directional folds, with fine irregular edges instead of blurred blobs.
  float sweep = sin(uv.x * 5.0 + travel + kind * 1.7) * 0.16;
  float fine = sin(uv.x * 8.0 - y * 3.0 + detail * 1.8) * 0.075;
  float field = y + (sweep + fine + (warp - 0.4) * 0.09) * envelope;
  vec3 middle = kind < 0.5 ? daylight : mix(origin, destination, 0.52);
  vec3 color = mix(origin, middle, smoothstep(0.24, 0.44, field));
  color = mix(color, destination, smoothstep(0.49, 0.62, field));

  float seam = exp(-abs(field - 0.53) * 40.0);
  float filaments = pow(0.5 + 0.5 * sin(field * 185.0 + detail * 2.0), 15.0);
  if (kind < 0.5) {
    // A luminous ivory sheet opens onto deep blue, passing through the existing Sea tint.
    color = mix(color, origin, exp(-abs(field - 0.455) * 85.0) * 0.65);
    color = mix(color, daylight, seam * filaments * 0.75);
  } else if (kind < 1.5) {
    // Layered jungle ridges and a thin jade-lit contour, without a grey fog stripe.
    float ridges = smoothstep(0.42, 0.58, field + (detail - 0.4) * 0.13);
    color = mix(color, destination, ridges * (1.0 - ridges) * 0.8);
    color = mix(color, mix(destination, daylight, 0.36), seam * (0.14 + filaments * 0.72));
  } else {
    // Fine reflected wavefronts, confined to the waterline.
    float water = pow(0.5 + 0.5 * sin(field * 190.0 + warp * 2.0), 15.0);
    color = mix(color, daylight, seam * (0.08 + water * 0.85));
  }
  float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.006;
  color += grain * envelope;
  // Endpoints are the exact CSS palette colors, regardless of deformation or travel.
  color = mix(origin, color, smoothstep(0.0, 0.10, y));
  color = mix(color, destination, smoothstep(0.90, 1.0, y));
  gl_FragColor = vec4(color, 1.0);
}`;

/** Convert any browser-supported CSS color, including OKLCH, to the same sRGB as CSS. */
function colorChannels(color: string) {
  const surface = document.createElement("canvas");
  surface.width = surface.height = 1;
  const context = surface.getContext("2d");
  if (!context) throw new Error("Color conversion unavailable");
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const bytes = context.getImageData(0, 0, 1, 1).data;
  return [bytes[0]! / 255, bytes[1]! / 255, bytes[2]! / 255] as const;
}

export function createAtmosphericRenderer(canvas: HTMLCanvasElement, kind: number) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  if (!program || !buffer) {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    return null;
  }
  const shaders: WebGLShader[] = [];
  const dispose = () => {
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  try {
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertexSource],
      [gl.FRAGMENT_SHADER, fragmentSource],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader unavailable");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Shader unsupported");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program unsupported");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const styles = getComputedStyle(canvas.parentElement!);
    for (const [uniform, variable] of [
      ["origin", "--chapter-from"],
      ["destination", "--chapter-to"],
      ["daylight", "--world-sea"],
    ]) {
      gl.uniform3f(
        gl.getUniformLocation(program, uniform!),
        ...colorChannels(styles.getPropertyValue(variable!)),
      );
    }
    gl.uniform1f(gl.getUniformLocation(program, "kind"), kind);
    const progressUniform = gl.getUniformLocation(program, "progress");
    return {
      draw(progress: number) {
        // Small decorative surface, capped at 1280px and never rendered at retina DPR.
        const rect = canvas.getBoundingClientRect();
        const scale = Math.min(1, 1280 / Math.max(1, rect.width));
        const width = Math.max(1, Math.round(rect.width * scale));
        const height = Math.max(1, Math.round(rect.height * scale));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        gl.uniform1f(progressUniform, progress);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
      dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
