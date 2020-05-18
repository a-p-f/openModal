let previousActiveElement;

export let iframe;

export function create(url, background, onload) {
	previousActiveElement = document.activeElement;
	addEventListener('click', cancel, true);
	document.body.addEventListener('focus', refocus_iframe, true);

	iframe = document.createElement('iframe');
	var s = iframe.style;
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
	iframe.setAttribute('role', 'dialog');
	// TODO - test with screen reader in Safari, ensure content is accessible
	// See https://bugs.webkit.org/show_bug.cgi?id=174667
	// and https://developer.paciellogroup.com/blog/2018/06/the-current-state-of-modal-dialog-accessibility/
	// which suggest there is a serious issue in safari
	iframe.setAttribute('aria-modal', 'true');
	document.body.appendChild(iframe);

	if (background) {
		iframe.style.background = background;
	}
	iframe.addEventListener('load', function(e) {
		onload && onload(iframe.contentWindow);
	});
	iframe.src = url;

	return iframe;
}
export function remove() {
	if (!iframe) return
	iframe.parentElement.removeChild(iframe);
	removeEventListener('click', cancel, true);
	document.body.removeEventListener('focus', refocus_iframe, true); 
	previousActiveElement && previousActiveElement.focus();
	previousActiveElement = null;
	iframe = null;
}
function cancel(event) {
	event.stopPropagation();
	event.preventDefault();
}
function refocus_iframe() {
	if (document.activeElement != iframe) iframe.focus();
}