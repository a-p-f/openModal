/*
	Ultimate goal: closeModal() should pop any history entries corresponding to navigations that occurred within the modal before we actually remove the iframe.

	Challenge: determining the number of history entries to pop

	Reminders:
	- history.length is shared between iframe and parent window (for same origin)
	- history.length doesn't tell you where are you in that list
	- sessionStorage is shared between iframe and parent (for same origin)
	
	General approach:
	- override openModal
		- inject a load listener which tracks the "history depth" of the iframe
	- override closeModalChild
		- history.go(...) before doing the actual close
*/
(function() {
	var rawOpenModal = window.openModal;

	window.openModal = function(url, options) {
		var historyDepth = 0;
		var options = options || {};
		var originalOnload = options.onload;
		options.onload = function(iw) {
			if (iw.performance.getEntriesByType('navigation')[0].type == 'navigate') {
				// This is a "new navigation" - increment historyDepth
				historyDepth++;
				var s = iw.history.state || {};
				s.openModalHistoryDepth = historyDepth;
				iw.history.replaceState(s, '', iw.location.href);
			}
			else {
				// We're either reloading or restoring history entry
				historyDepth = iw.history.state.openModalHistoryDepth;
			}

			// override pushState to increment historyDepth
			// we don't use pushState, but modal pages might
			var rawPushState = iw.history.pushState.bind(iw.history);
			iw.history.pushState = function(data, title, url) {
				historyDepth++;
				data.openModalHistoryDepth = historyDepth;
				rawPushState(data, title, url);
			}

			var rawCloseModal = iw.closeModal;
			iw.closeModal = function(value) {
				var toUnwind = iw.history.state.openModalHistoryDepth - 1;
				history.go(-1*toUnwind);
				rawCloseModal(value);
			}

			originalOnload && originalOnload(iw);
		}
		rawOpenModal(url, options);
	}
})();