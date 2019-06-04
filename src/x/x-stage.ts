
import { XGameObject, XGameObjectDefaults } from './x-game-object';


/**
 * Base stage class used for the x-engine.
 */
export class XStage extends XGameObject {
    private stage: boolean;
    private canvasElement: HTMLCanvasElement | null;
    private context: CanvasRenderingContext2D | null;
    constructor(config = XGameObjectDefaults) {
        super(config);
        /**
         * A flag to denote that this is a special GameObject of stage.
         */
        this.stage = true;
        this.canvasElement = null;
        this.context = null;
    }

    attachToCanvas(canvas: HTMLCanvasElement) {
        this.canvasElement = canvas;
        this.width = canvas.offsetWidth;
        this.height = canvas.offsetHeight;
        this.context = this.canvasElement.getContext('2d');
        this.setPosition(0, 0);
    }

}