let width, height, overflowX, overflowY;
export function lockScroll() {
	const de = document.documentElement;
	const ds = de.style;
	const bs = document.body.style;	

	// Save style values so we can restore
	overflowX = bs.overflowX;
	overflowY = bs.overflowY;
	width = ds.width;
	height = ds.height;

	/*
		Lock document dimensions.
		In some browsers/configurations, toggling overflow will cause scrollbars to hide.
		Lock dimensions so that the document doesn't reflow.
	*/
	ds.width = de.clientWidth + 'px';
	ds.height = de.clientHeight + 'px';

	// Now lock scrolling
	bs.overflowX = 'hidden';
	bs.overflowY = 'hidden';
}
export function releaseScroll() {
	const ds = document.documentElement.style;
	const bs = document.body.style;

	bs.overflowY = overflowY;
	bs.overflowX = overflowX;

	ds.width = width;
	ds.height = height;
}