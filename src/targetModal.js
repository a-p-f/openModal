// Element.closest polyfill, courtesy of MDN
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;

    do {
      if (Element.prototype.matches.call(el, s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

document.addEventListener('click', function(e) {
  const link = e.target.closest('a[target=_modal]');
  if (!link) return
  if (e.ctrlKey || e.shiftKey || e.metaKey) return
  if (e.defaultPrevented) return
  e.preventDefault();
  openModal(link.href);
});