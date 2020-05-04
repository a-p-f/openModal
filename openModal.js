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

	var openIframe;
	var lockedScrollTop, lockedScrollLeft;
	var previousActiveElement;

	function createIframe() {
		var i = document.createElement('iframe');
		// Not used by us, but users can use this class if custom styling is required
		// (ie. set z-index on the iframe)
		i.classList.add('openModalIframe');
		i.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; margin: 0; padding: 0;';
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
		if (document.activeElement != openIframe) openIframe.focus();
	}
	function openModal(url) {
		if (openIframe) {
			throw new Error('A ModalWindow is already open. A window may only open one ModalWindow at a time.');
		}

		lockedScrollLeft = document.documentElement.scrollLeft;
		lockedScrollTop = document.documentElement.scrollTop;
		addEventListener('scroll', fixScroll);
		addEventListener('click', cancel, true);
		document.body.addEventListener('focus', refocus_iframe, true);

		var iframe = createIframe();
		iframe.addEventListener('load', function(e) {
			/*
				TODO - support cross origin modal windows
				They will also need to include this script, and we'll have to use postMessage API
			*/
			iframe.contentWindow.modalParent = window;
			iframe.contentWindow.modalClose = closeModal;
			
			var ft = iframe.contentDocument.querySelector('[autofocus]');
			ft && ft.focus();
			iframe.setAttribute('aria-label', iframe.contentDocument.title);
		});
		iframe.src = url;
		openIframe = iframe;
		return {
			contentWindow: iframe.contentWindow,
			addEventListener: iframe.addEventListener.bind(iframe),
			removeEventListener: iframe.removeEventListener.bind(iframe),
			close: closeModal,
		}
	}
	function closeModal(value) {
		if (!openIframe) {
			throw new Error('No ModalWindow is currently open.');
		}

		openIframe.parentElement.removeChild(openIframe);

		removeEventListener('scroll', fixScroll);
		removeEventListener('click', cancel, true);
		document.body.removeEventListener('focus', refocus_iframe, true); 

		openIframe.dispatchEvent(new CustomEvent('close', {
			detail: value,
		}));

		openIframe = null;
	}

	window.openModal = openModal;
})();