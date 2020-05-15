Simple CSS - a "seed" project creating/maintaining your site stylesheet, using SASS.

This project aims to provide:
    - good/sensible default styles
    - a few "component" classes
    - a few "theme" classes
    - a flexible layout framework for your overall site-layout

We intend you to use the project as a "seed". Copy this entire directory to
your project, then edit as you see fit. To copy:
    git clone --depth 1 vcs:/vcs/git/web_utils/simple_css
    rm -rf simple_css/.git/

Writing your html:
    You should not add a bunch of random classes in your markup to achieve
    the look you want. We recommend the following approach (as much as possible):
        - leverage appropriate semantic elements as much as possible
        - use "component" classes when you need a new "type" of element
            - these are defined in _component_classes.scss
            - add as many new components as needed
            - any element should have at most one component class
        - use in-line styles for any one-off styling
        - use "theme classes" for one-off styling that needs to reference "theme variables"
            - these are defined in _theme_classes.scss

SASS usage:
    This project uses the CSS precompiler SASS (using the scss syntax).
    https://sass-lang.com/

    To compile this stylesheet, install sass on your machine (https://sass-lang.com/install),
    and then run:
        sass --watch --style=compressed .:.

    If you have sass available on your PATH, you can also run:
        . compile_styles
    as a shortcut (which also watches files for changes)

    If you want a more advanced "build system" (ie. to add autoprefixer),
    or you also want to build your js, then you should look into
    vcs:/vcs/git/web_utils/web_compiler
    as a starting point (requires node/npm on your dev server)

Splitting up stylesheets:
    You can easily generate multiple stylesheets (ie. per-page stylesheets, print stylesheets).
    Just define another scss file in this folder (without leading _), and it will be compiled
    when you run compile_styles.

Demo pages:
    a number of demo pages are included in demos/

Note on input/button styles:
    These styles are pretty basic, but have some useful properties:
        - text inputs, buttons, and select elements all have exactly the same height, and line up properly on a line
        - select inputs look exactly the same in different browsers
        - you can easily change border radius, color, font, background color of inputs/buttons without breaking their styles
        - button/input heights are set using border-box, so you can easily turn the border off and add a background color, and button height remains constant

    Shortcoming:
        vertical alignment of checkboxes and radios next to labels still isn't perfect
        There isn't much we can do about that - I even tried doing something similar to
        select inputs (set appearance to none, render a border manually, mess with backgound),
        but I still couldn't get them to line up nicely and consistent across browsers.

        For now, I recommend setting:
            display: flex; align-items: center;
        On the label or other element wrapping the checkbox/radio
        (you can use .checkbox-label to apply this, if using utilities.css)
        Note - this still doesn't work perfectly (browsers seem to render checkboxes/radios outside of their own bounding boxes), but it's a little better
    
    Note - these styles DO NOT remove focus outlines on buttons and button type inputs.
    That should be done in js, and ONLY when the user focuses a control via clicking
    (use no_click_focus.js to do just that).