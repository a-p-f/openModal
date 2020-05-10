import * as historyDepth from './historyDepth.js';


addEventListener('popstate', function(e) {
	console.debug('popstate occurred in ' + location.pathname);
	console.debug(history.state);
});



let closeValue;

// Make sure this is actually a modal child before we do anything
if (window.parent != window && window.parent._closeModalWithValue) {
	// TODO: explain
	window.name = window.name || 'openModalWindow'+Date.now();


	historyDepth.initialize();

	window.parent.postMessage({
		modalChildTitled: document.title,
	}, '*');

	const target = document.querySelector('[autofocus]');
	if (target) {
		target.focus();
	}
	else {
		document.body.tabIndex = -1;
		document.body.focus();
	}

	/*
		Note - we make sure to manipulate history only AFTER this iframe has focus
	*/
	if (historyDepth.isPageZero()) {
		historyDepth.duplicateState();
	}

	addEventListener('popstate', function() {
		/*
			TODO:
			Also consider the case where we've gone back even further
			(ie the user used back menu to go back multiple pages at once)
			History state will have no depth data at all, and I think some browsers (IE) won't even let us read the state (since it wasn't created in this window).
		*/
		console.debug('popped state in child: ', history.state);
		if (historyDepth.isPageZero()) {
			exit();
		}
	});

	window.closeModal = function(value) {
		closeValue = value;
		historyDepth.unwind();
	}
}

function exit() {
	try {
		// if same origin, call function on parent directly
		// this allows us to pass any value
		window.parent._closeModalWithValue(closeValue);
	} catch(e) {
		// parent is cross-origin
		// value must be serializable
		window.parent.postMessage({
			closeModalWithValue: closeValue,
		}, '*');
	}
}