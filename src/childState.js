import {safeGetState} from './utils.js';

function key() {
	return window.name+'openModalChild';
}
export function getChildState() {
	const s = safeGetState() || {};
	return s[key()];
}
export function pushChildState(data) {
	const s = safeGetState() || {};
	s[key()] = data;

	history.pushState(s, '', location.href);
}