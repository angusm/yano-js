
import { Raf } from '../raf/raf';
import { mathf } from '../mathf/mathf';

import { DomWatcher } from './dom-watcher';

export interface ScrollSmoothRenderConfig {
    // How much to move per mouse wheel.
    scrollSensitivity: number,
    // Whether to attempt to normalize scroll sensitivity based on distance which
    // helps normalize difference between track pad, mouse wheel etc.
    dynamicSensitivity: boolean,
    lerp: number,
    damp: number
}

/**
 * Provides a way to "override" and smooth out the default scroll behavior.
 * This class also allows you to ensure that rendering is synced to the scroll.
 * It is a step beyond the scroll-render-fix (see notes on that).
 *
 * As with scroll-render-fix, this allows the rendering to catch up and then
 * once it is done,  it reapplies the scroll to the document.
 *
 * It goes beyond scroll-render-fix in that it will allow you to
 * damp the scroll position to create a smoother experience.
 *
 * Since this issue is chrome specific, you might want scope it to only chrome.
 * Usage:
 *
 * ```
 *   const scroll = new ScrollRenderSmooth({
 *      // If NOT using dynamicSensitivity use a value like 3 or 4.
 *      // If using dynamicSensitivity usually something like 120.
 *      scrollSensitivity: 120,
 *      dynamicSensitivity: true,
 *      lerp: 1,
 *      damp: 0.4
 *  });
 * ```
 *
 * To take full advantage, use toolbox mutate or yano.read / writes.
 * ```
 *
 * const raf = new Raf();
 *
 * raf.read(()=> {
 *   // do some reading
 * })
 *
 * raf.writing(()=> {
 *   // do some writing
 * })
 *
 * ```
 *
 * Because scroll is hijacked, any updates to scroll position should
 * be done either via events or the provided override method.
 *
 * Override method.
 * ```
 * const scroll = new ScrollRenderSmooth({
 *      scrollSensitivity: 4,
 *      lerp: 1,
 *      damp: 0.4
 *  });
 *
 * scroll.overrideScrollPosition(()=> {
 *   window.scrollTo(0,0);
 * })
 *
  * ```*
 *
 *
 *
 */
export class ScrollSmoothRender {
    private raf: Raf;
    private currentY: number;
    private targetY: number;
    private isWheeling: boolean = false;
    private config: ScrollSmoothRenderConfig;
    private domWatcher: DomWatcher;
    private disabled: boolean = false;

    constructor(config: ScrollSmoothRenderConfig) {
        this.raf = new Raf(this.onRaf.bind(this));
        this.raf.setReadWriteMode(true);
        this.domWatcher = new DomWatcher();
        this.config = config;

        this.raf.read(() => {
            this.currentY = this.getScrollTop();
        });


        this.domWatcher.add({
            element: window,
            on: 'wheel',
            callback: this.wheelHandler.bind(this),
            // Intentionally false here as we are going to hijack.
            eventOptions: {
                passive: false
            }
        });

        this.domWatcher.add({
            element: window,
            on: 'scroll',
            callback: this.scrollHandler.bind(this),
            eventOptions: {
                passive: true
            }
        });

        this.domWatcher.add({
            element: window,
            on: 'mousedown',
            callback: () => {
                this.stopWheelJack();
            },
            eventOptions: {
                passive: true
            }
        });
    }

    private getScrollTop():number {
        return document.scrollingElement.scrollTop;
    }


    private onRaf() {
        this.raf.read(() => {
            this.currentY = this.getScrollTop();
        });

        this.raf.postWrite(() => {
            const value = mathf.damp(
                this.currentY,
                this.targetY,
                this.config.lerp,
                this.config.damp) >> 0;

            if (this.currentY >> 0 !== value) {
                // Use scrollingElement to normalize diff between chrome and safari.
                document.scrollingElement.scrollTop = value;
            } else {
                this.stopWheelJack();
            }
        });
    }


    /**
     * Immediately stops the wheel jacking.
     */
    public stopWheelJack() {
        this.isWheeling = false;
        this.raf.stop();
    }

    /**
     * Temporarily disables the effects of this class.
     */
    public disable():void {
        this.stopWheelJack();
        this.disabled = true;
    }


    public enable():void {
        this.disabled = false;
    }

    private scrollHandler(e: any) {
        if (this.isWheeling || this.disable) {
            return;
        }

        this.raf.read(() => {
            this.targetY = this.getScrollTop();
        })
    }




    private wheelHandler(e: WheelEvent) {
        if(this.disabled) {
            return;
        }



        e.preventDefault();


        let delta = e.deltaY;
        let sensitivity = this.config.scrollSensitivity;


        // If we are using dynamicSensitivity, we basicaly want to normalize
        // large jumps.  Track pads typically have smaller jumps whereas,
        // mouse wheels can have very large deltas.
        if(this.config.dynamicSensitivity) {
            delta = e['wheelDeltaY'] ? -e['wheelDeltaY'] / 120 : e.deltaY;
        }


        this.raf.start();
        this.isWheeling = true;
        this.raf.read(() => {
            this.targetY =
                this.currentY + (delta * sensitivity);
        });
    }

    /**
     * Because this class hijacks the regular scroll, to update the actual scroll position,
     * we need a public method to make this accessible.
     *
     *
     * You'll most likely not need this method but it is available in case you run
     * into edge cases where you have issues with the wheel jacking.
     *
     * You can also look at the stopWheelJack() method as well.
     *
     * ```
     * const scroll = new ScrollRenderSmooth({
     *      scrollSensitivity: 4,
     *      lerp: 1,
     *      damp: 0.4
     *  });
     *
     * scroll.overrideScrollPosition(()=> {
     *   window.scrollTo(0,0);
     * })
     *
     * ```
     */
    public overrideScrollPosition(callback: Function) {
        this.stopWheelJack();
        callback();
        this.currentY = this.getScrollTop();
        this.targetY = this.currentY;
    }

}