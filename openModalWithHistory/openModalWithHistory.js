(function() {
	'use strict';

	var closeValue;
	var rawCloseModalChild = window.closeModalChild;

	/*
		Before passing the options on to openModal, record a new history state.
	*/
	function openModalWithHistory(url, options) {
		var s = history.state || {};
		s.openModalWithHistoryState = {
			url: url,
			options: options,
		}
		// Note - will fail if options is not serializable
		// Don't bother catching - the error is self-explanatory
		history.pushState(s, '', location.href);

		openModal(url, options);
	}
	window.openModalWithHistory = openModalWithHistory;

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
			Note - we do not allow changes to our history while ANY modal is open (even those not opened via openModalWithHistory).
			
			Our history WILL change whenever a modal is opened/closed "with history". It MAY also change at any time when there is no modal open (if your page uses pushState).

			Our history MAY NOT change while any modal is open (even those opened "without history"). This is a rule we are imposing, but I can't see why anyone would ever want to do that (the parent is non-interactive while a modal child is open, so why should history entries be created?).

			This means that, in response to any history state change, we can safely close any modal that is currently open.
		*/
		try {
			rawCloseModalChild();
		} catch(e) {
			// No modal was open.
		}

		if (state && state.openModalWithHistoryState) {
			var s = state.openModalWithHistoryState;
			openModal(s.url, s.options);
		}
	}

	/*
		Whenever someone tries to close a modal window directly, first check if the modal was opened with history.

		If it was, we want the outcome to be equivalent to the user having exited the modal via the browser's back button. So we invoke history.back(), and let our popstate listener do the actual close.
	*/
	window.closeModalChild = function(value) {
		if (history.state && history.state.openModalWithHistoryState) {
			closeValue = value;

			// TODO - verify that, even if the modal window has its own history (ie it navigated between several pages), this will back out our history, not the iframe's.

			/*
				Aargh! Doesn't work. If iframe has history, it unwinds that.
				
			*/
			history.back();
		}
		else {
			rawCloseModalChild();
		}
	}
})();