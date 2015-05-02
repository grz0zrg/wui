/* jslint browser: true */
/* jshint globalstrict: false */
/* global WUI_ToolBar, WUI_DropDown, WUI_RangeSlider, WUI_Tabs, WUI_Dialog */

/* For my pre-processor include tool. */
/*#include wui_dialog.js*/
/*#include wui_range_slider.js*/
/*#include wui_toolbar.js*/
/*#include wui_dropdown.js*/
/*#include wui_tab.js*/

var WUI = new (function() {
    /***********************************************************
        Private section.
        
        Fields.
    ************************************************************/
    
    var widgets = [
            WUI_DropDown,
            WUI_Dialog,
            WUI_RangeSlider,
            WUI_ToolBar,
            WUI_Tabs
        ];
    
    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
    /***********************************************************
        Public section.
        
        Functions.
    ************************************************************/
    
    /**
     * Dispatch an event to all created widgets.
     * 
     * This can be usefull in case you do not want event listeners to be created by the library.
     * 
     * @param {Object} event DOM event
     * @param {String} type  Type of the event (mousemove and so on)
     */
    this.dispatchEvent = function (event, type) {
        for (var i = 0; i < widgets.length; i += 1) {
            widgets[i].triggerEvent(event, type);
        }
    };
})();