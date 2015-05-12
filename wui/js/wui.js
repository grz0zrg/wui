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
        _draggables = [],

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
        ev.preventDefault();

        var x = ev.clientX,
            y = ev.clientY,

            touches = ev.changedTouches;

        if (!ev.target.classList.contains(_class_name.draggable)) {
            return;
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

        window.addEventListener('mouseup', _dragStop, false);
        window.addEventListener('touchend', _dragStop, false);
    };

    var _drag = function (ev) {
        ev.preventDefault();

        var x = ev.clientX,
            y = ev.clientY,

            touches = ev.changedTouches,

            touch = null,

            i,

            draggable = _draggables[parseInt(_dragged_element.dataset.wui_draggable_id, 10)],

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

        if (draggable) {
            draggable.cb(_dragged_element, new_x, new_y);
        }
    };

    var _dragStop = function (ev) {
        ev.preventDefault();

        var touches = ev.changedTouches,

            touch = null,

            i;

        if (_draggables.length === 0) {
            return;
        }

        if (touches) {
            for (i = 0; i < touches.length; i += 1) {
                touch = touches[i];

                if (touch.identifier === _touch_identifier) {
                    _dragged_element = null;

                    document.body.style.cursor = "default";

                    window.removeEventListener('touchmove', _drag, false);
                    window.removeEventListener('touchend', _dragStop, false);

                    break;
                }
            }
        } else {
            _dragged_element = null;

            document.body.style.cursor = "default";

            window.removeEventListener('mousemove', _drag, false);
            window.removeEventListener('mouseup', _dragStop, false);
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
     * @param {Callback} fade_finish_cb        Function called when the fade out effect finish
     * @param {Boolean} hide_when_fade_finish  If true, add a "display: none;" style class automatically when the fade out effect finish
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
     * @param {Callback} function called when the element is being dragged, it has two argument which is the new x/y
     * @param {Boolean} state false value mean the element will be no more draggable
     */
    this.draggable = function (element, draggable_state, on_drag_cb) {
        if (draggable_state) {
            element.classList.add(_class_name.draggable);

            element.addEventListener("mousedown",  _dragStart, false);
            element.addEventListener("touchstart", _dragStart, false);

            element.dataset.wui_draggable_id = _draggables.length;

            _draggables.push({
                cb: on_drag_cb,
                element: element
            });
        } else {
            element.classList.remove(_class_name.draggable);

            element.removeEventListener("mousedown",  _dragStart, false);
            element.removeEventListener("touchstart", _dragStart, false);

            var id = parseInt(element.dataset.wui_draggable_id, 10),

                i;

            _draggables.splice(id, 1);

            for (i = 0; i < _draggables.length; i += 1) {
                var draggable = _draggables[i];

                draggable.element.dataset.wui_draggable_id = i;
            }
        }
    };
})();
