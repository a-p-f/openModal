import './polyfills/element_closest.js';
/*
Works like jQuery's .on
*/
export default function(target, selector, type, listener, options) {
    target.addEventListener(type, function(event) {
        const matched_target = event.target.closest(selector);
        if (!matched_target) return
        listener.call(matched_target, event);
    }, options);
}