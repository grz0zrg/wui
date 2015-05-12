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
            hide_show_500: "wui-show-fi-500",
            draggable:     "wui-draggable"
        },


        // Draggable
        _dragged_element = null,

        _touch_identifier = null,

        _drag_x = 0,
        _drag_y = 0;
    
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

    var _dragStart = function (ev) {
        var x = ev.clientX,
            y = ev.clientY,

            touches = ev.changedTouches;

        if(ev.preventDefault) {
            ev.preventDefault();
        }

        if (_dragged_element === null) {
            if (touches) {
                _touch_identifier = touches[0].identifier;

                x = touches[0].clientX;
                y = touches[0].clientY;
            } else if (ev.button !== 0) {
                return;
            }
        }

        _dragged_element = ev.target;

        document.body.style.cursor = "move";

        _drag_x = x - parseInt(_dragged_element.style.left, 10);
        _drag_y = y - parseInt(_dragged_element.style.top,  10);

        window.addEventListener('mousemove', _drag, false);
        window.addEventListener('touchmove', _drag, false);
    };

    var _drag = function (ev) {
        if(ev.preventDefault) {
            ev.preventDefault();
        }

        var x = ev.clientX,
            y = ev.clientY,

            touches = ev.changedTouches,

            touch = null,

            i,

            new_x, new_y;

        if (touches) {
            for (i = 0; i < touches.length; i += 1) {
                touch = touches[i];

                if (touch.identifier === _touch_identifier) {
                    x = touches[i].clientX;
                    y = touches[i].clientY;

                    break;
                }
            }
        }

        new_x = x - _drag_x;
        new_y = y - _drag_y;

        _dragged_element.style.left = new_x + 'px';
        _dragged_element.style.top  = new_y + 'px';
    };

    var _dragStop = function (ev) {
        var touches = ev.changedTouches,

            touch = null,

            i;

        if (touches) {
            for (i = 0; i < touches.length; i += 1) {
                touch = touches[i];

                if (touch.identifier === _touch_identifier) {
                    _dragged_element = null;

                    document.body.style.cursor = "default";

                    window.removeEventListener('touchmove', _drag, false);

                    break;
                }
            }
        } else {
            _dragged_element = null;

            document.body.style.cursor = "default";

            window.removeEventListener('mousemove', _drag, false);
        }
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

    /**
     * Apply a fade out effect to the element.
     *
     * @param {Object}   element                 DOM Element
     * @param {[Callback]} fade_finish_cb        Function called when the fade out effect finish
     * @param {[Boolean]} hide_when_fade_finish  If true, add a "display: none;" style class automatically when the fade out effect finish
     */
    this.fadeOut = function (element, fade_finish_cb, hide_when_fade_finish) {
        element.addEventListener('transitionend', _hideHandler(element, fade_finish_cb, hide_when_fade_finish), false);

        element.classList.add(_class_name.hide_fi_500);
        element.classList.remove(_class_name.hide_show_500);
    };

    /**
     * Apply a fade in effect to the element.
     *
     * @param {Object} element DOM Element
     */
    this.fadeIn = function (element) {
        element.classList.remove(_class_name.display_none);

        element.classList.remove(_class_name.hide_fi_500);
        element.classList.add(_class_name.hide_show_500);
    };

    /**
     * Make an element draggable
     *
     * @param {Object} element DOM Element
     * @param {[Boolean]} state false value mean the element will be no more draggable
     */
    this.draggable = function (element, draggable_state) {
        if (draggable_state) {
            element.classList.add(_class_name.draggable);

            element.addEventListener("mousedown",  _dragStart, false);
            element.addEventListener("touchstart", _dragStart, false);

            window.addEventListener('mouseup', _dragStop, false);
            window.addEventListener('touchend', _dragStop, false);
        } else {
            element.classList.remove(_class_name.draggable);

            element.removeEventListener("mousedown",  _dragStart, false);
            element.removeEventListener("touchstart", _dragStart, false);

            window.removeEventListener('mouseup', _dragStop, false);
            window.removeEventListener('touchend', _dragStop, false);
        }
    };
})();
