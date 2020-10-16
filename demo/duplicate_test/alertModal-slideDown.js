addEventListener('load', function() {
	'use strict';

	var w = document.querySelector('.AlertWindow');

	// Only animate down if this is the first load within the modal window
	if (!isFirstModalLoad()) {
		// Disable transition so we can move it down immediately
		w.style.transition = 'none';
		// But then restore transition, so we can still animate it out later
		setTimeout(function() {
			w.style.transition = '';
		}, 100);
	}

	// Move the window down
	w.style.transform = 'none';
	
	// Patch closeModal to animate it out
	var _closeModal = closeModal;
	window.closeModal = function(value) {
		document.querySelector('.AlertWindow').style.transform = '';
		setTimeout(function() {
			_closeModal(value);
		}, 300);
	}
});