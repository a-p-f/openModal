import * as iframe from './iframe.js';
import {lockScroll, releaseScroll} from './lockScroll.js';

let onclose_callback, onclose_value, onclose_resolve;
let saved_state;

// listen to messages from child
addEventListener('message', function(e) {
	const i = iframe.iframe;
	if (!i) return
	if (e.source != i.contentWindow) return

	if (e.data.modalChildTitled) {
		i.setAttribute('aria-label', e.data.modalChildTitled);
	}
	if ('setModalCloseValue' in e.data) {
		_setOpenModalCloseValue(e.data.setModalCloseValue);
	}
	if ('closeModalChild' in e.data) {
		closeChild();
	}
});
// same origin children will call this directly, allowing them to pass any value, not just serializable ones
window._setOpenModalCloseValue = function(value) {
	onclose_value = value;
	// Tell the child window to unwind its history
	iframe.iframe.contentWindow.postMessage('MODAL_CLOSE_VALUE_RECEIVED', '*');
}
function closeChild() {
	iframe.remove();
	history.replaceState(saved_state, '', location.href);
	releaseScroll();
	onclose_callback(onclose_value);
	onclose_resolve && onclose_resolve(onclose_value);
}

/*
	The only reason this is here is in case the page uses pushState, then opens a modal window, then the user uses the browser's back button drop down to go back multiple entries at once.
*/
addEventListener('popstate', function() {
	// TODO - we probably shouldn't replace state in this case
	// Pass flag to closeChild?
	if (iframe.iframe) closeChild();
});

window.openModal = function(url, {
	background=null,
	onload=w=>{},
	onclose=value=>{},
}={}) {
	if (iframe.iframe) {
		throw new Error('A modal window is already open. A window may only open one modal window at a time.');
	}

	// Note - we save the state, so that we can restore it later (after closing the modal)
	// Some browsers (IE) seem to prevent us from accessing the state after modal close, unless we do this
	saved_state = history.state;
	lockScroll();
	onclose_callback = onclose;
	onclose_value = undefined;
	iframe.create(url, background, onload);

	// Return a promise, but only if Promise() is implemented in browser
	try {
		return new Promise((resolve, reject) => {
			onclose_resolve = resolve;
		});
	} catch (e) {}
}
