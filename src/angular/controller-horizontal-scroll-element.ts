import { HorizontalScrollElement, HorizontalScrollElementEvents } from '../dom/horizontal-scroll-element';
import { INgDisposable } from "./i-ng-disposable";
import { DomWatcher } from '../dom/dom-watcher';


export interface HorizontalScrollElementControllerInitConfig {
    scrollSelector: string;
    leftAlign: boolean;
}

/**
 * A composition around HorizontalScrollElement.
 *
 * ```
 *
 * import { HorizontalScrollElementController } from 'yano-js/lib/angular/controller-horizontal-scroll-element';
 * app.controller('HorizontalScrollElementController', HorizontalScrollElementController);
 *
 * ```
 *
 *
 * @see HorizontalScrollElement for docs.
 */
export class HorizontalScrollElementController implements INgDisposable {

    private el: HTMLElement;
    private scrollElement: HTMLElement;
    private $scope: ng.IScope;
    private horizontalScroll: HorizontalScrollElement;
    private domWatcher: DomWatcher;
    static get $inject() {
        return ['$scope', '$element', '$attrs'];
    }

    constructor($scope: ng.IScope, $element: ng.IAngularStatic, $attrs: ng.IAttributes) {
        this.$scope = $scope;
        this.el = $element[0];
        $scope.$on('$destroy', () => {
            this.dispose();
        });
    }


    public init(config: HorizontalScrollElementControllerInitConfig) {
        this.scrollElement = this.el;
        this.domWatcher = new DomWatcher();


        if(config.scrollSelector) {
            this.scrollElement = this.el.querySelector(config.scrollSelector);
            if(!this.scrollElement) {
                throw new Error('An element with the selector ' + config.scrollSelector + ' was not found');
            }
        }

        this.domWatcher.add({
            element: this.scrollElement,
            on: HorizontalScrollElementEvents.INDEX_CHANGE,
            callback: (event: any)=> {
                if (!this.$scope.$$phase) {
                    this.$scope.$apply();
                }
            },
        })


        window.setTimeout(()=> {
            this.horizontalScroll = new HorizontalScrollElement({
                rootElement: this.scrollElement,
                leftAlign: config.leftAlign || false,
                resizeOnFirstEv: false,
                snapToClosest: true,
                slideDeltaValues: true,
                dragBounce: 0,
                delayResizeMs: 10,
            });

            const deltaSelector = this.el.getAttribute('add-delta-value-elements-selector');
            if(deltaSelector) {
                const group = Array.from(this.el.querySelectorAll(deltaSelector)) as Array<HTMLElement>;
                this.horizontalScroll.addSlideDeltaValuesToElements([group]);
            }

        })

    }


    public prev():void {
        this.horizontalScroll && this.horizontalScroll.prev();
    }


    public next():void {
        this.horizontalScroll && this.horizontalScroll.next();
    }


    public isFirstSlide() {
        return this.horizontalScroll && this.horizontalScroll.isFirstSlide();
    }

    public isLastSlide() {
        return this.horizontalScroll && this.horizontalScroll.isLastSlide();
    }

    public dispose():void {
        this.horizontalScroll && this.horizontalScroll.dispose();
        this.domWatcher && this.domWatcher.dispose();
    }
}

