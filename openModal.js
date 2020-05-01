function openModal(url) {
	'use strict';

	// scroll locking
	var scrollTop = document.documentElement.scrollTop;
	var scrollLeft = document.documentElement.scrollLeft;
	function fixScroll() {
		document.documentElement.scrollTop = scrollTop;
		document.documentElement.scrollLeft = scrollLeft;
	}
	addEventListener('scroll', fixScroll);

	// force focus to stay in iframe
	function focus_iframe() {
		iframe.focus();
	}
	addEventListener('focus', focus_iframe, true);

	var previousElement = document.activeElement;
	var iframe = document.createElement('iframe');

	iframe.addEventListener('load', function() {
		var iw = iframe.contentWindow;
		var ft = iw.document.querySelector('[autofocus]');
		ft && ft.focus();
		iframe.setAttribute('aria-label', iw.document.title);
		iw.openModal = iw.openModal || openModal;
		iw.closeModal = function() {
			iframe.parentElement.removeChild(iframe);
		}
	});
	// cleanup after the iframe has been removed from DOM
	iframe.addEventListener('unload', function() {
		if (document.documentElement.contains(iframe)) return
		previousElement && previousElement.focus();
		removeEventListener('scroll', fixScroll);
		removeEventListener('focus', focus_iframe, true);
	});

	// Not used by us, but users can use this class if custom styling is required
	// (ie. set z-index on the iframe)
	iframe.classList.add('openModalIframe');
	iframe.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; margin: 0; padding: 0;';
	iframe.setAttribute('role', 'dialog');
	// TODO - test with screen reader in Safari, ensure content is accessible
	// See https://bugs.webkit.org/show_bug.cgi?id=174667
	// and https://developer.paciellogroup.com/blog/2018/06/the-current-state-of-modal-dialog-accessibility/
	// which suggest there is a serious issue in safari
	iframe.setAttribute('aria-modal', 'true');

	iframe.src = url;
	document.body.appendChild(iframe);
	return iframe
}