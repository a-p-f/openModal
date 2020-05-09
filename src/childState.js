function key() {
	return window.name+'openModalChild';
}
export function getChildState() {
	const s = history.state || {};
	return s[key()];
}
export function pushChildState(data) {
	const s = history.state || {};
	s[key()] = data;

	history.pushState(s, '', location.href);
}