(function () {
	'use strict';

	function easyExit() {
	  var visibleElement = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;
	  addEventListener('click', function (e) {
	    if (!visibleElement.contains(e.target)) closeModal();
	  });
	  addEventListener('keydown', function (e) {
	    if (e.key == 'Escape') closeModal();
	  });
	}

	var modalUtils = /*#__PURE__*/Object.freeze({
		__proto__: null,
		easyExit: easyExit
	});

	window.modalUtils = modalUtils;

}());
