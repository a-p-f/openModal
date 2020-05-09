/*
	Notes:
	- should work cross origin, no need to load script in child
	- we can always pop modal on back, cannot restore if options not serializable (this is by design, anyway)
	- closeModal() doesn't work if you create history entries in the iframe -> it only unwinds one, when it should unwind multiple
*/

(function() {
	'use strict';

	var closeValue;
	var rawOpenModal = window.openModal;
	var rawCloseModalChild = window.closeModalChild;

	/*
		Before passing the options on to openModal, record a new history state.
	*/
	window.openModal = function(url, options) {
		var s = history.state || {};
		s.openModalArguments = {
			url: url,
			options: options,
		}
		try {
			history.pushState(s, '', location.href);
		} catch (e) {
			// options is not serializable
			// we still add a history entry, so that we can close this modal on back, but we won't be able to restore it on forward navigation
			s.openModalArguments = null;
			history.pushState(s, '', location.href);
		}

		rawOpenModal(url, options);
	}

	/*
		Respond to history changes caused by forward/back/reload.
	*/
	addEventListener('popstate', function(e) {
		respondToStateChange(e.state);
	});
	addEventListener('load', function() {
		respondToStateChange(history.state);
	});
	function respondToStateChange(state) {
		/*
			Note - we do not allow changes to our history while any modal is open.
			
			Our history WILL change whenever a modal is opened/closed. It MAY also change at any time when there is no modal open (if your page uses pushState).

			Our history MAY NOT change while any modal is open. This is a rule we are imposing, but I can't see why anyone would ever want to do that (the parent is non-interactive while a modal child is open, so why should history entries be created?).

			This means that, in response to any history state change, we can safely close any modal that is currently open (since it could not have been open both before and after a history change).
		*/
		try {
			rawCloseModalChild();
		} catch(e) {
			// No modal was open.
		}

		if (state && state.openModalArguments) {
			var s = state.openModalArguments;
			rawOpenModal(s.url, s.options);
		}
	}

	/*
		Make sure to unwind history when we close modal programmatically
	*/
	window.closeModalChild = function(value) {
		closeValue = value;
		history.back();
	}
})();