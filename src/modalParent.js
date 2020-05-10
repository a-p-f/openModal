import {getChildState, pushChildState} from './childState.js';

let iframe;
let lockedScrollTop, lockedScrollLeft;
let previousActiveElement;

// Will be a unique value for every modal we open
let modalID;
// so far, we only use options.onload, but we store all options anyway
let modalOptions;
// the actual closing of the modal happens in response to popstate
// we'll set this value before calling history.back()
let modalReturnValue;

// listen to messages from child
addEventListener('message', function(e) {
	if (e.source != iframe.contentWindow) return

	if (e.data.modalChildTitled) {
		iframe.setAttribute('aria-label', e.data.modalChildTitled);
	}
	if ('closeModalWithValue' == e.data) {
		_closeModalWithValue(e.data.closeModalWithValue);
	}
	if (e.data == 'modalChildPoppedState') {
		respondToStateChange();
	}
});
// same origin children will call this directly, allowing them to pass any value, not just serializable ones
window._closeModalWithValue = function(value) {
	modalReturnValue = value;
	console.debug('about to go back. iframe: ', iframe);

	/*
		Note - in some browsers, this will trigger popstate event in this window, which we handle.
		In other browsers, this will trigger popstate event in the modal window. The child window will catch that, and send us a 'modalChildPoppedState' message.
	*/
	history.back();
}

window.testIframe = function() {
	console.debug(iframe);
}

// respond to state changes
addEventListener('popstate', respondToStateChange);
addEventListener('load', respondToStateChange);
function respondToStateChange() {
	// console.debug('popped state in parent');
	const childState = getChildState();
	// console.debug(childState);
	// console.debug(lockedScrollLeft);
	// console.debug(modalID);
	// console.debug(location.href);
	if (!childState) {
		console.debug('iframe is :', iframe);
		if (iframe) {
			console.debug('closing iframe');
			closeModalChild();
		}
		return
	}
	// the correct modal is already open
	if (childState.id == modalID) return

	// the child modal is not "restorable" (contained non-serializable options)
	if (!childState.url) return

	_openModal(childState.id, childState.url, childState.options);
}

window.openModal = function(url, options={}) {
	const id = Date.now();
	try {
		pushChildState({
			id: id,
			url: url,
			options: options,
		});
	} catch(e) {
		// options could not be serialized
		// still push history entry, so we can pop modal
		// doesn't contain url or options, so we won't be able to restore modal on forward() 
		pushChildState({
			id: id,
		});
	}
	_openModal(id, url, options);
}

function _openModal(id, url, options={}) {
	if (iframe) {
		throw new Error('A modal window is already open. A window may only open one modal window at a time.');
	}

	modalID = id;
	modalOptions = options;
	modalReturnValue = null;

	previousActiveElement = document.activeElement;
	lockedScrollLeft = document.documentElement.scrollLeft;
	lockedScrollTop = document.documentElement.scrollTop;
	addEventListener('scroll', fixScroll);
	addEventListener('click', cancel, true);
	document.body.addEventListener('focus', refocus_iframe, true);

	iframe = createIframe();
	if (options.background) {
		iframe.style.background = options.background;
	}
	iframe.addEventListener('load', function(e) {
		options.onload && options.onload(iframe.contentWindow);
	});
	iframe.src = url;
}
function closeModalChild() {
	if (!iframe) {
		throw new Error('No modal window is currently open.');
	}
	iframe.parentElement.removeChild(iframe);
	removeEventListener('scroll', fixScroll);
	removeEventListener('click', cancel, true);
	document.body.removeEventListener('focus', refocus_iframe, true); 
	previousActiveElement && previousActiveElement.focus();

	modalOptions.onclose && modalOptions.onclose(modalReturnValue);

	iframe = null;
	modalID = null;
	modalOptions = null;
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