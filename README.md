WUI
=====

Collection of **easy to use** and **lightweight** (*~4.0kb css*, *~7.9kb js* gzipped) vanilla GUI widgets for the web.

*Require no dependencies, all widgets can be used on their own.*

It was not built to target mobile devices but it support touch events and the demo work ok with Safari on the IPad.

Good for single page apps, experiments and the like. (caution: for serious usage it is usable but *may* be tricky)

####Demo
- [Demo](http://grz0zrg.github.io/wui-demo/)
<br/>
- [Demo repository](https://github.com/grz0zrg/wui-demo)

####Links
- [Documentation](#doc)
- [Compatibility](#compat)
- [License](#license)

<a name="doc"></a>
# Documentation #

####Usage

There is minified and gzipped, up to date ready-to-use css/js files in the **_dist_** folder, to use the entire library, just include them in your HTML file

```html
<link rel="stylesheet" type="text/css" href="wui.min.css"/>
<script type="text/javascript" src="wui.min.js"></script>
```
<br/>
If you need a single (or more) widget but not all, you can find minified files of each widget in the **_dist/widgets_** folder

======

####Building with [Node](https://nodejs.org/) and [Grunt](http://gruntjs.com/)

```
npm install
grunt dist
```

======

####Introduction

*   [WUI](#wui)
*   [WUI_Tabs](#tabs)
*   [WUI_Dialog](#dialog)
*   [WUI_DropDown](#dropdown)
*   [WUI_ToolBar](#toolbar)
*   [WUI_RangeSlider](#rangeslider)

The WUI API is simple, all widgets have a method **_"create"_** which take a DOM element identifier as first argument (which is used as a bind target) and an option object as second or third argument (toolbar case) to customize it.

All **_"create"_** methods return a reference of the widget which can be used later to do stuff with the widget like destroying them.

All widgets also have a method **_"destroy"_**.

HTML elements with a specific layout are required to use some widgets (like tabs, see the documentation)

A bit of style hacking may be necessary if you want widgets to suit your need or your taste, the demo page can be helpful.

======

<a name="wui"></a>
### WUI ###

Not really a widget but a collection of tools, can be helpful if you want to add draggable functionality to an element or apply fade in/out.

Fade in/Fade out method default to 500ms if no duration is provided

*Methods*:

>*   draggable(element, draggable_state, on_drag_cb)
*   fadeIn(element, duration_ms)
*   fadeOut(element, duration_ms, fade_finish_cb, hide_when_fade_finish)

<br/>*Example*:

```javascript
// make the element draggable
// Note: If you want to remove the element while it is draggable, make it undraggable first by passing false as second argument of this function, this is because WUI keep a reference of the element and it may cause memory leaks, passing false will make the reference go away
WUI.draggable(my_element, true);

// apply a 500ms fade in effect to an element
WUI.fadeIn(my_element, 500);

// apply a 500ms fade out effect to an element, when finished output "finished" to the browser console and hide the element (display: none)
WUI.fadeOut(my_element, function () { console.log("finished!"); }, true, 500);
```

<br/>

======

<a name="tabs"></a>
### Tabs ###

*Methods*:

>*   create(id, options)
*   destroy(wui_tabs)
*   getContentElement(wui_tabs, tab_index)
*   getTabName(wui_tabs, tab_index)

<br/>*Example*:

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
	on_tab_click: tab_clicked
});
```

<br/>

======

<a name="dialog"></a>
### Dialog/Panel ###

>The dialogs can be draggable, closable, minimizable, modal, resizable and act as panels, they also go in front of others when you move them.

<br/>*Methods*:

>*   create(id, options)
*   destroy(wui_dialog)
*   open(wui_dialog)
*   close(wui_dialog, propagate)
  
<br/>*Example*:
  
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
    
    // function called when the dialog has been closed
    on_close: null,
    
    modal: false,
    
    closable: false,
    draggable: true,
    minimizable: true,
    
    resizable: true,
    
    // the minimun width/height the dialog can be when resized (min_width accept a value or "title")
    min_width: "title",
    min_height: 64,
    
    // option to keep the align when resized, example: if the dialog is centered in the window, the dialog will always be in center when it is resized
    keep_align_when_resized: true;
    
    // can be used to position the dialog, default to 0
    top: 0,
    left: 0
});
```
<br/>
Closed and want to open it again?

```javascript
WUI_Dialog.open(my_dialog);
```
<br/>

Open and want to close it programmatically?

```javascript
WUI_Dialog.close(my_dialog, true); // last argument (optional) mean the on_close function will be called
```
<br/>
======

<a name="dropdown"></a>
### DropDown ###

>A simple and automatically opening/closing dropdown.

<br/>*Method*:

>*   create(id, options, entry_name_array)
*   destroy(wui_dropdown)

<br/>*Example*:

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
<br/>

======

<a name="toolbar"></a>
### ToolBar ###

>The toolbar can be horizontal or vertical, have groups and minimizable groups, have three type of buttons, simple, toggle and dropdown (usefull to make menu bar), a set of toggle buttons can be linked (grouped), buttons can be an icon, a text or both.

<br/>*Method*:

>*   create(id, tools, options)
*   destroy(wui_toolbar)
*   hideGroup(wui_toolbar, group_index)
*   showGroup(wui_toolbar, group_index)
*   toggle(wui_toolbar, tool_id, propagate)
*   getItemElement(wui_toolbar, tool_id)

<br/>*Example*:

```html
<div id="my_toolbar"></div>
```
  
```javascript
var my_toolbar = WUI_ToolBar.create("my_toolbar", {  
	// properties added to this object are recognized automatically as new groups by the widget
    my_first_group_of_tools: [
      {
        // CSS class name
        icon: "pencil-icon",
        
        // button text
        text: "",
        
        // can be "toggle", "dropdown" or nothing for a simple button
        type: "toggle",
        
        // a toggling group id, another button with the same toggling group id will be linked to this one and will be off when this one will be switched on
        toggle_group: 0,
        
        // toggle state of the button after creation, only if it is a toggle button
        toggle_state: true,
        
        // function called when a button is clicked, if the item is of type "toggle", an object containing a field "type" and "state" will be passed as argument
        on_click: toolbar_item_toggle,
        
        // tooltip
        tooltip: "Toggle me!"
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
        // can be "s", "sw", "se", "nw", "ne", anything else will default to "n" (north = top)
        orientation: "top",
        
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
  }, {
    // display the minimize icon for each groups
    allow_groups_minimize: true,
    
    // this will modify the size of the button
    item_width: 32,
    item_height: 32,
    
    // this set the spacing between buttons, aka margin to left/right or top/bottom
    item_hmargin: 0,
    item_vmargin: 0,
    
    icon_width: 32,
    icon_height: 32,
  
    vertical: false
  });
```
<br/>
You can toggle a specific button programmatically with:

```javascript
WUI_ToolBar.toggle(my_toolbar, 0, true); // the last argument is optional and mean that the toggle event will call the onClick function
```

<br/>

======

<a name="rangeslider"></a>
### RangeSlider ###

>Range slider widget can be horizontal or vertical, have a negative/positive range, the value can be changed with the mouse wheel or by moving the hook point by dragging or by clicking on the slider bar, a double click on the slider will reset the value to its default value, the value also appear as an input which perform automatically all sanity check and will indicate if the value is correct or not (red)

<br/>*Method*:

>*   create(id, options)
*   destroy(wui_rangeslider)
  
<br/>*Example*:

```html
<div id="my_range_slider"></div>
```

```javascript
WUI_RangeSlider.create("my_range_slider", {
    // width/height of the slider, if you make a vertical slider, you should swap theses values
    width: 300,
    height: 8,
    
    // the value range, -100 <-> 100
    min: -100,
    max: 100,
    
    // standard increment when dragging
    step: 1,
    
    // on mouse wheel increment
    scroll_step: 2,
    
    vertical: false,
  
    default_value: 0,
  
    // this will place the title on top and the value at the bottom, good for vertical sliders
    title_on_top: true,
  
    title: "my range slider",
  
    // used to line up multiple sliders perfectly
    title_min_width: 150,
    value_min_width: 48,
  
    // function to call when the slider value change with the value passed as argument
    on_change: slider_change
  });
```
<br/>

======

<a name="compat"></a>
### Compatibility ###

Not well tested but should work in all modern browsers supporting **_ECMAScript 5_** and **_CSS3_**.

Tested and work ok with IE 11, Opera 12, Chrome (30, 35, 40), Firefox (31, 37) and Safari (6, 7, 8).

>
IE   10 - WUI_ToolBar does not work correctly, due to the use of 'pointer-events' and 'flexbox'
<br/><br/>
IE < 10 - Not compatible

======

<a name="license"></a>
### License ###

[Revised BSD](https://github.com/grz0zrg/wui/blob/master/LICENSE)

======

This was made for an audio app and the map editor of a wargame engine.