// CustomEvent polyfill courtesy of MDN
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill
(function () {
  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  window.CustomEvent = CustomEvent;
})();

(function() {
	'use strict';

	var iframe;
	var onclose;
	var lockedScrollTop, lockedScrollLeft;
	var previousActiveElement;

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
	function openModal(url, options) {
		if (iframe) {
			throw new Error('A ModalWindow is already open. A window may only open one ModalWindow at a time.');
		}
		options = options || {};

		onclose = options.onclose || null;
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
			/*
				TODO - support cross origin modal windows
				They will also need to include this script, and we'll have to use postMessage API
			*/
			iframe.contentWindow.closeModal = closeModal;
			
			var ft = iframe.contentDocument.querySelector('[autofocus]');
			ft && ft.focus();
			iframe.setAttribute('aria-label', iframe.contentDocument.title);

			options.onload && options.onload(iframe.contentWindow);
		});
		iframe.src = url;
	}
	function closeModal(value) {
		if (!iframe) {
			throw new Error('No ModalWindow is currently open.');
		}

		iframe.parentElement.removeChild(iframe);

		removeEventListener('scroll', fixScroll);
		removeEventListener('click', cancel, true);
		document.body.removeEventListener('focus', refocus_iframe, true); 
		previousActiveElement && previousActiveElement.focus();

		onclose && onclose(value);

		iframe = null;
		onclose = null;
	}

	window.openModal = openModal;
})();