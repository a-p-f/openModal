# openModal

- Accessible
- Nestable
- Customizable
- Dead Simple API

Think of `openModal(url)` as an alternative to `window.open(url)`. Instead of opening a new tab or pop-up window, it opens a "modal window" over top of your existing page. 

[demo/docs/test suite](http://openmodal.surge.sh/demo/)


TODO - protect against loading openModal twice (maybe just console.error?)
If you load script twice, bad things happen, and it's hard to catch (you end up going back twice)