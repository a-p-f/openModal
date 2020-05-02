window.openModal = function(url, onload, onclose) {
	'use strict';

	// scroll locking
	/*
		TODO: ?
		Detect if scroll bar currently takes up any space (most new browsers just render scroll bar over top of content).
		If not, then just set overflow: hidden.
		Current implementation can be a little jittery, and overflow: hidden would fix that.
		The reason 
	*/
	var scrollTop = document.documentElement.scrollTop;
	var scrollLeft = document.documentElement.scrollLeft;
	function fixScroll() {
		document.documentElement.scrollTop = scrollTop;
		document.documentElement.scrollLeft = scrollLeft;
	}
	addEventListener('scroll', fixScroll);

	function cancel(event) {
		event.stopPropagation();
		event.preventDefault();
	}
	addEventListener('click', cancel, true);

	// force focus to stay in iframe
	function focus_iframe() {
		if (document.activeElement != iframe) iframe.focus();
	}
	document.body.addEventListener('focus', focus_iframe, true);

	var previousElement = document.activeElement;
	var iframe = document.createElement('iframe');

	iframe.closeModal = function(value) {
		removeEventListener('scroll', fixScroll);
		document.body.removeEventListener('focus', focus_iframe, true);
		removeEventListener('click', cancel, true);
		iframe.parentElement.removeChild(iframe);
		previousElement && previousElement.focus();
		if (onclose) onclose(value);
	}
	iframe.addEventListener('load', function() {
		var iw = iframe.contentWindow;
		var ft = iw.document.querySelector('[autofocus]');
		ft && ft.focus();
		iframe.setAttribute('aria-label', iw.document.title);
		iw.closeModal = iframe.closeModal;
		if (onload) onload(iframe);
	});

	// Not used by us, but users can use this class if custom styling is required
	// (ie. set z-index on the iframe)
	iframe.classList.add('openModalIframe');
	iframe.style = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none; margin: 0; padding: 0;';
	// TODO - fallback for browsers not supporting position: fixed (Opera Mini)
	iframe.setAttribute('role', 'dialog');
	// TODO - test with screen reader in Safari, ensure content is accessible
	// See https://bugs.webkit.org/show_bug.cgi?id=174667
	// and https://developer.paciellogroup.com/blog/2018/06/the-current-state-of-modal-dialog-accessibility/
	// which suggest there is a serious issue in safari
	// iframe.setAttribute('aria-modal', 'true');

	iframe.src = url;
	document.body.appendChild(iframe);
	iframe.focus();
	return iframe
}