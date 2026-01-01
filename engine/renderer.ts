
import { VERTEX_SHADER, FRAGMENT_SHADER } from './shaders';
import { Adjustments } from '../types';

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private texture: WebGLTexture | null = null;
  private curveTexture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: true });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;
    this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    this.initBuffers();
    this.initCurveTexture();
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(this.gl.getShaderInfoLog(shader)!);
    }
    return shader;
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    return program;
  }

  private initBuffers() {
    const gl = this.gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]), gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  private initCurveTexture() {
    const gl = this.gl;
    this.curveTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  public setImage(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap) {
    const gl = this.gl;
    if (this.texture) gl.deleteTexture(this.texture);
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  private generateCurveLUT(points: { x: number, y: number }[]): Uint8Array {
    const lut = new Uint8Array(256);
    const sorted = [...points].sort((a, b) => a.x - b.x);
    for (let i = 0; i < 256; i++) {
      const x = i / 255;
      let idx = 0;
      while (idx < sorted.length - 2 && x > sorted[idx + 1].x) idx++;
      const p0 = sorted[idx], p1 = sorted[idx + 1];
      const t = (x - p0.x) / (p1.x - p0.x || 0.0001);
      const y = p0.y + t * (p1.y - p0.y);
      lut[i] = Math.max(0, Math.min(255, Math.round(y * 255)));
    }
    return lut;
  }

  public render(adjustments: Adjustments, width: number, height: number) {
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const lut = this.generateCurveLUT(adjustments.curvePoints);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, lut);

    const setU = (name: string, val: any) => {
      const loc = gl.getUniformLocation(this.program, name);
      if (loc) {
        if (typeof val === 'number') gl.uniform1f(loc, val);
        else if (val.length === 2) gl.uniform2fv(loc, val);
        else if (val.length === 4) gl.uniform4fv(loc, val);
      }
    };

    setU('u_exposure', adjustments.exposure);
    setU('u_contrast', adjustments.contrast);
    setU('u_highlights', adjustments.highlights);
    setU('u_shadows', adjustments.shadows);
    setU('u_vibrance', adjustments.vibrance);
    setU('u_saturation', adjustments.saturation);
    setU('u_temp', adjustments.temp);
    setU('u_tint', adjustments.tint);
    setU('u_texture', adjustments.texture);
    setU('u_vignette', adjustments.vignette);
    setU('u_grain', adjustments.grain);
    
    // Optics
    setU('u_lensCorrection', adjustments.lensCorrection);
    setU('u_chromaticAberration', adjustments.chromaticAberration ? 1.0 : 0.0);

    // Geometry
    setU('u_rotation', (adjustments.rotation * Math.PI) / 180);
    setU('u_straighten', adjustments.straighten);
    setU('u_flip', [adjustments.flipH ? -1.0 : 1.0, adjustments.flipV ? -1.0 : 1.0]);
    setU('u_crop', [adjustments.crop.x, adjustments.crop.y, adjustments.crop.w, adjustments.crop.h]);

    const hArr = new Float32Array(8), sArr = new Float32Array(8), lArr = new Float32Array(8);
    const colors = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'];
    colors.forEach((c, i) => { hArr[i] = adjustments.hsl[c].h; sArr[i] = adjustments.hsl[c].s; lArr[i] = adjustments.hsl[c].l; });
    gl.uniform1fv(gl.getUniformLocation(this.program, 'u_hsl_h'), hArr);
    gl.uniform1fv(gl.getUniformLocation(this.program, 'u_hsl_s'), sArr);
    gl.uniform1fv(gl.getUniformLocation(this.program, 'u_hsl_l'), lArr);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_image'), 0);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_curve_lut'), 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  public dispose() {
    if(this.texture) this.gl.deleteTexture(this.texture);
    if(this.curveTexture) this.gl.deleteTexture(this.curveTexture);
    this.gl.deleteProgram(this.program);
  }
}
