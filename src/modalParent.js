import {lockScroll, releaseScroll} from './lockScroll.js';

let iframe;
let previousActiveElement;
let onModalclose;
let modalCloseValue;

let savedState = null;
// Make sure it's unique, in case we end up being able to read states created in the child modal window
const BEFORE_MODAL = 'before_openModal'+Date.now();
const MODAL_OPEN = 'after_openModal'+Date.now();

// listen to messages from child
addEventListener('message', function(e) {
	if (!iframe) return
	if (e.source != iframe.contentWindow) return

	if (e.data.modalChildTitled) {
		iframe.setAttribute('aria-label', e.data.modalChildTitled);
	}
	if ('setModalCloseValue' in e.data) {
		_setOpenModalCloseValue(e.data.setModalCloseValue);
	}
	if ('closeModal' in e.data) {
		closeModal();
	}
});
/*
	In some browsers (safari), when the modal goes back to it's original history state, the popstate event will be fired in this window.
*/
addEventListener('popstate', function() {
	if (!iframe) return
	if (history.state == BEFORE_MODAL) {
		closeModal();
	}
	else if (history.state && history.state[MODAL_OPEN]) {
		history.back();
	}
});

// same origin children will call this directly, allowing them to pass any value, not just serializable ones
window._setOpenModalCloseValue = function(value) {
	modalCloseValue = value;
	// Tell the child window to unwind its history
	// It will be closed AFTER history unwinds
	iframe.contentWindow.postMessage('MODAL_CLOSE_VALUE_RECEIVED', '*');
}
function closeModal() {
	if (!iframe) {
		throw new Error('No modal window is currently open.');
	}
	releaseScroll();
	iframe.parentElement.removeChild(iframe);
	removeEventListener('click', cancel, true);
	document.body.removeEventListener('focus', refocus_iframe, true); 
	previousActiveElement && previousActiveElement.focus();
	previousActiveElement = null;
	iframe = null;

	history.replaceState(savedState, '', location.href);
	onModalclose && onModalclose(modalCloseValue);
	onModalclose = null;
}

window.openModal = function(url, options={}) {
	if (iframe) {
		throw new Error('A modal window is already open. A window may only open one modal window at a time.');
	}

	savedState = history.state;
	history.replaceState(BEFORE_MODAL, '', location.href);
	history.pushState({[MODAL_OPEN]: true}, '', location.href);

	lockScroll();
	previousActiveElement = document.activeElement;
	addEventListener('click', cancel, true);
	document.body.addEventListener('focus', refocus_iframe, true);

	onModalclose = options.onclose;

	iframe = createIframe();
	if (options.background) {
		iframe.style.background = options.background;
	}
	iframe.addEventListener('load', function(e) {
		options.onload && options.onload(iframe.contentWindow);
	});
	iframe.src = url;
}
function createIframe() {
	var i = document.createElement('iframe');
	var s = i.style;
	s.position= 'fixed';
	s.top = 0;s.left = 0;s.width = '100%';s.height = '100%';
	s.border = 'none';
	s.margin = 0; s.padding = 0;
	// This is MAX_SAFE_INTEGER in JS
	// This is larger than the maximum supported z-index in any current browser
	// All modern browsers treat this as equivalent to the maximum possible z-index
	// TODO - test
	s.zIndex = 9007199254740991;

	// TODO - fallback for browsers not supporting position: fixed (Opera Mini)
	i.setAttribute('role', 'dialog');
	// TODO - test with screen reader in Safari, ensure content is accessible
	// See https://bugs.webkit.org/show_bug.cgi?id=174667
	// and https://developer.paciellogroup.com/blog/2018/06/the-current-state-of-modal-dialog-accessibility/
	// which suggest there is a serious issue in safari
	i.setAttribute('aria-modal', 'true');
	document.body.appendChild(i);
	return i;
}
function cancel(event) {
	event.stopPropagation();
	event.preventDefault();
}
function refocus_iframe() {
	if (document.activeElement != iframe) iframe.focus();
}