/* jslint browser: true */
/* jshint globalstrict: false */
/* global WUI_ToolBar, WUI_DropDown, WUI_RangeSlider, WUI_Tabs, WUI_Dialog */

var WUI = new (function() {
    "use strict";

    /***********************************************************
        Private section.
        
        Fields.
    ************************************************************/
    
    var _class_name = {
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
            
            draggable,

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
        
        draggable = _draggables[parseInt(_dragged_element.dataset.wui_draggable_id, 10)];
        
        if (draggable.virtual) {
            _drag_x = x - parseInt(draggable.x, 10);
            _drag_y = y - parseInt(draggable.y,  10);
        } else {
            _drag_x = x - parseInt(_dragged_element.style.left, 10);
            _drag_y = y - parseInt(_dragged_element.style.top,  10);
        }

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

            new_x = draggable.x, new_y = draggable.y;
        
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

        if (draggable.axisLock !== 0) {
            new_x = x - _drag_x;
            
            if (!draggable.virtual) {
                _dragged_element.style.left = new_x + 'px';
            }
            
            draggable.x = new_x;
        }
        
        if (draggable.axisLock !== 1) {
            new_y = y - _drag_y;
            
            if (!draggable.virtual) {
                _dragged_element.style.top  = new_y + 'px';
            }
            
            draggable.y = new_y;
        }
        
        if (draggable) {
            if (draggable.cb !== undefined) {
                draggable.cb(_dragged_element, new_x, new_y);
            }
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
     * Apply a fade out effect to the element.
     *
     * @param {Object}   element                 DOM Element
     * @param {Callback} fade_finish_cb        Function called when the fade out effect finish
     * @param {Boolean} hide_when_fade_finish  If true, add a "display: none;" style class automatically when the fade out effect finish
     */
    this.fadeOut = function (element, duration_ms, fade_finish_cb, hide_when_fade_finish) {
        if (duration_ms === undefined || duration_ms === null) {
            duration_ms = 500;
        }

        if (element.style['WebkitTransition'] === undefined) {
            element.style.transition = "visibility 0s ease-in-out " + duration_ms + "ms, opacity " + duration_ms + "ms ease-in-out";
        } else {
            element.style.WebkitTransition = "visibility 0s ease-in-out " + duration_ms + "ms, opacity " + duration_ms + "ms ease-in-out";
        }

        element.addEventListener('transitionend', _hideHandler(element, fade_finish_cb, hide_when_fade_finish), false);

        element.classList.add(_class_name.hide_fi_500);
        element.classList.remove(_class_name.hide_show_500);
    };

    /**
     * Apply a fade in effect to the element.
     *
     * @param {Object} element DOM Element
     */
    this.fadeIn = function (element, duration_ms) {
        if (duration_ms === undefined || duration_ms === null) {
            duration_ms = 500;
        }

        if (element.style['WebkitTransition'] === undefined) {
            element.style.transition = "visibility 0s ease-in-out 0s, opacity " + duration_ms + "ms ease-in-out";
        } else {
            element.style.WebkitTransition = "visibility 0s ease-in-out 0s, opacity " + duration_ms + "ms ease-in-out";
        }

        element.classList.remove(_class_name.hide_fi_500);
        element.classList.add(_class_name.hide_show_500);

        element.classList.remove(_class_name.display_none);
    };

    /**
     * Make an element draggable
     *
     * @param {Object} element DOM Element
     * @param {Callback} function called when the element is being dragged, it has two argument which is the new x/y
     * @param {Boolean} virtual true to keep track of element position WITHOUT updating the element position (updating it is left to users through the callback)
     */
    this.draggable = function (element, on_drag_cb, virtual) {
        if (element.classList.contains(_class_name.draggable)) {
            return;
        }

        element.classList.add(_class_name.draggable);

        element.addEventListener("mousedown",  _dragStart, false);
        element.addEventListener("touchstart", _dragStart, false);

        element.dataset.wui_draggable_id = _draggables.length;

        _draggables.push({
            cb: on_drag_cb,
            element: element,
            axisLock: null,
            virtual: virtual,
            x: parseInt(element.style.left, 10),
            y: parseInt(element.style.top, 10)
        });
    };
    
    /**
     * Make an element undraggable
     *
     * @param {Object} element DOM Element
     */
    this.undraggable = function (element) {
        if (!element.classList.contains(_class_name.draggable)) {
            return;
        }

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
    };
    
    this.lockDraggable = function (element, axis) {
        if (!element.classList.contains(_class_name.draggable)) {
            return;
        }
        
        var draggable = _draggables[parseInt(element.dataset.wui_draggable_id, 10)];
        
        if (axis === 'x') {
            draggable.axisLock = 0;
        } else if (axis === 'y') {
            draggable.axisLock = 1;
        } else {
            draggable.axisLock = null;
        }
    };
})();
