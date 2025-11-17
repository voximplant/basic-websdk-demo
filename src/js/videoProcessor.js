// @ts-check

const targetFPS = 30;
const targetInterval = 1000 / targetFPS;

const softness = 3;
const threshold = 0.75;
const downscaleRatio = 4;

/**
 * 
 * @param {HTMLVideoElement | HTMLImageElement | ImageBitmap | HTMLCanvasElement | OffscreenCanvas | ImageData} source 
 * @returns {{width: number, height: number}} The dimensions of the source
 */
const getDimensions = (source) => {
  if (source instanceof HTMLVideoElement) {
    return { width: source.videoWidth, height: source.videoHeight };
  } else if (source instanceof HTMLImageElement) {
    return {
      width: source.naturalWidth || source.width,
      height: source.naturalHeight || source.height,
    };
  } else if (
    source instanceof ImageBitmap ||
    source instanceof HTMLCanvasElement ||
    source instanceof OffscreenCanvas
  ) {
    return { width: source.width, height: source.height };
  } else if (source instanceof ImageData) {
    return { width: source.width, height: source.height };
  }
  
  // @ts-expect-error other source type, try to get dimensions
  return { width: source.width, height: source.height };
};


/**
 * Load the body segmentation model
 * @returns {Promise<any>} The segmenter instance
 */
const loadSegmentationModel = async () => {
  console.log('Loading TensorFlow model...');
  // @ts-ignore - bodySegmentation is loaded via external script
  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
  const segmenterConfig = {
    runtime: 'mediapipe', // tfjs || mediapipe
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
    modelType: 'general', // general || landscape
  };
  // @ts-ignore - bodySegmentation is loaded via external script
  const segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
  console.log('Segmentation model loaded');
  return segmenter;
};

/**
 * Load background image from URL and convert to ImageBitmap
 * @param {string} url - Image URL
 * @returns {Promise<ImageBitmap>} The loaded image as ImageBitmap
 */
async function loadBackgroundImage(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // Convert directly to ImageBitmap (more efficient for WebGL)
    const imageBitmap = await createImageBitmap(blob);
    console.log('Background image loaded:', imageBitmap.width, 'x', imageBitmap.height);

    return imageBitmap;
  } catch (error) {
    console.error('Failed to fetch background image:', error);
    throw error;
  }
}

/**
 * Convert segmentation mask to ImageData for WebGL
 * @param {any} segmentation - Segmentation result
 * @param {number} width - Width
 * @param {number} height - Height
 * @returns {ImageData} Image data for mask
 */
