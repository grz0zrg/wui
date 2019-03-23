# WUI #

Collection of **easy to use**, **independent** and **lightweight** (*~5.6kb css*, *~15.6kb js* gzipped) **vanilla** GUI widgets for the web.

**Require no dependencies, all widgets can be used on their own.**

There is a dark and a bright theme, the **dark theme is the default theme** and is more polished than the bright one.

The main advantages compared to other libraries are:

* Widgets can be used on their own (no dependencies)
* Input and Slider widgets can be MIDI controlled with two mode (absolute, relative) and can be user-configurable
* Dialogs can be detached (and everything related to WUI will still work)
* Circular menu aka [pie menu](https://en.wikipedia.org/wiki/Pie_menu) aka radial menu :)
* Quick forms creation with standard HTML5 forms elements and WUI elements (WIP/Experimental)
* Events are optimized (meaning that there is few listeners for each widgets)
* Easily customizable/hackable
* Lightweight
* ...

Great for single page apps (audio apps, games etc.), experiments and the like.

#### Demo
- [Demo](http://grz0zrg.github.io/wui-demo/)
- [Demo repository](https://github.com/grz0zrg/wui-demo)

#### Links
- [Documentation](#doc)
- [Compatibility](#compat)
- [License](#license)

<a name="doc"></a>
# Documentation #

##### Usage

There is a minified and gzipped up to date ready-to-use js file in the **_dist_** folder, to use the entire library, just include it in your HTML file

There is also a minified and gzipped up to date ready-to-use css file for each themes in the **_dist/[theme_name]_** folder, to use it, just include it in your HTML file

```html
<link rel="stylesheet" type="text/css" href="wui.min.css"/>
<script type="text/javascript" src="wui.min.js"></script>
```

If you need a single (or more) widget, you can find minified files of each widget in the **_dist/widgets_** folder

#### Building with [Node](https://nodejs.org/) and [Grunt](http://gruntjs.com/)


```
npm install
grunt dist
```

### Introduction


*   [WUI](#wui_main)
*   [WUI_Tabs](#tabs)
*   [WUI_Dialog](#dialog)
*   [WUI_DropDown](#dropdown)
*   [WUI_ToolBar](#toolbar)
*   [WUI_Form](#form)
*   [WUI_Input](#input)
*   [WUI_RangeSlider](#rangeslider)
*   [WUI_CircularMenu](#circularmenu)

The WUI API is simple, all widgets have a method **_"create"_** which accept a DOM element (which should contain an identifier) or a DOM element identifier as first argument which is used as a bind target and an option object as a second argument to customize it, WUI_ToolBar, WUI_Form and WUI_DropDown has a third argument which is used to specify the items.

All **_"create"_** methods return a reference of the widget which can be used later to do stuff with the widget like destroying them, the reference is a string (it is the dialog element id).

All widgets also have a method **_"destroy"_**.

WUI_RangeSlider widget have a method **_"getParameters"_** and **_"setParameters" which can be used to save/retrieve the widget parameters.

HTML elements with a specific layout are required to use some widgets (like tabs, see the documentation)

A bit of style hacking may be necessary if you want widgets to suit your need or your taste, you can build themes easily with bits of CSS, the demo page can be helpful.

### Hacking


WUI is itself a big hack so hacking it is just the right way to use it! :)

Extending widgets to suit your needs or taste is very easy, widgets code are separated into three sections, **_private fields_**, **_private functions_** and **_public functions_**.

If you want to add an option to a widget, you add a field into the **_known_options** object in the **_private fields_** section, this is where all the options known by the widget are stored with their default value, the option behavior can then be implemented in the **_create_** function (or used later since it is also stored in the widget specific storage), you access to the option value in the **_create_** function by using the local **_opts_** object.

If you want to add/change advanced behaviors, you can create or modify private or public functions, the object **_widget_list** which is available in the scope of most widgets serve as a generic storage for all widgets, all created widgets are stored here with their ID as key (**_widget_list["my_widget_id"]** to access to a specific widget storage), there is at least an **_opts_** field for each widgets which can be used to retrieve/override the widget options.

Themes are done by cloning existing `.css` files and modifying them, to do it properly you can clone a theme `wui/css/themes/[theme_name] folder`, rename it, add the corresponding build line into Gruntfile.js (see **_files_** object), build and your minified/gzipped theme will be available in the **_dist_** folder.

### Reporting

By default, console.log reporting is disabled, to turn it on introduce the global variable `WUI_Reporting` this will enable output to the console which may be useful to lookup issues.

```javascript
window.WUI_Reporting = true;
```

<a name="wui_main"></a>

### WUI ###


Not really a widget but a collection of tools, can be helpful if you want to add draggable/resizable functionality to an element or apply fade in/out.

Fade in/Fade out method default to 500ms if no duration is provided

*Methods*:

>*   draggable(element, on_drag_cb, virtual, target_element)
>*   undraggable(element)
>*   lockDraggable(element, axis)
>*   fadeIn(element, duration_ms)
>*   fadeOut(element, duration_ms, fade_finish_cb, hide_when_fade_finish)

*Example*:

```javascript
// make the element draggable
// a callback for the second argument can be specified to gather the new position, like: function (element, x, y) {  }
// third argument is optional, is a boolean and can be true to make the draggable functionality "virtual" which mean it will NOT modify the element position but still call the callback, it is left to the user to do any appropriate changes, this may be useful to add resizable functionality easily by using it with "lockDraggable", this default to false if not specified
// fourth argument is optional and is used to bind multiple draggable hooks to control a specific DOM target
// Note: If you want to remove the element while it is draggable, make it undraggable first by calling the appropriate function (undraggable), this is because WUI keep an internal reference of the element and it may cause memory leaks later, calling undraggable will make the reference go away
WUI.draggable(my_element, function (element, x, y) {  }, false, target_element);

// make a WUI draggable element undraggable and remove the internal reference
WUI.undraggable(my_element);

// lock draggable element to a specific axis ('x' or 'y', to clear the lock, just call it without specifying axis or specify whatever)
WUI.lockDraggable(my_element, 'x');

// apply a 500ms fade in effect to an element
WUI.fadeIn(my_element, 500);

// apply a 500ms fade out effect to an element, when finished output "finished" to the browser console and hide the element (display: none)
WUI.fadeOut(my_element, 500, function () { console.log("finished!"); }, true);
```



<a name="tabs"></a>
### Tabs ###


*Methods*:

>*   create(id, options)
>*   destroy(wui_tabs)
>*   getContentElement(wui_tabs, tab_index)
>*   getTabName(wui_tabs, tab_index)

*Example*:

```html
<div id="my_tabs">
	<div>
		<!-- a list of tabs name -->
		<div>Tab 1</div>
        <div>Tab 2</div>
	</div>

	<div>
		<!-- a list of tabs content -->
	    <div>
			Tab 1 content
	    </div>

	    <div>
	        Tab 2 content
	    </div>
	</div>
</div>
```

```javascript
WUI_Tabs.create("my_tabs", {
	// function called when a tab is clicked (tab index will be passed as argument)
	on_tab_click: tab_clicked,

    // style value for the content height
    height: "calc(100% - 32px)" // this is the default value
});
```



<a name="dialog"></a>
### Dialog/Panel ###


Dialogs can be draggable, closable, minimizable, resizable, detachable, modal and act as panels, they also go in front of others when you move them.

One of the coolest and rather unique feature of the dialog widget is the ability to be detached from the window it is on and act as a proper window without breaking the content (including events), this may be very useful, the user can detach any dialogs and move them on other screens etc.

All WUI widgets work very well with the detachable feature, what you change in the detachable dialog will be changed in the 'original' dialog, this should be the same dialog after all, for example, if you toggle a WUI_ToolBar button in the detached dialog and close it, when you open the dialog again (detached or not) the button will be toggled, the only thing which is not synced is the size of the detached dialog and its position.


>**Notes**:
>
>On iPad, the detach feature will work but Safari will open the dialog as a new tab.
>
>
>The detach feature keep track of events by overriding `addEventListener`, it will only keep track of  events that are added on an element inside the dialog which mean that the calls to `addEventListener` must be made after the element is attached to a node inside the dialog, in order to work correctly the WUI_Dialog/WUI library should be loaded before you or other libs add events.
>
>
>When a dialog is detached, it will add back event listeners added with `addEventListener` only (and also inline events), if you attach events to elements in the dialog content using `elem.onclick` etc, the event will not be added back, also since the dialog content will be in another window/document, events attached to the initial window or document and acting on the dialog content will not work, because the dialog is now in another window, you will have to take care of attaching to/using `element.ownerDocument` or `element.parentWindow` instead of `document` or `window`.
>
>
>Dialogs `zIndex` is between 100 and 101.

*Methods*:

>*   create(id, options)
>*   destroy(wui_dialog)
>*   open(wui_dialog, detach)
>*   close(wui_dialog, propagate)
>*   closeAll(propagate)
>*   focus(wui_dialog)
>*   setStatusBarContent(wui_dialog, html_content)
>*   setTitle(wui_dialog, html_content)
>*   getTitle(wui_dialog)
>*   getDetachedDialog(wui_dialog)

*Example*:

```html
<div id="my_dialog">
	<div>
		the dialog content
	</div>
</div>
```

```javascript
var my_dialog = WUI_Dialog.create("my_dialog", {
	title: "dialog title",

    width: "20%",
    height: "50%",

    // 'left', 'center', 'right', default to 'left'
    halign: "left",
    // 'top', 'center', 'bottom', default to 'top'
    valign: "center",

    // wether the dialog is opened or not after creation
    open: true,

    // wether the dialog is minimized or not after creation
    minimized: false,
    
    // function called when the dialog has been opened
    on_open: null,

    // function called when the dialog has been closed
    on_close: null,

    // function called before the dialog is detached
    on_pre_detach: function () {

    },

    // function called when the dialog is detached, the new `window` object is passed as argument
    on_detach: function (new_window) {
        // you can modify the detachable window there, example:
        new_window.document.title = "My detached window"; // replace the detached dialog title
    },

    // function called when the dialog is resized, `new_width` and `new_height` is the new dimension of the dialog content
    on_resize: function (new_width, new_height) {

    },

    // you can add header buttons easily by using this (such as a help "?" button)
    header_btn: [
        {
            title: "Help",
            on_click: function () {
                // code called when the header button is clicked, redirecting to a documentation for example
            },
            class_name: "" // class name to use (you will generally need it if you want to show an icon like "?", use the background-image property to do so)
        }
    ],

    modal: false,

    // wether the dialog have a status bar
    status_bar: true,

    // HTML content of the status bar
    status_bar_content: "status bar content",

    closable: false,
    draggable: true,
    minimizable: true,

    resizable: true,

    detachable: true,

    // the minimun width/height the dialog can be when resized (min_width accept a value or "title")
    min_width: "title",
    min_height: 64,

    // option to keep the align when resized, example: if the dialog is centered in the window, the dialog will always be in center when it is resized
    keep_align_when_resized: true,

    // can be used to position the dialog, default to 0
    top: 0,
    left: 0
});
```

Closed and want to open it again?

```javascript
// second argument is optional (default to false) and tell wether the dialog is opened in its own window
WUI_Dialog.open(my_dialog, false);
```


Open and want to close it programmatically?

```javascript
WUI_Dialog.close(my_dialog, true); // last argument is optional (default to false) mean the on_close function will be called
```


Focusing a specific dialog

```javascript
WUI_Dialog.focus(my_dialog);
```


Want to change the status bar content?

```javascript
WUI_Dialog.setStatusBarContent(my_dialog, "My new status bar content");
```

Want to change the title bar content ?

```javascript
WUI_Dialog.setTitle(my_dialog, "My new title");
```

Need access to the detached dialog window object?

```javascript
var detached_dialog_window = WUI_Dialog.getDetachedDialog(my_dialog);
```


<a name="dropdown"></a>
### DropDown ###


>A simple and automatically opening/closing dropdown.

*Method*:

>*   create(id, options, entry_name_array)
>*   destroy(wui_dropdown)

*Example*:

```html
<div id="my_dropdown"></div>
```

```javascript
WUI_DropDown.create("my_dropdown", {
		width: "100px",
	    height: "24px",

	    // the space between the floating list of items and the dropdown "button"
	    vspacing: 4,

	    // time before the floating list close
	    ms_before_hiding: 1000,

	    // default item (id) to be selected after creation
	    selected_id: 0,

	    vertical: false,

	    // function called when an item is selected, the item index is passed as argument
	    on_item_selected: item_selected
    },
    // a list of items
    ["First item", "Second item", "Third item"]
);
```

<a name="toolbar"></a>
### ToolBar ###


The toolbar can be horizontal or vertical, have groups and minimizable groups, have three type of buttons, simple, toggle and dropdown (useful to make menu bar), a set of toggle buttons can be linked (grouped), buttons can be an icon, a text or both.

*Method*:

>*   create(id, options, tools)
>*   destroy(wui_toolbar)
>*   hideGroup(wui_toolbar, group_index)
>*   showGroup(wui_toolbar, group_index)
>*   toggle(wui_toolbar, tool_id, propagate)
>*   getItemElement(wui_toolbar, tool_id)

*Example*:

```html
<div id="my_toolbar"></div>
```

```javascript
var my_toolbar = WUI_ToolBar.create("my_toolbar", {
    // display the minimize icon for each groups
    allow_groups_minimize: true,
    
    // show groups title (key) below or above the toolbar buttons (also work with vertical toolbar)
    show_groups_title: false,
    
    // groups title orientation (either "s"/bottom or "n"/top)
    groups_title_orientation: "s",

    // this will modify the size of the button
    item_width: 32,
    item_height: 32,

    // this set the spacing between buttons, aka margin to left/right or top/bottom
    item_hmargin: 0,
    item_vmargin: 0,

    icon_width: 32,
    icon_height: 32,

    vertical: false
  },
  {  
	// properties added to this object are recognized automatically as new groups by the widget
    my_first_group_of_tools: [
      {
        // id attribute
        id: "my_pencil_tool",

        // CSS class name
        icon: "pencil-icon",

        // CSS class name when toggled, default to the value of icon if not present
        toggled_icon: "pencil-icon",

        // button text
        text: "",

        // can be "toggle", "dropdown" or nothing for a simple button
        type: "toggle",

        // a toggling group id, another button with the same toggling group id will be linked to this one and will be off when this one will be switched on
        toggle_group: 0,

        // toggle state of the button after creation, only if it is a toggle button
        toggle_state: true,

        // function called when a button is clicked, if the item is of type "toggle", an object containing a field "id" (id of the toolbar tool), "type" (will contain "toggle") and "state" (0 or 1) will be passed as argument
        on_click: toolbar_item_toggle,

        // function called when a button is right clicked, valable for all items
        on_rclick: null,

        // tooltip
        tooltip: "Toggle me!",

        // tooltip when toggled, default to the value of tooltip if not present
        tooltip_toggled: "Toggle me!"
      }
    ],

    my_second_group_of_tools:    [
      { icon: "undo-icon", on_click: toolbar_item_click, tooltip: "Click me!" },
      { icon: "redo-icon", on_click: toolbar_item_click, tooltip: "Click me!" }
    ],

    // a typical menu with a list of clickable items
    my_menu: [
      {
        text: "File",
        on_click: toolbar_item_click,
        tooltip: "Click me!",
        type: "dropdown",

        // define where the list of items will appear around the item when it will be opened
        // can be "s", "sw", "se", "nw", "ne", anything else will default to "n" (north)
        orientation: "n",

        // define the width of the list items
        // can be a CSS width (auto, 64px etc) or "tb_item" so the list items have the same width as the toolbar item button
        dropdown_items_width: "tb_item",

        // items of the dropdown are defined here
        items: [
          {
            title: "New",

            // function called when the item is clicked
            on_click: my_new_file
          },

          {
            title: "Open",

            // function called when the item is clicked
            on_click: my_open_file
          }
        ]
      }
    ]
  });
```

You can toggle a specific button programmatically with:

```javascript
WUI_ToolBar.toggle(my_toolbar, 0, true); // the last argument is optional and mean that the toggle event will call the onClick function
```


You can integrate [Font Awesome](http://fontawesome.io/) easily with the CSS icon class name attribute, for example for a CSS icon class named `app-home-icon`:

```css
.wui-toolbar-item.app-home-icon:before {
    font-size: 24px; /*you may need to change that*/
    content: "\f015";
    font-family: FontAwesome;
    margin-left: 4px; /*you may need to change that if font-size change*/
    margin-top: 4px;
    position: absolute;
}
```

If you find this too cumbersome to setup, you can render Font Awesome icons to images with this tool: [fa2png](http://fa2png.io/)

<a name="form"></a>
### Form ###

The form widget is a powerful feature allowing to design complete 'settings' panel and things requiring form elements with coherent styling, quickly, easily with integration of some high level functionalities (such as hide/show items group), it accept standard HTML5 form elements and WUI_Input, WUI_RangeSlider, WUI_DropDown.

The form widget has two important methods `getParameters` and `setParameters` which allow to respectively serialize and deserialize entire forms data (and subsequently trigger `change` event if needed) as JSON, **a form item must have an unique name to be serializable**.

See the demo page for a detailed example of configuration options.

Note : Work in progress / experimental feature; may be broken

*Methods*:

>* create(id, options, items)
>* destroy(wui_form)
>* getParameters(wui_form)
>* setParameters(wui_form, parameters, trigger_on_change_boolean)

*Example*:

```html
<div id="my_form"></div>
<!--
	You can also use <form id="my_form"></form> for standard HTML forms
-->
```

```javascript
WUI_Form.create("my_form", {
	width: "auto"
}, 
{
	// properties added to this object are recognized automatically as new FIELDSET by the widget, the property name is used for the fieldset legend
	"Form : First group": [
		// list of form items
		{
			// a WUI_DropDown
			type: "WUI_DropDown",
			// WUI_DropDown options
			opts: {
				width: "100px",
				vspacing: 4,
				ms_before_hiding: 1000,
				selected_id: 0,
				vertical: false,
				on_item_selected: function () {}
			},
			// WUI_DropDown items
			items: ["First item", "Second item", "Third item"]
		},
		{
			// a standard <select> with legend
			type: "select",
            label: "My choice",
            wrap: true, // wrap it in a div (for line-break)
            attr: {
            	// you can put any DOM attributes here to apply customizations
        	},
        	value: "",
        	
        	// specific datalist/select attributes
        	options: [
                {
        			// required attributes
					name: "option1",
        			// optional attributes
        			disabled: false,
        			selected: false,
        			value: "option1",
        
                    attr: {
                        // you can put any DOM attributes here to apply customizations to the <option> element
                    }
                },
                {
					name: "option2"
                },
        		"option3" // also work (but not customizable)
    		]
		}
	]
});
```

<a name="input"></a>
### Input ###


WUI does not support an input widget out of the box but there is a shortcut "WUI_Input" which is just a RangeSlider in disguise, you must set the "bar" option to false and you get an input and it share the same properties like MIDI support and so on, see RangeSlider widget for options and methods.

<a name="rangeslider"></a>
### RangeSlider ###


Range slider widget can be horizontal or vertical, can be user configurable (step, min, max etc options can be set by the user as he want it), have a negative/positive range, the value can be changed with the mouse wheel, by moving the hook point by dragging, by a MIDI controller or by clicking on the slider bar, a double click on the slider will reset the value to its default value, the value also appear as an input which perform automatically all sanity check and will indicate if the value is correct or not (red)

One of the coolest (and maybe 'unique') feature of the WUI slider widget is the ability to be controlled entirely from MIDI controllers with absolute and relative mode, it is as easy as calling a function when a MIDIMessage is received and all MIDI enabled sliders will be usable with any MIDI interfaces.

To assign a MIDI controller, the widget implement a sort of MIDI learn function, you click on a square on MIDI enabled sliders and, when a MIDI data is received, the controller is automatically assigned to that widget and you can start to control it from your MIDI interface...

The "rel" MIDI mode allow infinite values, it work well with "endless" rotary controls (also called encoders).
The "abs" MIDI mode is based on the "min" and "max" property, it act as a percentage of the range, if you want to match MIDI spec, just assign "0" and "127" for "min" and "max" option.

Only MIDI input is supported at the moment but it should not be hard to add MIDI output later on.

*Method*:

>*   create(id, options)
>*   destroy(wui_rangeslider)
>*   getParameters(wui_rangeslider)
>*   setParameters(wui_rangeslider, parameters, trigger_on_change_boolean)
>*   setValue(wui_rangeslider, value, trigger_on_change_boolean)
>*   submitMIDIMessage(midi_event)

*Example*:

```html
<div id="my_range_slider"></div>
```

```javascript
WUI_RangeSlider.create("my_range_slider", {
    // width/height of the slider, if you make a vertical slider, you should swap theses values
    width: 300,
    height: 8,

    // the value range, -100 <-> 100, optional
    min: -100,
    max: 100,

    // standard increment when dragging NOTE : can be "any" if you need to accept both decimals and integers for the validation ("step" is just the bare "step" input attribute value actually!)
    step: 1,

    // on mouse wheel increment
    scroll_step: 2,

    vertical: false,

    // max number of decimals to display for decimal values (default to 4)
    decimals: 4,

    // the widget default value (used for "reset to default" behaviors)
    default_value: 0,

    // the widget current value
    value: 0.5,

    // this will place the title on top and the value at the bottom, good for vertical sliders
    title_on_top: true,

    title: "my range slider",

    // enable the slider to be controllable by MIDI
    // can be a boolean (or anything) if you do not need to configure it, otherwise an object with a fiel "type" with value "rel" or "abs", by default the control type is set to "abs"
    midi: false,

    // used to line up multiple sliders perfectly
    title_min_width: 150,
    value_min_width: 48,

    // allow the user to configure the parameters of the slider, a settings button will appear around the slider and when it is clicked, a box with input fields will allow the user to change range and step values
    // this can be usefull if an "unlimited" slider is needed or simply to allow the step to be changed by the user
    // Note: if you want a few parameters to be configurable, just remove those you don't want in that object
    configurable: {
    	// this allow the "min" parameter of the slider to be configurable
    	// "min" and "max" is the allowed range of the created input field, it is used to set some boundaries to what range of values the user can set
    	// it is also possible to leave the object empty (like "max" below) to allow unlimited sliders (any values for min/max will be then allowed, allowing the user to extend the range as he like)
    	min: { min: -100, max: 100 },
    	max: { },
    	step: { min: 0.1, max: 2 },
    	scroll_step: { max: 5 }
    },

    // function to call when the slider value change with the value passed as argument
    on_change: slider_change
  });
```


MIDI usage example :

```javascript
// setup Web MIDI so we can control the MIDI enabled sliders with any connected MIDI controllers
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(
            function (m) {
                m.inputs.forEach(
                    function (midi_input) {
                        midi_input.onmidimessage = function (midi_message) {
                            WUI_RangeSlider.submitMIDIMessage(midi_message);
                        };
                    }
                );
        });
}
```



Set value programmaticaly (last argument is optional and can be used to trigger the change function by setting it to true) :

```javascript
WUI_RangeSlider.setValue(my_slider, my_value, trigger_on_change);
```



Export the widget parameters :

```javascript
var parameters = WUI_RangeSlider.getParameters(my_slider);
// parameters contain opts (containing all options fields), endless, midi and value field
```



Import parameters (last argument is optional and can be used to trigger the change function by setting it to true) :

```javascript
WUI_RangeSlider.setParameters(my_slider, parameters);
```



<a name="circularmenu"></a>
### CircularMenu ###


Show a menu with items arranged in a circle/ellipse.

This widget `create` function does not return anything and the widget do not have a destroy method, it is automatically destroyed by the library, thus you need to call `create` each time you want it to appear somewhere.

The menu can be shown around an element or a position, if an element is specified in the options, `x y` properties will be ignored, `x y` or `element` need to be set in order to use this widget, all other properties are optional.

You can use the "angle" option (degree) to offset the items position by an amount.

Items are simple round buttons with or without HTML content, an icon class name can be specified, a tooltip and a callback.

*Method*:

>*   create(options, items)

*Example*:

```javascript
WUI_CircularMenu.create({
    x: 64,
    y: 64,

    element: null, // if an element is specified, the menu will be shown around it

    angle: 90, // offset the items positions by 90°

    // radius
    rx: 64,
    ry: 64,

    // dimension of the items
    item_width:  32,
    item_height: 32,

    // if you want to display the widget at a position x, y in another window, you may need to specify the target window here
    window: null
  },
  [
    { content: "<strong>1</strong>", tooltip: "first button with textual (HTML) content",  on_click: function () { } },
    { icon: "css-icon-class", tooltip: "second button", on_click: function () { } },
    { icon: "css-icon-class", tooltip: "third button",  on_click: function () { } },
    { icon: "css-icon-class", tooltip: "fourth button", on_click: function () { } },
  ]);
```


<a name="compat"></a>
# Compatibility #


Not well tested but should work in all modern browsers supporting **_ECMAScript 5_** and **_CSS3_**.

It was not built to target mobile devices, but it still support touch events and should work well on iPad and the like.

Tested and work ok with IE 11, Opera 12, Chrome (30, 35, 40, 53), Firefox (31, 37, 49) and Safari (6, 7, 8).

Mostly work (problems with the ToolBar and Dialog) under IE 10 but i do not support it.

The Web MIDI API should be supported by the browser if you want to use the MIDI features.

<a name="license"></a>
# License #


[Revised BSD](https://github.com/grz0zrg/wui/blob/master/LICENSE)

This was made for an [audio app.](https://github.com/grz0zrg/fsynth) and the UI of a wargame engine.
