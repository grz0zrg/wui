/* jslint browser: true */
/* jshint globalstrict: false */
/* global */

var WUI_RangeSlider = new (function() {
    /***********************************************************
        Private section.
        
        Fields.
    ************************************************************/
    
    var _widget_list = {},
        
        _hook_value = null,
        
        _grabbed_widget = null,
        _grabbed_hook_element = null,
        
        _touch_identifier = null,
        
        _class_name = {
            hook:       "wui-rangeslider-hook",
            bar:        "wui-rangeslider-bar",
            filler:     "wui-rangeslider-filler",

            hook_focus: "wui-rangeslider-hook-focus"
        },
        
        _known_options = {
            width: 148,
            height: 8,
            
            title: "",
            
            title_min_width: 0,
            value_min_width: 0,
            
            min: 0,
            max: 1,
            
            step: 0.01,
            scroll_step: 0.01,
            
            vertical: false,
            
            title_on_top: false,
            
            on_change: null,
            
            default_value: 0.5
        };
    
    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
    var _getElementOffset = function (element) {    
        var box = element.getBoundingClientRect(),
            body = document.body,
            docEl = document.documentElement,
        
            scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop,
            scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft,

            clientTop = docEl.clientTop || body.clientTop || 0,
            clientLeft = docEl.clientLeft || body.clientLeft || 0,

            top  = box.top +  scrollTop - clientTop,
            left = box.left + scrollLeft - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    };
    
    var _onChange = function (func, value) {
        if (func !== null) {
            func(value);
        }  
    };
    
    // thank to Nick Knowlson - http://stackoverflow.com/questions/4912788/truncate-not-round-off-decimal-numbers-in-javascript
    var _truncateDecimals = function (num, digits) {
        var numS = num.toString(),
            decPos = numS.indexOf('.'),
            substrLength = decPos == -1 ? numS.length : 1 + decPos + digits,
            trimmedResult = numS.substr(0, substrLength),
            finalResult = isNaN(trimmedResult) ? 0 : trimmedResult;

        return parseFloat(finalResult);
    };
    
    var _getHookElementFromTarget = function (ev_target) {
        if (ev_target.classList.contains(_class_name.hook)) {
            return ev_target;
        } else if (ev_target.classList.contains(_class_name.filler)) {
            return ev_target.firstElementChild;
        }
            
        return ev_target.firstElementChild.firstElementChild;
    };
    
    var _update = function (rs, value) {
        var element = rs.element,
            
            value_input = element.childNodes[2],
        
            bar    = element.childNodes[1],
            filler = bar.firstElementChild,
            hook   = filler.firstElementChild,
            
            width = rs.opts.width,
            height = rs.opts.height,
        
            pos = Math.abs((value - rs.opts.min) / rs.opts.range);
        
        if (rs.opts.vertical) {
            pos = Math.round(pos * bar.offsetHeight);

            filler.style.position = "absolute";
            filler.style.bottom = "0";
            filler.style.width = "100%";
            filler.style.height = pos + "px";

            hook.style.marginTop  = -width + "px";
            hook.style.marginLeft = -width / 2 - 1 + "px";
            
            hook.style.width  = width * 2 + "px";
            hook.style.height = width * 2 + "px";
            
            value_input.style.marginTop = "13px";
        } else {
            pos = Math.round(pos * width);
            
            filler.style.width = pos + "px";
            filler.style.height = "100%";
            
            hook.style.left = pos + "px";
            
            hook.style.marginTop  = -height / 2 + "px";
            hook.style.marginLeft = -height + "px";
            
            hook.style.width  = height * 2 + "px";
            hook.style.height = height * 2 + "px";
        }

        value_input.value = _truncateDecimals(value, 4);
        
        rs.value = value;
    };
    
    var _mouseMove = function (ev) {
        ev.preventDefault();
        
        if (_grabbed_hook_element !== null) {
            var value_input = _grabbed_widget.element.lastElementChild,
            
                filler = _grabbed_hook_element.parentElement,
                bar = filler.parentElement,
                
                bar_offset = _getElementOffset(bar),
                max_pos = bar.offsetWidth,
                
                cursor_relative_pos = 0,
                
                x = ev.clientX,
                y = ev.clientY,
            
                touches = ev.changedTouches,
            
                touch = null,
            
                i;
            
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
            
            if (_grabbed_widget.opts.vertical) {
                max_pos = bar.offsetHeight;
                
                cursor_relative_pos = Math.round((bar_offset.top + bar.offsetHeight - y) / _grabbed_widget.opts.step) * _grabbed_widget.opts.step;
            } else {
                cursor_relative_pos = Math.round((x - bar_offset.left) / _grabbed_widget.opts.step) * _grabbed_widget.opts.step;   
            }

            if (cursor_relative_pos > max_pos) {
                cursor_relative_pos = max_pos;
                
                _hook_value = _grabbed_widget.opts.max;
            } else if (cursor_relative_pos < 0) {
                cursor_relative_pos = 0;
                
                _hook_value = _grabbed_widget.opts.min;
            } else {
                _hook_value = (Math.round((_grabbed_widget.opts.min + (cursor_relative_pos / max_pos) * _grabbed_widget.opts.range) / _grabbed_widget.opts.step) * _grabbed_widget.opts.step);
            }
            
            if (_grabbed_widget.value === _hook_value) {
                return;   
            }
            
            _grabbed_widget.value = _hook_value;

            value_input.value = _truncateDecimals(_hook_value, 4);

            if (_grabbed_widget.opts.vertical) {
                filler.style.height = cursor_relative_pos + "px";
            } else {
                filler.style.width = cursor_relative_pos + "px";

                _grabbed_hook_element.style.left = cursor_relative_pos + "px";
            }
            
            _onChange(_grabbed_widget.opts.on_change, _hook_value);
        }
    };
    
    var _rsMouseUp = function (ev) {
        ev.preventDefault();

        var touches = ev.changedTouches,
            
            touch = null,
            
            stop_drag = false,
            
            i;
        
        if (touches) {
            for (i = 0; i < touches.length; i += 1) {
                touch = touches[i];
                
                if (touch.identifier === _touch_identifier) {
                    stop_drag = true;
                    
                    window.removeEventListener("touchend", _rsMouseUp, false);
                    window.removeEventListener("touchmove", _mouseMove, false);
                    
                    break;
                }
            }
        } else {
            stop_drag = true;
            
            window.removeEventListener("mouseup", _rsMouseUp, false);
            window.removeEventListener("mousemove", _mouseMove, false);
        }
        
        if (stop_drag) {
            _grabbed_hook_element.classList.remove(_class_name.hook_focus);

            _grabbed_hook_element = null;
            _grabbed_widget = null;

            document.body.style.cursor = "default";
        }
    };
    
    var _rsMouseDown = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        
        var rs_element = null,
            
            drag_slider = false,
            
            touches = ev.changedTouches;
        
        if (_grabbed_widget === null) {
            if (touches) {
                _touch_identifier = touches[0].identifier;
                
                drag_slider = true;
            }
        }
        
        if (ev.button === 0) {
            drag_slider = true;
        }
        
        if (drag_slider) {
            _grabbed_hook_element = _getHookElementFromTarget(ev.target);
            
            _grabbed_hook_element.classList.add(_class_name.hook_focus);
            
            rs_element = _grabbed_hook_element.parentElement.parentElement.parentElement;
            
            _grabbed_widget = _widget_list[rs_element.id];

            document.body.style.cursor = "pointer";
            
            _mouseMove(ev);
            
            window.addEventListener("mousemove", _mouseMove, false);
            window.addEventListener("touchmove", _mouseMove, false);
            window.addEventListener("mouseup", _rsMouseUp, false);
            window.addEventListener("touchend", _rsMouseUp, false);
        }
    };
    
    var _rsDblClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        
        var hook_element = ev.target,
            
            rs_element = hook_element.parentElement.parentElement.parentElement,
        
            grabbed_widget = _widget_list[rs_element.id],
            
            value = grabbed_widget.opts.default_value;

        _update(grabbed_widget, value);

        _onChange(grabbed_widget.opts.on_change, value);
    };
    
    var _rsMouseWheel = function (ev) {   
        ev.preventDefault();
        ev.stopPropagation();
        
        var hook_element = _getHookElementFromTarget(ev.target),
            
            rs_element = hook_element.parentElement.parentElement.parentElement,
        
            grabbed_widget = _widget_list[rs_element.id],
            
            delta = ev.wheelDelta ? ev.wheelDelta / 40 : ev.detail ? -ev.detail : 0,
            
            value = grabbed_widget.value;
        
        if (delta >= 0) {
            value += grabbed_widget.opts.scroll_step;
        } else {
            value -= grabbed_widget.opts.scroll_step;
        }
        
        if (value > grabbed_widget.opts.max) {
            value = grabbed_widget.opts.max;
        } else if (value < grabbed_widget.opts.min) {
            value = grabbed_widget.opts.min;  
        }
        
        _update(grabbed_widget, value);
        
        _onChange(grabbed_widget.opts.on_change, value);
    };
    
    var _inputChange = function (ev) {
        if ((ev.target.validity) && (!ev.target.validity.valid)) {
            return;   
        }
        
        var target = ev.target.parentElement.childNodes[1];
        
        if (target === undefined) {
            return;   
        }
        
        var hook_element = _getHookElementFromTarget(target),
            
            rs_element = hook_element.parentElement.parentElement.parentElement,
        
            grabbed_widget = _widget_list[rs_element.id];

        _update(grabbed_widget, ev.target.value);
        
        _onChange(grabbed_widget.opts.on_change, ev.target.value);
    };
    
    /***********************************************************
        Public section.
        
        Functions.
    ************************************************************/

    this.create = function (id, options) {
        var range_slider = document.getElementById(id),
            
            opts = {},
            
            key;
        
        if (_widget_list[id] !== undefined) {
            console.log("WUI_RangeSlider id '" + id + "' already created, aborting.");
            
            return;
        }
        
        for (key in _known_options) {
            if (_known_options.hasOwnProperty(key)) {
                opts[key] = _known_options[key];
            }
        }
        
        if (options !== undefined) {
            for (key in options) {
                if (options.hasOwnProperty(key)) {
                    if (_known_options[key] !== undefined) {
                        opts[key] = options[key];
                    }
                }
            }
            
            if (options.max !== undefined) {
                opts.range = options.max;
            }
            
            if (options.step !== undefined) {
                opts.step = options.step;
                
                if (options.scroll_step === undefined) {
                    opts.scroll_step = opts.step;
                }
            }
            
            if (options.title_on_top !== undefined) {
                opts.title_on_top = options.title_on_top;
            } else {
                if (opts.vertical) {
                    opts.title_on_top = true;
                }
            }
            
            if (options.default_value !== undefined) {
                opts.default_value = options.default_value;
            } else {
                if (options.min !== undefined && options.max !== undefined) {
                    opts.default_value = opts.min + opts.max / 2;
                }
            }
        }
        
        if (opts.min < 0) {
            opts.range = opts.max - opts.min;
        }
        
        // build up the range slider widget internal data structure
        _widget_list[id] = null;
        
        // build the range slider and its items
        range_slider.classList.add("wui-rangeslider");
        
        if (opts.title_on_top) {
            range_slider.classList.add("wui-rangeslider-title-ontop");
        }
        
        var title_div   = document.createElement("div"),
            bar         = document.createElement("div"),
            filler      = document.createElement("div"),
            hook        = document.createElement("div"),
            value_div   = document.createElement("div"),
            value_input = document.createElement("input"),

            rs = {
                    element: range_slider, 
                
                    opts: opts,
                  
                    value: opts.default_value, 
                 };
        
        title_div.innerHTML = opts.title;
        
        value_input.setAttribute("value", opts.default_value);
        value_input.setAttribute("type",  "number");
        value_input.setAttribute("min",   opts.min);
        value_input.setAttribute("max",   opts.max);
        value_input.setAttribute("step",  opts.step);

        value_input.classList.add("wui-rangeslider-input");
        
        value_div.classList.add("wui-rangeslider-value");
        title_div.classList.add("wui-rangeslider-title");
        bar.classList.add(_class_name.bar);
        filler.classList.add(_class_name.filler);
        hook.classList.add(_class_name.hook);
        
        title_div.style.minWidth = opts.title_min_width + "px";
        value_div.style.minWidth = opts.value_min_width + "px";
        value_input.style.minWidth = opts.value_min_width + "px";

        bar.style.width  = opts.width + "px";
        bar.style.height = opts.height + "px";
        
        bar.appendChild(filler);
        filler.appendChild(hook);
        
        range_slider.appendChild(title_div);
        range_slider.appendChild(bar);

        range_slider.appendChild(value_input);
        
        _update(rs, opts.default_value);
        
        bar.addEventListener("mousedown", _rsMouseDown, false);
        bar.addEventListener("touchstart", _rsMouseDown, false);
            
        hook.addEventListener("dblclick", _rsDblClick, false);
            
        value_input.addEventListener("input", _inputChange, false);
            
        bar.addEventListener("mousewheel", _rsMouseWheel, false);
        bar.addEventListener("DOMMouseScroll", _rsMouseWheel, false);
        
        _widget_list[id] = rs;
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_RangeSlider, destroying aborted.");

            return;
        }

        element = widget.element;

        element.parentElement.removeChild(element);

        delete _widget_list[id];
    };
})();
