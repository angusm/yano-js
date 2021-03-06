import { bom } from '../dom/bom';

export interface DomWatcherConfig {
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
    // The default event listerner options including passive, once etc.
    eventOptions?: Object | undefined;

    /**
     * The element to Watch
     */
    element: HTMLElement | Window;

    /**
     * The name of the event to watch.
     */
    on: string;

    /**
     * The callback to execute.
     */
    callback: Function;

    /**
     * A condition in which the function should run.
     * For example, you may want to limit execution of the callback
     * to just mobile.
     */
    runWhen?: Function;

    /**
     * Pass an id to this lister
     */
    id?: string;

    /**
     * The actual listener that gets attached to the element.
     * This gets created by DomWatcher.
     */
    listener?: EventListenerOrEventListenerObject;

    /**
     * A function that removes the listener.  Generated by DomWatcher.
     */
    remover?: Function;
}


/**
 * A class that helps with DOM events.  The main usecase for this class is
 * to be able to watch the dom and then later remove a group of events
 * all at once.
 *
 * Basic Usage
 * ```ts
 * let watcher = new DomWatcher();
 *
 * var scrollCallback = (event, done)=> {
 *   // on scroll events.
 * };
 * watcher.add({
 *   element: window,
 *   on: 'scroll',
 *   callback: scrollCallback,
 *   eventOptions: { passive: true }
 * })
 *
 * watcher.add({
 *   element: element,
 *   on: 'click',
 *   callback: ()=> {},
 * );
 *
 *
 * // Removes all watchers.
 * watcher.removeAll();
 * ```
 *
 *
 * Advanged Usage
 * ```ts
 * let new watcher = new DomWatcher();
 *
 * // Removes by Id
 * watcher.add({
 *   element: element,
 *   on: 'click',
 *   callback: ()=> {},
 *   id: 'abc'
 * );
 *
 *
 * // Runs the callback associated with abc.  NOTE this is just dry running it
 * // so it's not an actual browser event (hence no event data is provided).
 * watcher.run('abc');
 *
 * watcher.removeById('abc');
 *
 *
 * // Ids actually don't need to be unique.
 * watcher.add({ element: element, on: 'click', callback: ()=> {}, id: 'group1');
 * watcher.add({ element: anotherElement, on: 'mousemove', callback: ()=> {}, id: 'group1');
 * watcher.removeById('group1');
 *
 * // Conditional execution
 * watcher.add({
 *    element: window
 *    callback: ()=> {
 *      console.log('called only on mobile');
 *    }
 *    eventOptions: { passive: true }
 *    on: 'scroll',
 *    runWhen: window.innerWidth < 600
 * });
 *
 *
 * watcher.add({
 *    element: submitElement
 *    callback: ()=> {
 *      console.log('submitted');
 *    }
 *    on: 'click',
 *    runWhen: ()=> { return this.validate()}
 * });
 *
 * ```
 *
 *
 * #### Debouncing
 *
 * ```ts
 * // Add debouncing.
 *     watcher.add({
 *         element: document.body,
 *         on: 'mousemove',
 *         callback: func.debounce((event) => {
 *             console.log('movemove!!');
 *         }, 500),
 *     });
 *
 * ```
 *
 * #### SmartResize
 * How can I use this with bom.smartResize?
 * Just use the 'smartResize' event instead.
 *
 * ```ts
 *
 *     watcher.add({
 *         element: window,
 *         on: 'smartResize',
 *         callback: (event) => {
 *             console.log('smart resizing');
 *         },
 *     });
 *
 * ```
 *
 *
 * Culling events only when an element is inview.
 * See example/scroll-demo for actual example.
 *
 * ```ts
 *   let ev = elementVisibility.inview(element, {});
 *   let watcher = new DomWatcher();
 *   watcher.add({
 *      element: window,
 *      on: 'scroll',
 *      eventOptions: { passive: true },
 *      callback: ()=> {
 *         // Runs only when this element is inview.
 *      },
 *      // Tells to run scroll ONLY when the element is inview.
 *      runWhen: ()=> { return ev.state().inview; }
 *   });
 *
 *
 *   // Later
 *   ev.dispose();
 *   watcher.dispose();
 *
 * ```
 *
 *
 */
export class DomWatcher {
    /**
     * All internal watcher configs.
     */
    private watcherConfigs: Array<DomWatcherConfig>;

    constructor() {
        this.watcherConfigs = [];
    }

    /**
     * Adds a watcher and immediately begins watching.
     * @param config
     */
    add(config: DomWatcherConfig) {
        let listener = (event: any) => {
            if (config.runWhen) {
                config.runWhen() && config.callback(event);
            } else {
                config.callback(event);
            }
        }

        config.listener = listener;

        // If the on event is smartResize, wrap it with dom.smartResize.
        if (config.on == 'smartResize') {
            config.remover =
                bom.smartResize(listener, config.eventOptions || {});
        } else {
            // Add listening.
            config.element.addEventListener(
                config.on,
                listener,
                config.eventOptions || {}
            )

            // Generate the remover.
            config.remover = () => {
                config.element.removeEventListener(
                    config.on,
                    listener
                );
            }
        }


        this.watcherConfigs.push(config);
    }

    /**
     * Removes a given watcher by id.
     * @param id The id of the watcher to remove.
     */
    removeById(id: string) {
        this.watcherConfigs = this.watcherConfigs.filter((config: DomWatcherConfig) => {
            if (config.id && config.id == id) {
                // Save as var to avoid typescript null error.
                const remover = config.remover;
                remover && remover();
            } else {
                return config;
            }
        });
    }


    /**
     * Removes all dom watchers.
     */
    removeAll() {
        this.watcherConfigs.forEach((config) => {
            const remover = config.remover;
            remover && remover();
        })
        this.watcherConfigs = [];
    }

    /**
     *
     * Dry runs a callback by id.  This just calls the callback and isn't the
     * actual browser event so no event data will be available when using
     * this method.
     *
     * ```ts
     * watcher.add({
     *    element: element,
     *    callback: ()=> {
     *      console.log('yo');
     *    }
     *    on: 'click',
     *    id: 'yo'
     * });
     *
     * watcher.run('yo');
     * ```
     * @param id
     */
    run(id: string) {
        let configsToRun = this.watcherConfigs.filter(
            (config: DomWatcherConfig) => {
                return config.id && config.id == id;
            });

        configsToRun.forEach((config) => {
            config.callback() && config.callback();
        })
    }


    /**
     * Disposes of domWatcher.
     */
    dispose() {
        this.removeAll();
    }
}