function maskToImageData(segmentation, width, height) {
  const maskData = segmentation.mask.toCanvasImageSource();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(maskData, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Add video processor with background replacement
 * @param {any} websdkClient - WebSDK client instance
 * @returns {Promise<void>}
 */
const addVideoProcessor = async (websdkClient) => {
  const backgroundImage = await loadBackgroundImage('assets/voximplant-background.jpg');
  const segmenter = await loadSegmentationModel();

  websdkClient.videoMediaTrackTransform = (originalTrack) => {
    const compositor = new WebGl();
    compositor.init();

    // Create a video element from the track
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = new MediaStream([originalTrack]);

    // Wait for video to be ready
    video.play().catch((e) => console.error('Failed to play video:', e));

    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d');

    // Canvas for downscaled segmentation input
    const downscaleCanvas = document.createElement('canvas');
    const downscaleCtx = downscaleCanvas.getContext('2d');

    let isProcessing = false;
    let intervalId = null;

    // Process frames continuously
    const processFrame = async () => {
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      // Set canvas sizes on first frame
      if (resultCanvas.width !== video.videoWidth) {
        resultCanvas.width = video.videoWidth;
        resultCanvas.height = video.videoHeight;

        // Set downscaled canvas size
        downscaleCanvas.width = Math.floor(video.videoWidth / downscaleRatio);
        downscaleCanvas.height = Math.floor(video.videoHeight / downscaleRatio);
      }

      // Skip if already processing
      if (isProcessing) {
        return;
      }

      isProcessing = true;

      try {
        // Downscale video frame for segmentation
        downscaleCtx.drawImage(
          video,
          0,
          0,
          video.videoWidth,
          video.videoHeight,
          0,
          0,
          downscaleCanvas.width,
          downscaleCanvas.height
        );

        // Run segmentation on downscaled frame
        const segmentations = await segmenter.segmentPeople(downscaleCanvas, {
          flipHorizontal: false,
          multiSegmentation: false,
          segmentBodyParts: false,
        });

        if (segmentations && segmentations.length > 0) {
          const segmentation = segmentations[0];

          const maskImageData = await bodySegmentation.toBinaryMask(
            segmentation,
            {
              r: 255,
              g: 255,
              b: 255,
              a: 255,
            },
            {
              r: 0,
              g: 0,
              b: 0,
              a: 0,
            },
            false,
            threshold
          );

          // Blend using WebGL (synchronous, accepts ImageData directly)
          // WebGL will automatically upscale the mask to match the original video size
          const blended = compositor.blend({
            original: video,
            background: backgroundImage,
            mask: maskImageData,
            softness,
          });

          // Draw result to canvas
          resultCtx.drawImage(blended, 0, 0);
        } else {
          // No segmentation found, draw original
          resultCtx.drawImage(video, 0, 0);
        }
      } catch (error) {
        console.error('Frame processing error:', error);
        // On error, draw original video
        resultCtx.drawImage(video, 0, 0);
      }

      isProcessing = false;
    };

    // Start processing
    video.addEventListener('loadedmetadata', () => {
      console.log('Video ready:', video.videoWidth, 'x', video.videoHeight);
      intervalId = setInterval(processFrame, targetInterval);
    });

    // Create stream from result canvas
    const stream = resultCanvas.captureStream(targetFPS);
    const processedTrack = stream.getVideoTracks()[0];

    // Cleanup when track ends
    originalTrack.addEventListener('ended', () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      video.pause();
      video.srcObject = null;
      compositor.dispose();
      processedTrack.stop();
    });

    return processedTrack;
  };
};

/**
 * Remove video processor
 * @param {any} websdkClient - WebSDK client instance
 */
const removeVideoProcessor = (websdkClient) => {
  websdkClient.videoMediaTrackTransform = null;
};

class WebGl {
  constructor() {
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.textures = { original: null, background: null, mask: null };
    this.initialized = false;
  }

  /**
   * Initialize WebGL context and shaders
   */
  init() {
    if (this.initialized) return;

    this.canvas = new OffscreenCanvas(1, 1);
    this.gl = this.canvas.getContext('webgl2', {
      premultipliedAlpha: false,
      alpha: false, // We don't need alpha channel in output
      antialias: false, // Faster without antialiasing
    });

    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    const gl = this.gl;

    // Vertex shader - full-screen quad
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment shader - blend original with background based on mask
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      uniform sampler2D u_original;
      uniform sampler2D u_background;
      uniform sampler2D u_mask;
      uniform float u_softness;
      uniform vec2 u_resolution;
      uniform vec2 u_bgScale;
      uniform vec2 u_bgOffset;
      
      in vec2 v_texCoord;
      out vec4 outColor;
      
      void main() {
        vec4 original = texture(u_original, v_texCoord);
        
        vec2 bgCoord = v_texCoord * u_bgScale + u_bgOffset;
        vec4 background = texture(u_background, bgCoord);
        
        // Apply blur to mask for soft edges
        float alpha;
        if (u_softness > 0.0) {
          // Box blur kernel - sample surrounding pixels
          vec2 texelSize = 1.0 / u_resolution;
          
          alpha = 0.0;
          float totalWeight = 0.0;
          
          // 5x5 kernel for better blur quality
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * u_softness;
              float weight = 1.0;
              alpha += texture(u_mask, v_texCoord + offset).r * weight;
              totalWeight += weight;
            }
          }
          alpha /= totalWeight;
        } else {
          // No blur, use mask directly
          alpha = texture(u_mask, v_texCoord).r;
        }
        
        // Blend: alpha=1 shows original (foreground), alpha=0 shows background
        outColor = vec4(
          mix(background.rgb, original.rgb, alpha),
          1.0
        );
      }
    `;

    // Compile shaders
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create and link program
    this.program = gl.createProgram();

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.bindAttribLocation(this.program, 0, 'a_position');

    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Program link failed: ' + gl.getProgramInfoLog(this.program));
    }

    gl.useProgram(this.program);

    const positions = new Float32Array([
      -1,
      -1, // bottom-left
      1,
      -1, // bottom-right
      -1,
      1, // top-left
      -1,
      1, // top-left
      1,
      -1, // bottom-right
      1,
      1, // top-right
    ]);

    const texCoords = new Float32Array([
      0,
      1, // bottom-left
      1,
      1, // bottom-right
      0,
      0, // top-left
      0,
      0, // top-left
      1,
      1, // bottom-right
      1,
      0, // top-right
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    this.textures.original = this.createTexture(gl);
    this.textures.background = this.createTexture(gl);
    this.textures.mask = this.createTexture(gl);

    // Get uniform locations
    this.uniformLocations = {
      original: gl.getUniformLocation(this.program, 'u_original'),
      background: gl.getUniformLocation(this.program, 'u_background'),
      mask: gl.getUniformLocation(this.program, 'u_mask'),
      softness: gl.getUniformLocation(this.program, 'u_softness'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      bgScale: gl.getUniformLocation(this.program, 'u_bgScale'),
      bgOffset: gl.getUniformLocation(this.program, 'u_bgOffset'),
    };

    // Bind texture units once (they don't change)
    gl.uniform1i(this.uniformLocations.original, 0);
    gl.uniform1i(this.uniformLocations.background, 1);
    gl.uniform1i(this.uniformLocations.mask, 2);

    this.initialized = true;
  }

  /**
   * Compile a shader
   */
  compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile failed: ' + info);
    }

    return shader;
  }

  /**
   * Create a WebGL texture with optimal settings
   */
  createTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  /**
   * @description blend
   * @param {Object} params
   * @param {ImageBitmap|HTMLCanvasElement|HTMLImageElement|HTMLVideoElement|ImageData} params.background
   * @param {ImageBitmap|HTMLCanvasElement|HTMLImageElement|HTMLVideoElement|ImageData} params.mask
   * @param {ImageBitmap|HTMLCanvasElement|HTMLImageElement|HTMLVideoElement|ImageData} params.original
   * @param {number} params.softness - Edge blur radius in pixels (0 = no blur)
   *
   * @returns {ImageBitmap} blended image with replaced bg
   */
  blend(params) {
    const { background, mask, original, softness = 0 } = params;

    // Lazy initialization
    if (!this.initialized) {
      this.init();
    }

    const gl = this.gl;


    const { width, height } = getDimensions(original);
    const bgDimensions = getDimensions(background);

    // Calculate object-fit: cover transformation
    // Scale to cover entire area while maintaining aspect ratio
    const targetAspect = width / height;
    const bgAspect = bgDimensions.width / bgDimensions.height;
    
    let bgScaleX, bgScaleY, bgOffsetX, bgOffsetY;
    
    if (bgAspect > targetAspect) {
      bgScaleX = targetAspect / bgAspect;
      bgScaleY = 1.0;
      bgOffsetX = (1.0 - bgScaleX) * 0.5;
      bgOffsetY = 0.0;
    } else {
      bgScaleX = 1.0;
      bgScaleY = bgAspect / targetAspect;
      bgOffsetX = 0.0;
      bgOffsetY = (1.0 - bgScaleY) * 0.5;
    }

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.original);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, original);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.background);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, background);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.textures.mask);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);

    gl.useProgram(this.program);
    gl.uniform1f(this.uniformLocations.softness, softness);
    gl.uniform2f(this.uniformLocations.resolution, width, height);
    gl.uniform2f(this.uniformLocations.bgScale, bgScaleX, bgScaleY);
    gl.uniform2f(this.uniformLocations.bgOffset, bgOffsetX, bgOffsetY);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return this.canvas.transferToImageBitmap();
  }

  /**
   * Clean up WebGL resources
   */
  dispose() {
    if (this.gl) {
      const gl = this.gl;
      if (this.textures.original) gl.deleteTexture(this.textures.original);
      if (this.textures.background) gl.deleteTexture(this.textures.background);
      if (this.textures.mask) gl.deleteTexture(this.textures.mask);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.initialized = false;
  }
}
