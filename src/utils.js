/*
	IE throws error if you try to access history.state from the first history entry of a given tab/window.
*/
export function safeGetState() {
	try {
		return history.state
	} catch(e) {
		console.debug('could not access state')
		return null
	}
}