(function () {
	'use strict';

	var iframe;
	var lockedScrollTop, lockedScrollLeft;
	var previousActiveElement;
	var onModalclose;
	var modalCloseValue; // listen to messages from child

	addEventListener('message', function (e) {
	  if (!iframe) return;
	  if (e.source != iframe.contentWindow) return;

	  if (e.data.modalChildTitled) {
	    iframe.setAttribute('aria-label', e.data.modalChildTitled);
	  }

	  if ('setModalCloseValue' in e.data) {
	    console.debug('received set close value message');

	    _setOpenModalCloseValue(e.data.setModalCloseValue);
	  }

	  if ('closeModal' in e.data) {
	    closeModal();
	  }
	});
	/*
		In some browsers (safari), when the modal goes back to it's original history state, the popstate event will be fired in this window.
	*/

	addEventListener('popstate', function () {
	  if (iframe) closeModal();
	}); // same origin children will call this directly, allowing them to pass any value, not just serializable ones

	window._setOpenModalCloseValue = function (value) {
	  modalCloseValue = value; // Tell the child window to unwind its history
	  // It will be closed AFTER history unwinds

	  iframe.contentWindow.postMessage('MODAL_CLOSE_VALUE_RECEIVED', '*');
	};

	function closeModal() {
	  if (!iframe) {
	    throw new Error('No modal window is currently open.');
	  }

	  iframe.parentElement.removeChild(iframe);
	  removeEventListener('scroll', fixScroll);
	  removeEventListener('click', cancel, true);
	  document.body.removeEventListener('focus', refocus_iframe, true);
	  previousActiveElement && previousActiveElement.focus();
	  iframe = null;
	  onModalclose && onModalclose(modalCloseValue);
	  onModalclose = null;
	}

	window.openModal = function (url) {
	  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	  if (iframe) {
	    throw new Error('A modal window is already open. A window may only open one modal window at a time.');
	  }

	  previousActiveElement = document.activeElement;
	  lockedScrollLeft = document.documentElement.scrollLeft;
	  lockedScrollTop = document.documentElement.scrollTop;
	  addEventListener('scroll', fixScroll);
	  addEventListener('click', cancel, true);
	  document.body.addEventListener('focus', refocus_iframe, true);
	  onModalclose = options.onclose;
	  iframe = createIframe();

	  if (options.background) {
	    iframe.style.background = options.background;
	  }

	  iframe.addEventListener('load', function (e) {
	    options.onload && options.onload(iframe.contentWindow);
	  });
	  iframe.src = url;
	};

	function createIframe() {
	  var i = document.createElement('iframe');
	  var s = i.style;
	  s.position = 'fixed';
	  s.top = 0;
	  s.left = 0;
	  s.width = '100%';
	  s.height = '100%';
	  s.border = 'none';
	  s.margin = 0;
	  s.padding = 0; // This is MAX_SAFE_INTEGER in JS
	  // This is larger than the maximum supported z-index in any current browser
	  // All modern browsers treat this as equivalent to the maximum possible z-index
	  // TODO - test

	  s.zIndex = 9007199254740991; // TODO - fallback for browsers not supporting position: fixed (Opera Mini)

	  i.setAttribute('role', 'dialog'); // TODO - test with screen reader in Safari, ensure content is accessible
	  // See https://bugs.webkit.org/show_bug.cgi?id=174667
	  // and https://developer.paciellogroup.com/blog/2018/06/the-current-state-of-modal-dialog-accessibility/
	  // which suggest there is a serious issue in safari

	  i.setAttribute('aria-modal', 'true');
	  document.body.appendChild(i);
	  return i;
	}

	function fixScroll() {
	  document.documentElement.scrollTop = lockedScrollTop;
	  document.documentElement.scrollLeft = lockedScrollLeft;
	}

	function cancel(event) {
	  event.stopPropagation();
	  event.preventDefault();
	}

	function refocus_iframe() {
	  if (document.activeElement != iframe) iframe.focus();
	}

	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var depthKey;

	function isModalChild() {
	  // TODO - more robust check?
	  return window.parent != window;
	}

	addEventListener('message', function (e) {
	  if (e.source != window.parent) return;

	  if (e.data == 'MODAL_CLOSE_VALUE_RECEIVED') {
	    console.debug('parent acked value. unwinding...'); // Go back to initial state before closing the modal window
	    // In some browsers, this will trigger popstate in our window
	    // (and our popstate listener will call exit())
	    // In other browsers, this will cause a popstate event in the parent window

	    history.go(-1 * parseInt(sessionStorage[depthKey])); // IE hack
	    // In some edge cases, the above history unwind will neither fire popstate nor load a new page (even though it does correctly change history entry)
	    // TODO - guard this with an "is IE" check, so we know we aren't using this garbage in other browsers?

	    setTimeout(exit, 200);
	  }
	});

	window.closeModal = function (value) {
	  if (!isModalChild()) {
	    throw new Error('This is not a modal window');
	  } // Parent will let us know when it receives this message, then we'll unwind history
	  // TODO - test same origin with non-serializable value, test cross-origin


	  try {
	    window.parent._setOpenModalCloseValue(value);
	  } catch (e) {
	    // TODO - add test/ensure that this will reach the parent before popstate event (in browsers where the popstate event fires on the parent)
	    // Maybe we should just until parent acknowledges message?
	    window.parent.postMessage({
	      setModalCloseValue: value
	    }, '*');
	  }
	};

	function exit() {
	  window.parent.postMessage({
	    closeModal: true
	  }, '*');
	}

	function prepareChildDocument() {
	  window.parent.postMessage({
	    modalChildTitled: document.title
	  }, '*');
	  var target = document.querySelector('[autofocus]');

	  if (target) {
	    target.focus();
	  } else {
	    document.body.tabIndex = -1;
	    document.body.focus();
	  }
	}

	function didNavigateForward() {
	  // current API
	  try {
	    return performance.getEntriesByType('navigation')[0].type == 'navigate';
	  } catch (e) {
	    // older API
	    var n = performance.navigation;
	    return n.type === n.TYPE_NAVIGATE;
	  }
	}
	/*
		Reminder - if current history state was not created in this window (ie. the "initial state"), then reading it will return null or raise error in some browsers.
	*/


	function historyStateIsReadableAndHasKey(key) {
	  try {
	    return key in history.state;
	  } catch (e) {
	    return false;
	  }
	}
	/*
		Patch pushState so that it always increments history depth and session depth.

		This allows us to keep track of history depth, even if the document in the modal window is using pushState.

		We do require, however, that you always push a "simple object" (ie. something that serializes to a json dictionary) as the state object, so that we can attach our own data to it.

		TODO - verify that this works
	*/


	function patchPushState() {
	  var _pushState = history.pushState.bind(history);

	  history.pushState = function (data, title, url) {
	    if (!data || JSON.stringify(data)[0] != '{') {
	      throw new Error('Pages inside a modal window may use history.pushState, but they must pass a "simple object" (NOT Array, String, Number, null, etc.) as the state object');
	    }

	    var newDepth = history.state[depthKey] + 1;
	    sessionStorage[depthKey] = newDepth;
	    data[depthKey] = newDepth;

	    _pushState(data, title, url);
	  };
	} // Make sure this is actually a modal child before we do anything


	if (isModalChild()) {
	  console.debug('initializing modal child');
	  /*
	  	We need per-window storage on both the history state entry and in sessionStorage.
	  		For same-domain iframes, these are shared between iframe and parent window (in some browsers, at least). We need a persistent, unique key to identify this window. We use window name for that key.
	  */

	  window.name = window.name || 'openModalWindow' + Date.now();
	  depthKey = window.name + 'historyDepth';

	  if (!(depthKey in sessionStorage)) {
	    /*
	    	The modal window has just been opened.
	    	We are in the "initial state".
	    	Push a new state, so that we detect history.back().
	    	If we ever get back to the "initial state", we'll close this modal window.
	    */
	    history.pushState(_defineProperty({}, depthKey, 1), '', location.href);
	    sessionStorage[depthKey] = 1;
	  } else if (historyStateIsReadableAndHasKey(depthKey)) {
	    // This page was reloaded from back/forward
	    sessionStorage[depthKey] = history.state[depthKey];
	  } else if (didNavigateForward()) {
	    var newDepth = parseInt(sessionStorage[depthKey]) + 1;
	    sessionStorage[depthKey] = newDepth;
	    var s = history.state || {};
	    s[depthKey] = newDepth;
	    history.replaceState(s, '', location.href);
	  } else {
	    // User navigated back to initial state (and that navigation involved actual page navigation, not just states created with pushState)
	    exit();
	  }

	  patchPushState();
	  addEventListener('popstate', function () {
	    console.debug("popped state in child ".concat(location.href));

	    if (!historyStateIsReadableAndHasKey(depthKey)) {
	      exit();
	      return;
	    }
	    /*
	    	IE hack
	    	IE _sometimes_ lies to us about what state we're in, when we've gone back to the initial state.
	    		If we get a popstate event and history.state[depthKey] hasn't changed, assume we're in the initial state and IE is lying to us.
	    		ONLY do this for IE 11. Some browsers (Safari) fire popstate events at initial page load (when reloading from history), and in that case history.state[depthKey] WILL equal lastDepth.
	    */


	    if (navigator.userAgent.indexOf("Trident/7.0") > -1 && history.state[depthKey] == sessionStorage[depthKey]) {
	      exit();
	      return;
	    }

	    sessionStorage[depthKey] = history.state[depthKey];
	  });
	  prepareChildDocument();
	}

	// Element.closest polyfill, courtesy of MDN
	if (!Element.prototype.matches) {
	  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}

	if (!Element.prototype.closest) {
	  Element.prototype.closest = function (s) {
	    var el = this;

	    do {
	      if (Element.prototype.matches.call(el, s)) return el;
	      el = el.parentElement || el.parentNode;
	    } while (el !== null && el.nodeType === 1);

	    return null;
	  };
	}

	document.addEventListener('click', function (e) {
	  var link = e.target.closest('a[target=_modal]');
	  if (!link) return;
	  if (e.ctrlKey || e.shiftKey || e.metaKey) return;
	  if (e.defaultPrevented) return;
	  e.preventDefault();
	  openModal(link.href);
	});

}());
//# sourceMappingURL=openModal.js.map
