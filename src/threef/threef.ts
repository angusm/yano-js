import * as THREE from 'three';
import { mathf } from '../mathf/mathf';
import { Quaternion } from '../mathf/quaternion';



/**
 * A bunch of util for three.js
 */
export class threef {

    /**
     * Given a three.js Mesh / Object3d, calculates the current position and maps that to the
     * DOM x, y, z position and considers camera position.
     *
     * The returning x,y values are in pixels.
     * x / canvasWidth or y / canvasHeight would give you the percentage values.
     *
     * @see three-object-viewer10.html in examples for billboard, scaled versions.
     *
     * @param object The three.js object to base the position off of.
     * @param camera The currently active camera.
     * @param width The canvas width
     * @param height The canvas width
     *
     * Inspired by:
     * - https://threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
     * - https://stackoverflow.com/questions/27409074/converting-3d-position-to-2d-screen-position-r69
     * - https://stackoverflow.com/questions/46667395/three-js-vector3-to-2d-screen-coordinate-with-rotated-scene
     * - https://gist.github.com/ChiChou/a671a0bbe514364255f9
     * - https://github.com/mrdoob/three.js/blob/master/examples/js/renderers/CSS3DRenderer.js#L6-L31
     * - https://github.com/mrdoob/three.js/blob/master/examples/js/renderers/CSS3DRenderer.js#L254
     */
    static toDomCoordinates(object: THREE.Object3D, camera: THREE.Camera, width: number, height: number): THREE.Vector3 {
        const v = new THREE.Vector3();
        // Get the position of the center of the object.
        object.updateWorldMatrix(true, false);
        object.getWorldPosition(v);
        // Convert -1 - 1 world space to dom based 0-1 range.
        // Get the normalized screen coordinate of that position
        // x and y will be in the -1 to +1 range with x = -1 being
        // on the left and y = -1 being on the bottom
        v.project(camera);

        const x = (v.x * 0.5 + 0.5) * width;
        const y = (v.y * -0.5 + 0.5) * height;


        // One method to "fake" scale.  But this returns a three dimension and
        // what axis to base it off of it unknown.
        //   const scale = new THREE.Vector3();
        //   object.getWorldScale(scale);
        //   scale.project(camera);


        // Another crude scaling.
        // const max = 5;
        // const cv = new THREE.Vector3();
        // camera.updateWorldMatrix(true, false);
        // camera.getWorldPosition(cv);
        // const scale = Math.max(0, max - cv.distanceTo(v));
        const scale = 1;



        return new THREE.Vector3(x, y, scale);
    }



    /**
     * Given a three.js object, calculates the euler rotation over to values that can
     * be applied via css.  Note this return euler rotations in radians (THREE.Euler).
     * @param object
     * @param camera
     * @param width
     * @param height
     */
    static toDomRotation(object: THREE.Object3D, camera: THREE.Camera, width: number, height: number): THREE.Euler {

        // Get the local transform values.
        let q = new THREE.Quaternion();
        // object.updateWorldMatrix(true, false);
        object.getWorldQuaternion(q);
        // Convert coordinate system.
        q.x = -q.x;
        q.y = q.y;
        q.z = -q.z;


        // Get the camera rotation (world)
        let cq = new THREE.Quaternion();
        // camera.updateWorldMatrix(true, false);
        camera.getWorldQuaternion(cq);


        // Convert coordinate system.
        cq.x = cq.x;
        cq.y = -cq.y;
        cq.z = cq.z;

        // Combine the camera and object rotation
        cq.multiply(q);


        const euler = new THREE.Euler();
        euler.setFromQuaternion(cq.normalize());
        //   Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];
        // euler.reorder("ZYX")

        return euler;
    }


    /**
     * Sets the FOV as camera on a DOM element.
     * @param element
     * @param camera
     */
    static setFov(element: HTMLElement, camera: THREE.Camera) {
        const fov = 0.5 / Math.tan(camera['fov'] * Math.PI / 360) * element.offsetHeight;
        element.style.perspectiveOrigin = "50% 50%";
        element.style.perspective = fov + 'px';
    }



    /**
     * Given vector and euler rotations, applies transforms to an html element.
     * This works if your dom element is absolutely positions with the canvas.
     *
     * Given:
     *```
     * .text {
     *   position: absolute;
     * }
     * <div style="position: relative; height: 100vh; width: 100vw">
     *   <canvas></canvas>
     *   <div class="text">Hello hello</div>
     * </div>
     * ```
     *
     * You would do:
     *
     * ```
     *   const domCoordinates = threef.toDomCoordinates(
     *       threeObject, threeCamara, canvasWidth, canvasHeight
     *   );
     *   const domRotation = threef.toDomRotation(
     *      threeObject, threeCamera, canvasWidth, canvasHeight
     *   );
     *
     *   // Set the position and rotation of myDomElement to match the threeObject
     *   threef.applyVectorToDom(myDomElement, domCoordinates, domRotation);
     *
     *   // Set the position only of myDomElement to match the threeObject
     *   // This results in a billboarding effect.
     *   threef.applyVectorToDom(myDomElement, domCoordinates);
     * ```
     */
    static applyVectorToDom(element: HTMLElement, v?: THREE.Vector3, euler?: THREE.Euler) {
        if (euler) {
            const deg = {
                x: mathf.radianToDegree(euler.x),
                y: mathf.radianToDegree(euler.y),
                z: mathf.radianToDegree(euler.z),
            }
            if(v) {
              element.style.transform = `translate(-50%, -50%) translate(${v.x}px, ${v.y}px) rotateX(${deg.x}deg) rotateY(${deg.y}deg) rotateZ(${deg.z}deg) scale(${v.z})`;
            } else {
              element.style.transform = `rotateX(${deg.x}deg) rotateY(${deg.y}deg) rotateZ(${deg.z}deg)`;
            }
        } else {
            element.style.transform = `translate(-50%, -50%) translate(${v.x}px, ${v.y}px) scale(${v.z})`;
        }
    }


    static toDomGetBoundingRect() {

    }


}
