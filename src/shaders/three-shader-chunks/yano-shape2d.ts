import * as THREE from 'three';

/*
 * Creates a checkerboard pattern but could be used for
 * horizontal or vertical strips.
 *
 * Returns 1.0 where board test hits.
 * ```
 *  vec3 white = vec3(1.0,1.0,1.0);
 *  vec3 black = vec3(1.0,1.0,1.0);
 *  vec2 p = vec2(v_position.x, v_position.y);
 *
 *  float checkerboard = yanoShape2dCheckerboard(p, 10.0, 10.0);
 *  float verticalStrips = yanoShape2dCheckerboard(p, 0.0, 10.0);
 *  float horizontalStrips = yanoShape2dCheckerboard(p, 10.0, 0.0);
 *
 *  vec3 color = mix(white, black, checkerboard);
 *  gl_FragColor = vec4(color, 1.0);
 * ```
 *
 * @see http://pixelshaders.com/examples/sampling-displacement.html
 */
const yanoShape2dCheckerboard = `
    float yanoShape2dCheckerBoard(vec2 p, float xCount, float yCount) {
      float x = floor(p.x * xCount);
      float y = floor(p.y * yCount);
      return mod(x + y, 2.0);
    }
`;


export const yanoShape2d = (three:any)=> {
  three.ShaderChunk.yanoShape2d = `
  ${yanoShape2dCheckerboard}
`;
}
