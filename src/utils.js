/*
	IE throws error if you try to access history.state from the first history entry of a given tab/window.

	Note - it also throws an error if you tried to read the state from one window, when it was last updated in another (ie. pushState in parent, then try to read in iframe). In this case, returning null is NOT appropriate/correct - we're throwing out any information that was actually on the state object. We must be careful in our app to NEVER try and read history state when it was last updated by parent/child. 
*/
export function safeGetState() {
	try {
		return history.state
	} catch(e) {
		return null
	}
}