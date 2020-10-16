/*
    If you accidentally include openModal twice on your page, bad things happen.

    Event listeners will get added multiple times, and you'll end up going back() too far when calling closeModal.

    Without this check, that condition would actually be rather difficult to diagnose/fix.

    Note that the effects of this module CANNOT be tested when running the source (module) code in your browser. Browsers never load the same module twice. It's only the bundled code that can be executed multiple times, so you must test the bundled code to verify the functioning of this module.
*/
if (window.openModal) {
 throw new Error(`window.openModal is already defined. Refusing to setup a second time. Are you loading openModal twice? This is not recommended.`);
}