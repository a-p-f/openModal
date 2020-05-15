import {safeGetState} from './utils.js';

let iframe;
let lockedScrollTop, lockedScrollLeft;
let previousActiveElement;
let onModalclose;
let modalCloseValue;

// listen to messages from child
addEventListener('message', function(e) {
	if (!iframe) return
	if (e.source != iframe.contentWindow) return

	if (e.data.modalChildTitled) {
		iframe.setAttribute('aria-label', e.data.modalChildTitled);
	}
	if ('setModalCloseValue' in e.data) {
		console.debug('received set close value message');
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
	if (iframe) closeModal();
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
	iframe.parentElement.removeChild(iframe);
	removeEventListener('scroll', fixScroll);
	removeEventListener('click', cancel, true);
	document.body.removeEventListener('focus', refocus_iframe, true); 
	previousActiveElement && previousActiveElement.focus();
	iframe = null;

	onModalclose && onModalclose(modalCloseValue);
	onModalclose = null;
}

function getActiveElement() {
	let c = document.activeElement;
	// If the activeElement is an iframe, try to descend into the iframe
	// If we reach a cross-origin iframe, error will br thrown
	try {
		while (c && c.contentDocument && c.contentDocument.activeElement) {
			c = c.contentDocument.activeElement;
		}
	} catch(e) {}
	return c;
}

window.openModal = function(url, options={}) {
	if (iframe) {
		throw new Error('A modal window is already open. A window may only open one modal window at a time.');
	}

	previousActiveElement = getActiveElement();
	lockedScrollLeft = document.documentElement.scrollLeft;
	lockedScrollTop = document.documentElement.scrollTop;
	addEventListener('scroll', fixScroll);
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
function fixScroll() {
	document.documentElement.scrollTop = lockedScrollTop;
	document.documentElement.scrollLeft = lockedScrollLeft;
}
function cancel(event) {
	event.stopPropagation();
	event.preventDefault();
}
function refocus_iframe() {
	if (document.activeElement != iframe) iframe.focus();
}