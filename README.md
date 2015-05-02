This is a collection of easy to use and lightweight (~3kb css, ~5kb js gzipped) vanilla GUI widgets for the web.

Require no dependencies, all widgets can be used on their own.

The API is simple, all widgets have a method "create" taking an element id as a binding target and an option object to customize the widget, they cannot (for now) be destroyed.

All "create" methods return a reference to the widget which can be used later to do stuff with it.

HTML elements with a specific layout are required to use some widgets (like tabs, see documentation)

A bit of style hacking may be required if you want them to suit your needs or your taste, the demo page can be helpfull.

Made them for an audio app and a wargame engine.

#### Documentation ####

Widget list

*   WUI_Tabs
*   WUI_Dialog
*   WUI_DropDown
*   WUI_ToolBar
*   WUI_RangeSlider

### Tabs ###

Methods:

*   create(id, options)
*   getContentElement(wui_tabs_id, tab_index)
*   getTabName(wui_tabs, tab_index)

Usage example:

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
    
  WUI_Tabs.create("my_tabs", {
    on_tab_click: tab_clicked   // function which will be called when a tab is clicked (tab index will be passed as argument to that function)
  });
  
### Dialog/Panel ###

Dialogs can be draggable, closable, minimizable and act as cheap panels, they also go in front of others when you drag them.

Methods:

*   create(id, options)
*   open(wui_dialog)
  
Usage example:
  
  <div id="my_dialog">
    <div>
      dialog content
    </div>
  </div>
  
  var my_dialog = WUI_Dialog.create("my_dialog", {    
    title: "dialog title",
    
    width: "20%",
    height: "50%",
    
    halign: "left",   // 'left', 'center', 'right' or 'none'
    valign: "center", // 'top', 'center', 'bottom' or 'none'
    
    closable: false,
    draggable: true,
    minimizable: true,
    
    // theses can be used to position (or offset) the dialog
    top: "0px",
    bottom: "0px",
    left: "0px",
    right: "0px"
  });
  
Was closed and want to open it again? Use "open"

  WUI_Dialog.open(my_dialog);
  
### DropDown ###

A simple and automatically opening/closing dropdown.

Methods:

*   create(id, options, entry_name_array)
  
Usage example:

  <div id="my_dropdown"></div>

  WUI_DropDown.create("my_dropdown", {
      width: "100px",
      height: 24,

      // spacing of the floating list from the main button
      vspacing: 4,

      // time before the list hide
      ms_before_hiding: 1000,

      // default item to be selected after creation
      selected_id: 0,

      vertical: false,

      // function to call when an item is selected, the item index is passed as argument
      on_item_selected: item_selected
    },
    // list of items
    ["First item", "Second item", "Third item"]
  );
  
### ToolBar ###

Toolbar can be horizontal or vertical, have groups and minimizable groups, have two type of buttons, simple and toggle, a set of toggle buttons can linked (grouped), buttons can be icon, text or both.

Methods:

*   create(id, tools, options)
  
Usage example:

  <div id="my_toolbar"></div>
  
  var my_toolbar = WUI_ToolBar.create("my_toolbar", {  
    // any fields added there are recognized automatically as new groups
    my_first_group_of_tools: [
      {
        // CSS class name with a background-image property
        icon: "pencil-icon",
        
        // the button text
        text: "",
        
        // "toggle" or nothing for a standard button
        type: "toggle",
        
        // a toggle group id
        toggle_group: 0,
        
        // toggle state after creation
        toggle_state: true,
        
        // function to call when an item is clicked, if the item is of type "toggle", an object containing a field "type" and "state" will be passed as argument
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
    
    // can also be used for text only buttons, in this case it will change the size of the bouton
    icon_width: 32,
    icon_height: 32,
  
    vertical: false
  });
  
### RangeSlider ###

Advanced slider widget, can be horizontal or vertical, support negative/positive range, the value can be changed with the mouse wheel or by dragging the hook point or by clicking on the slider bar, a double click on the slider also reset the value to its default value, the value also appear as an input which perform automatically all the checks and indicate if the value is correct or not (red)

Methods:

*   create(id, options)
  
Usage example:

  <div id="my_range_slider"></div>
  
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

### Demo ###

[Demo page](http://wui_demo.github.com)

### Compatibility ###

Not well tested but should work in all modern browsers supporting ECMAScript 5 and CSS3.

### License ###

Revised BSD.
