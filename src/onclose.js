let callback, value;
export function setCallback(_callback) {
	value = undefined;
	callback = _callback;
}
export function setValue(_value) {
	value = _value;
}
export function run() {
	callback(value);
}