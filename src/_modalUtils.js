export function easyExit(visibleElement=document.body) {
	addEventListener('click', function(e) {
		if (!visibleElement.contains(e.target)) closeModal();
	});
	addEventListener('keydown', function(e) {
		if (e.key == 'Escape') closeModal();
	});
}