WUI
=====

Collection of **easy to use** and **lightweight** (*~3kb css*, *~5kb js* gzipped) vanilla GUI widgets for the web.

*Require no dependencies, all widgets can be used on their own.*

Made this for an audio app and a wargame engine.

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

####Widgets

*   [WUI_Tabs](#tabs)
*   [WUI_Dialog](#dialog)
*   [WUI_DropDown](#dropdown)
*   [WUI_ToolBar](#toolbar)
*   [WUI_RangeSlider](#rangeslider)

The API is simple, all widgets have a method *_"create"_*, a DOM element id as first argument (which is used as a bind target) and an options object as second or third argument (toolbar case) to customize it, widgets cannot (for now) be destroyed.

All "create" functions return a reference of the widget which can be used later to do stuff with the widget.

HTML elements with a specific layout are required to use some widgets (like tabs, see the documentation)

A bit of style hacking may be necessary if you want widgets to suit your need or your taste, the demo page can be helpful.

All widgets have a method *_"triggerEvent"_* which take an Event object and event type string as argument, you can use it if you want to handle all events by yourself, preventing the library to add event listeners.

You can also use *"_WUI.dispatchEvent_"*, this will call triggerEvent for each widgets.

======

<a name="tabs"></a>
## Tabs ##

*Methods*:

>*   create(id, options)
*   getContentElement(wui_tabs_id, tab_index)
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

>The dialogs can be draggable, closable, minimizable and act as panels, they also go in front of others when you move them.

<br/>*Methods*:

>*   create(id, options)
*   open(wui_dialog)
  
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
    
    // 'left', 'center', 'right' or 'none'
    halign: "left",
    // 'top', 'center', 'bottom' or 'none'
    valign: "center",
    
    closable: false,
    draggable: true,
    minimizable: true,
    
    // can be used to position the dialog
    top: "0px",
    bottom: "0px",
    left: "0px",
    right: "0px"
});
```
<br/>
Closed and want to open it again?

```javascript
WUI_Dialog.open(my_dialog);
```
<br/>

======

<a name="dropdown"></a>
### DropDown ###

>A simple and automatically opening/closing dropdown.

<br/>*Method*:

>*   create(id, options, entry_name_array)

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

>The toolbar can be horizontal or vertical, have groups and minimizable groups, dispose of two type of buttons, simple and toggling, a set of toggle buttons can be linked (grouped), buttons can be an icon, a text or both.

<br/>*Method*:

>*   create(id, tools, options)
  
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
        
        // "toggle" or nothing for a non-toggle button
        type: "toggle",
        
        // a toggling group id, another button with the same toggling group id will be linked to this one and will be off when this one will be switched on
        toggle_group: 0,
        
        // toggle state after creation, if it is a toggle button
        toggle_state: true,
        
        // function called when a button is clicked, if the item is of type "toggle", an object containing a field "type" and "state" will be passed as argument
        onClick: toolbar_item_toggle,
        
        // tooltip
        tooltip: "Toggle me!"
      }
    ],
    my_second_group_of_tools:    [
      { icon: "undo-icon", onClick: toolbar_item_click, tooltip: "Click me!" },
      { icon: "redo-icon", onClick: toolbar_item_click, tooltip: "Click me!" }
    ]
  }, {
    // display the minimize icon for each groups
    allow_groups_minimize: true,
    
    // in case of a text button, this will modify the size of the button
    icon_width: 32,
    icon_height: 32,
  
    vertical: false
  });
```
<br/>

======

<a name="rangeslider"></a>
### RangeSlider ###

>Range slider widget can be horizontal or vertical, have a negative/positive range, the value can be changed with the mouse wheel or by moving the hook point by dragging or by clicking on the slider bar, a double click on the slider will reset the value to its default value, the value also appear as an input which perform automatically all sanity check and will indicate if the value is correct or not (red)

<br/>*Method*:

>*   create(id, options)
  
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

This library was not built to target mobiles devices (but it may, in the *future*) and does not support touch events.
<br/>

======

<a name="license"></a>
### License ###

[Revised BSD](https://github.com/grz0zrg/wui/blob/master/LICENSE)
