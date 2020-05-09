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
	// tracks the "history depth" within the iframe
	var modalHistoryDepth;

	window.openModal = function(url, options) {
		// push history state, recording the opening of the modal
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

		openModalWithHistoryDepthTracking(url, options);
	}
	function openModalWithHistoryDepthTracking(url, options) {
		// configure the modal window to communicate history depth with us, so that we know how many history entries to pop in closeModalChild
		options = options || {};
		modalHistoryDepth = 0;
		var originalOnload = options.onload;
		options.onload = function(iw) {
			trackHistoryDepth(iw);
			originalOnload && originalOnload(iw);
		}
		rawOpenModal(url, options);
	}
	function trackHistoryDepth(iw) {
		/*
			TODO - cross origin support
		*/
		// TODO - fallback? window.performance is fairly new, I think there are older APIs we can use as fall back
		if (iw.performance.getEntriesByType('navigation')[0].type == 'navigate') {
			// This is a "new navigation" - increment modalHistoryDepth
			modalHistoryDepth++;
			var s = iw.history.state || {};
			s.openModalHistoryDepth = modalHistoryDepth;
			iw.history.replaceState(s, '', iw.location.href);
		}
		else {
			// We're either reloading or restoring history entry
			modalHistoryDepth = iw.history.state.openModalHistoryDepth;
		}

		// override pushState to increment modalHistoryDepth
		// we don't use pushState, but modal pages might
		// TODO - test
		var rawPushState = iw.history.pushState.bind(iw.history);
		iw.history.pushState = function(data, title, url) {
			modalHistoryDepth++;
			data.openModalHistoryDepth = modalHistoryDepth;
			rawPushState(data, title, url);
		}
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
			openModalWithHistoryDepthTracking(s.url, s.options);
		}
	}

	/*
		Make sure to unwind history when we close modal programmatically
	*/
	window.closeModalChild = function(value) {
		closeValue = value;
		history.go(-1 * modalHistoryDepth);
	}
})();