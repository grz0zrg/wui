/* jslint browser: true */
/* jshint globalstrict: false */
/* global WUI_ToolBar, WUI_DropDown, WUI_RangeSlider, WUI_Tabs, WUI_Dialog */

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
        ],

        _class_name = {
            display_none:  "wui-display-none",
            hide_fi_500:   "wui-hide-fi-500",
            hide_show_500: "wui-show-fi-500"
        };
    
    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
    var _hideHandler = function (element, fade_finish_cb, hide_when_fade_finish) {
        var handler = function () {
            if (hide_when_fade_finish) {
                element.classList.add(_class_name.display_none);
            }

            if (fade_finish_cb) {
                fade_finish_cb();
            }

            element.removeEventListener('transitionend', handler);
        };

        return handler;
    };

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

    this.fadeOut = function (element, fade_finish_cb, hide_when_fade_finish) {
        element.addEventListener('transitionend', _hideHandler(element, fade_finish_cb, hide_when_fade_finish), false);

        element.classList.add(_class_name.hide_fi_500);
        element.classList.remove(_class_name.hide_show_500);
    };

    this.fadeIn = function (element) {
        element.classList.remove(_class_name.display_none);

        element.classList.remove(_class_name.hide_fi_500);
        element.classList.add(_class_name.hide_show_500);
    };
})();
