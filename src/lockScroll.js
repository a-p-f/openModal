/*
We use 2 different modes of scroll locking, depending on browser configuration.

If the browser uses "only visible while scrolling" scroll bars (newer browsers), then we simply set overflow: hidden on body. This is most efficient.

If the browser has "always visible" scroll bars (which take up space in viewport), then the above technique can cause jarring reflows as scroll bars hide/show. So we use a scroll event listener, instead.

TODO:
see if we can just set maxHeight/maxWidth on documentElement (read current size), in combination with overflow: hidden. 
*/

const de = document.documentElement;
let lockedScrollTop, lockedScrollLeft, overflowX, overflowY;
function fixScroll() {
	de.scrollTop = lockedScrollTop;
	de.scrollLeft = lockedScrollLeft;
}
function hasSpaceTakingScrollBars() {
	return de.clientWidth < window.innerWidth || de.clientHeight < window.innerHeight;
}
export function lockScroll() {
	const bs = document.body.style;	
	lockedScrollTop = de.scrollTop;
	lockedScrollLeft = de.scrollLeft;
	overflowX = bs.overflowX;
	overflowY = bs.overflowY;

	if (hasSpaceTakingScrollBars) {
		addEventListener('scroll', fixScroll);
	}
	else {
		bs.overflowX = 'hidden';
		bs.overflowY = 'hidden';
	}
}
export function releaseScroll() {
	removeEventListener('scroll', fixScroll);
	const bs = document.body.style;
	bs.overflowX = overflowX;
	bs.overflowY = overflowY;
}