import * as historyDepth from './historyDepth.js';

// Make sure this is actually a modal child before we do anything
if (window.parent != window && window.parent._closeModalWithValue) {
	historyDepth.initialize();

	window.parent.postMessage({
		modalChildTitled: document.title,
	});

	const target = document.querySelector('[autofocus]');
	if (target) {
		target.focus();
	}
	else {
		document.body.tabIndex = -1;
		document.body.focus();
	}

	window.closeModal = closeModal;
}

function closeModal(value) {
	historyDepth.unwind();

	try {
		// if same origin, call function on parent directly
		// this allows us to pass any value
		window.parent._closeModalWithValue(value);
	} catch(e) {
		// parent is cross-origin
		// value must be serializable
		window.parent.postMessage({
			closeModalWithValue: value,
		});
	}
}