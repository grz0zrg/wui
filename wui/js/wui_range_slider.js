/* jslint browser: true */
/* jshint globalstrict: false */
/* global */

var WUI_RangeSlider = new (function() {
    "use strict";

    /***********************************************************
        Private section.
        
        Fields.
    ************************************************************/
    
    var _widget_list = {},
        
        _hook_value = null,
        
        _grabbed_widget = null,
        _grabbed_hook_element = null,
        
        _touch_identifier = null,
        
        _container_suffix_id = "_wui_container",
        
        //_midi_learn_disabled_color = "background-color: #ff0000",
        _midi_learn_enabled_color = "background-color: #00ff00",
        _midi_learn_current = null,
        _midi_controls =  {
            
        },
        
        _title = {
            midi_learn_btn: "MIDI learn"  
        },
        
        _class_name = {
            hook:           "wui-rangeslider-hook",
            bar:            "wui-rangeslider-bar",
            filler:         "wui-rangeslider-filler",

            hook_focus:     "wui-rangeslider-hook-focus",
            
            value_input:    "wui-rangeslider-input",
            
            midi_learn_btn: "wui-rangeslider-midi-learn-btn"
        },
        
        _known_options = {
            width: 148,
            height: 8,
            
            title: "",
            
            title_min_width: 0,
            value_min_width: 0,
            
            min: 0,
            max: 1,
            
            decimals: 4,
            
            step: 0.01,
            scroll_step: 0.01,
            
            vertical: false,
            
            title_on_top: false,

            on_change: null,
            
            default_value: 0.0,
            value: 0.0,
            
            bar: true,
            
            midi: null,
            
            /*
                can be an object with the following fields (example) :
                    {
                        min: { min: 0, max: 0, val: 0 },
                        max: { min: 0, max: 0, val: 0 },
                        step: { min: 0, max: 0, val: 0 },
                        scroll_step: { min: 0, max: 0, val: 0 }
                    }
                if one of these keys are undefined, the option will be not configurable
            */
            configurable: null
        },
        
        _known_configurable_options = {
            min: 0,
            max: 0,
            step: 0,
            scroll_step: 0
        },
        
        // exportable parameters
        _exportable_parameters = {
            opts: {},
            endless: false,
            midi: {},
            value: 0
        };
    
    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
    // find the same slider element from a detached WUI_Dialog
    var _getDetachedElement = function (id) {
        var node = document.getElementById(id),
            
            wui_dialog_id,
            win_handle;

        while (node) {
            if (node.classList) {
                if (node.classList.contains('wui-dialog')) {
                    wui_dialog_id = node.id;
                    break;
                }
            }

            node = node.parentNode;
        }

        if (WUI_Dialog) {
            win_handle = WUI_Dialog.getDetachedDialog(wui_dialog_id);
            
            if (win_handle) {
                return win_handle.document.getElementById(id);
            }
        }
        
        return null;
    };
    
    var _getElementOffset = function (element) {    
        var owner_doc = element.ownerDocument,
            box = element.getBoundingClientRect(),
            body = owner_doc.body,
            docEl = owner_doc.documentElement,

            owner_win = owner_doc.defaultView || owner_doc.parentWindow,
        
            scrollTop = owner_win.pageYOffset || docEl.scrollTop || body.scrollTop,
            scrollLeft = owner_win.pageXOffset || docEl.scrollLeft || body.scrollLeft,

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
    
    var _update = function (rs_element, rs, value) {
        var element = rs_element,

            widget = _widget_list[element.id],
        
            bar,
            filler,
            hook,
            
            value_input,
            
            width = rs.opts.width,
            height = rs.opts.height,
        
            pos = Math.abs((value - rs.opts.min) / rs.opts.range);
        
        bar = element.getElementsByClassName(_class_name.bar)[0];
        filler = bar.firstElementChild;
        hook = filler.firstElementChild;

        value_input = bar.nextElementSibling;
                
        value = _truncateDecimals(value, widget.opts.decimals);

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

            // all theses are to support synchronization between a detached dialog and the original dialog
            // TODO: optimize/clean all this mess :P
            if (widget.element !== element) {
                widget.filler.style.position = "absolute";
                widget.filler.style.bottom = "0";
                widget.filler.style.width = "100%";
                widget.filler.style.height = pos + "px";

                widget.hook.style.marginTop  = -width + "px";
                widget.hook.style.marginLeft = -width / 2 - 1 + "px";

                widget.hook.style.width  = width * 2 + "px";
                widget.hook.style.height = width * 2 + "px";

                widget.value_input.style.marginTop = "13px";
            }
        } else {
            pos = Math.round(pos * width);
            
            filler.style.width = pos + "px";
            filler.style.height = "100%";
            
            hook.style.left = pos + "px";
            
            hook.style.marginTop  = -height / 2 + "px";
            hook.style.marginLeft = -height + "px";
            
            hook.style.width  = height * 2 + "px";
            hook.style.height = height * 2 + "px";

            if (widget.element !== element) {
                widget.filler.style.width = pos + "px";
                widget.filler.style.height = "100%";

                widget.hook.style.left = pos + "px";

                widget.hook.style.marginTop  = -height / 2 + "px";
                widget.hook.style.marginLeft = -height + "px";

                widget.hook.style.width  = height * 2 + "px";
                widget.hook.style.height = height * 2 + "px";
            }
        }

        widget.value_input.value = value;
        value_input.value = value;

        rs.value = value;
    };
    
    var _mouseMove = function (ev) {
        ev.preventDefault();
        
        if (_grabbed_hook_element !== null) {
            var filler = _grabbed_hook_element.parentElement,
                bar = filler.parentElement,
                
                value_input = bar.nextElementSibling,//bar.parentElement.lastElementChild,

                bar_offset = _getElementOffset(bar),
                max_pos = bar.offsetWidth,
                
                cursor_relative_pos = 0,
                
                x = ev.clientX,
                y = ev.clientY,
            
                touches = ev.changedTouches,
            
                touch = null,
            
                i, v;
            
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

            v = _truncateDecimals(_hook_value, _grabbed_widget.opts.decimals);

            value_input.value = v;
            _grabbed_widget.value_input.value = v;

            if (_grabbed_widget.opts.vertical) {
                filler.style.height = cursor_relative_pos + "px";
                _grabbed_widget.filler.style.height = cursor_relative_pos + "px";
            } else {
                filler.style.width = cursor_relative_pos + "px";
                _grabbed_widget.filler.style.width = cursor_relative_pos + "px";

                _grabbed_hook_element.style.left = cursor_relative_pos + "px";
                _grabbed_widget.hook.style.left = cursor_relative_pos + "px";
            }
            
            _onChange(_grabbed_widget.opts.on_change, _hook_value);
        }
    };
    
    var _rsMouseUp = function (ev) {
        if (!_grabbed_hook_element) {
            return;
        }

        ev.preventDefault();

        var touches = ev.changedTouches,
            
            touch = null,
            
            stop_drag = false,
            
            i,

            owner_doc = _grabbed_hook_element.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;
        
        if (touches) {
            for (i = 0; i < touches.length; i += 1) {
                touch = touches[i];
                
                if (touch.identifier === _touch_identifier) {
                    stop_drag = true;
                    
                    owner_win.removeEventListener("touchend", _rsMouseUp, false);
                    owner_win.removeEventListener("touchmove", _mouseMove, false);
                    
                    break;
                }
            }
        } else {
            stop_drag = true;
            
            owner_win.removeEventListener("mouseup", _rsMouseUp, false);
            owner_win.removeEventListener("mousemove", _mouseMove, false);
        }
        
        if (stop_drag) {
            _grabbed_hook_element.classList.remove(_class_name.hook_focus);

            _grabbed_hook_element = null;
            _grabbed_widget = null;

            owner_doc.body.style.cursor = "default";
        }
    };
    
    var _rsMouseDown = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        
        var rs_element = null,
            
            drag_slider = false,
            
            touches = ev.changedTouches,

            owner_doc,
            owner_win;
        
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

            owner_doc = rs_element.ownerDocument;
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;

            owner_doc.body.style.cursor = "pointer";
            
            _mouseMove(ev);

            owner_win.addEventListener("mousemove", _mouseMove, false);
            owner_win.addEventListener("touchmove", _mouseMove, false);
            owner_win.addEventListener("mouseup",   _rsMouseUp, false);
            owner_win.addEventListener("touchend",  _rsMouseUp, false);
        }
    };
    
    var _rsDblClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        
        var hook_element = ev.target,
            
            rs_element = hook_element.parentElement.parentElement.parentElement,
        
            grabbed_widget = _widget_list[rs_element.id],
            
            value = grabbed_widget.opts.default_value;

        _update(rs_element, grabbed_widget, value);

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
        
        _update(rs_element, grabbed_widget, value);
        
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

        _update(rs_element, grabbed_widget, ev.target.value);
        
        _onChange(grabbed_widget.opts.on_change, ev.target.value);
    };
    
    var _fnConfInputChange = function (ev, widget, conf_key) {
        return function (ev) {
            var target = ev.target,
                opts = widget.opts;

            if ((target.validity) && (!target.validity.valid)) {
                return;   
            }

            if (conf_key === "min") {
                opts.min = _truncateDecimals(target.value, opts.decimals);

                widget.value_input.min = opts.min;
                
                //if (opts.min < 0) {
                    opts.range = opts.max - opts.min;
                //}
            } else if (conf_key === "max") {
                opts.max = _truncateDecimals(target.value, opts.decimals);

                widget.value_input.max = opts.max;
                
                //opts.range = opts.max;
                
                //if (opts.min < 0) {
                    opts.range = opts.max - opts.min;
                //}
            } else if (conf_key === "step") {
                opts.step = _truncateDecimals(target.value, opts.decimals);

                widget.value_input.step = opts.step;
            } else if (conf_key === "scroll_step") {
                opts.scroll_step = _truncateDecimals(target.value, opts.decimals);
            }
            
            if (opts.configurable[conf_key] !== undefined) {
                opts.configurable[conf_key].val = target.value;
            }
        };
    };
    
    var _removeMIDIControls = function (id) {
        var device,
            control,
            
            ctrl_obj,
            
            widget_id,
            
            i;
        
        if (id) {
            for(device in _midi_controls) {
                for(control in _midi_controls[device]) {
                    ctrl_obj = _midi_controls[device][control];

                    for (i = 0; i < ctrl_obj.widgets.length; i += 1) {
                        widget_id = ctrl_obj.widgets[i];

                        if (widget_id === id) {
                            ctrl_obj.widgets.splice(i, 1);

                            return;
                        }
                    }
                }
            }
        }
    };
    
    var _onMIDILearnBtnClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        
        var target = ev.target,
            rs_element = target.parentElement,
        
            widget = _widget_list[rs_element.id],
            
            opts = widget.opts,
            
            owner_doc = target.ownerDocument,
            
            detached_slider,
            
            key,
            value_obj,
            
            elems,
            
            input;
        
        if (widget.learn) {
            
            widget.learn = false;
            
            target.style = "";
            target.title = _title.midi_learn_btn;
            
            widget.learn_elem.title = _title.midi_learn_btn;
            
            _midi_learn_current = null;
            
            widget.midi.device = null;
            widget.midi.controller = null;
            
            _removeMIDIControls(rs_element.id);
            
            return;
        }
        
        for(key in _widget_list) { 
            if (_widget_list.hasOwnProperty(key)) {
                value_obj = _widget_list[key];
                
                value_obj.learn = false;
                
                detached_slider = _getDetachedElement(key);
                
                if (detached_slider) {
                    elems = detached_slider.getElementsByClassName(_class_name.midi_learn_btn);
                    if (elems.length > 0) {
                        elems[0].style = "";
                    }
                }
               
                if (value_obj.learn_elem) {
                    value_obj.learn_elem.style = "";
                }
            }
        }
        
        widget.learn = true;
        
        target.style = _midi_learn_enabled_color;
        
        _midi_learn_current = rs_element.id;
    };
    
    var _onConfigurableBtnClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        
        var target = ev.target,
            rs_element = target.parentElement,
        
            widget = _widget_list[rs_element.id],
            
            opts = widget.opts,
            
            owner_doc = target.ownerDocument,
            
            id = widget.element.id + _container_suffix_id,
            
            fn,
            btn_offset,
            key, key_value,
            configure_container,
            input_label, input_element,
            close_btn,
            i = 1;
        
        if (!document.getElementById(id)) {
            widget.configure_panel_open = false;
        }

        if (widget.configure_panel_open === true) {
            return;
        }
        
        configure_container = owner_doc.createElement("div");
        configure_container.className = "wui-rangeslider-configure-container";
        
        close_btn = owner_doc.createElement("div");
        close_btn.className = "wui-rangeslider-configure-close";
        
        fn = function (ev) {
                widget.configure_panel_open = false;
            
                var doc_cc = document.getElementById(id),
                    own_cc = ev.target.ownerDocument.getElementById(id);
                
                if (doc_cc) {
                    if (doc_cc.parentElement) {
                        doc_cc.parentElement.removeChild(doc_cc);
                    }
                }
            
                if (own_cc) {
                    if (own_cc.parentElement) {
                        own_cc.parentElement.removeChild(own_cc);
                    }
                }
            };

        close_btn.addEventListener("click", fn, false);
        close_btn.addEventListener("touchstart", fn, false);
        
        configure_container.id = id;
        
        configure_container.appendChild(close_btn);
        
        for (key in opts.configurable) {
            if (opts.configurable.hasOwnProperty(key)) {
                if (_known_configurable_options[key] !== undefined) {
                    key_value = opts.configurable[key];
                    
                    input_label = owner_doc.createElement("div");
                    input_label.style.display = "inline-block";
                    input_label.style.marginRight = "8px";
                    input_label.style.width = "80px";
                    input_label.style.textAlign = "right";
                    input_label.innerHTML = key.replace("_", " ") + " : ";
                    
                    input_element = owner_doc.createElement("input");
                    input_element.className = _class_name.value_input;

                    //input_element.style.display = "inline-block";
                    
                    configure_container.appendChild(input_label);
                    configure_container.appendChild(input_element);
                    
                    if (i%2 === 0) {
                        configure_container.appendChild(owner_doc.createElement("div"));
                    }
                    
                    input_element.setAttribute("type",  "number");
                    
                    if (key_value !== undefined) {
                        if (key_value.min !== undefined) {
                            input_element.setAttribute("min", key_value.min);
                            input_element.title = input_element.title + " min: " + key_value.min;
                        }
                        if (key_value.max !== undefined) {
                            input_element.setAttribute("max", key_value.max);
                            input_element.title = input_element.title + " max: " + key_value.max;
                        }
                        if (key_value.val !== undefined) {
                            input_element.setAttribute("value", key_value.val);
                        } else {
                            if (key === "min") {
                                input_element.setAttribute("value", opts.min);
                            } else if (key === "max") {
                                input_element.setAttribute("value", opts.max);
                            } else if (key === "step") {
                                input_element.setAttribute("value", opts.step);
                            } else if (key === "scroll_step") {
                                input_element.setAttribute("value", opts.scroll_step);
                            }
                        }
                    }
                    
                    input_element.addEventListener("input", _fnConfInputChange(ev, widget, key), false);
                    
                    i += 1;
                }
            }
        }
        
        btn_offset = _getElementOffset(target);
        
        //configure_container.style.top = btn_offset.top + "px";
        //configure_container.style.left = btn_offset.left + "px";
        
        /*owner_doc.body*/rs_element.insertBefore(configure_container, target);
        
        widget.configure_panel_open = true;
    };
    
    var _createFailed = function () {
        console.log("WUI_RangeSlider 'create' failed, first argument not an id nor a DOM element.");
    };
    
    /***********************************************************
        Public section.
        
        Functions.
    ************************************************************/

    this.create = function (id, options) {
        var range_slider,
            
            opts = {},
            
            key;

        if ((typeof id) === "string") {
            range_slider = document.getElementById(id);
        } else if ((typeof id) === "object") {
            if ((typeof id.innerHTML) !== "string") {
                _createFailed();
                
                return;
            }
            
            range_slider = id;

            id = range_slider.id;
        } else {
            _createFailed();
            
            return;
        }
        
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

                    bar: null,
                    filler: null,
                    hook: null,
                
                    endless: false,
                
                    midi: {
                        device: null,
                        controller: null,
                        
                        ctrl_type: "abs"
                    },
                
                    learn: false,
                    learn_elem: null,

                    value_input: value_input,
                  
                    default_value: opts.default_value, 
                    value: opts.value
                 };
        
        title_div.innerHTML = opts.title;
        
        value_input.setAttribute("value", opts.value);
        value_input.setAttribute("type",  "number");
        value_input.setAttribute("step",  opts.step);

        value_input.classList.add(_class_name.value_input);
        
        value_div.classList.add("wui-rangeslider-value");
        title_div.classList.add("wui-rangeslider-title");
        bar.classList.add(_class_name.bar);
        filler.classList.add(_class_name.filler);
        hook.classList.add(_class_name.hook);
        
        if (opts.vertical) {
            title_div.style.textAlign = "center";
        }

        title_div.style.minWidth = opts.title_min_width + "px";
        value_div.style.minWidth = opts.value_min_width + "px";
        value_input.style.minWidth = opts.value_min_width + "px";

        bar.style.width  = opts.width + "px";
        bar.style.height = opts.height + "px";
        
        range_slider.appendChild(title_div);
        
        if (!opts.bar) {
            bar.style.display = "none";
            
            value_input.style.marginTop = "6px";
            
            if (options["max"]) {
                value_input.setAttribute("min",   opts.min);
            }
            
            if (options["min"]) {
                value_input.setAttribute("max",   opts.max);
            }
        } else {
            value_input.setAttribute("min",   opts.min);
            value_input.setAttribute("max",   opts.max);
        }
        
        bar.appendChild(filler);
        filler.appendChild(hook);
        range_slider.appendChild(bar);

        rs.bar = bar;
        rs.filler = filler;
        rs.hook = hook;

        range_slider.appendChild(value_input);
        
        if (!options.max && !options.min) {
            rs.endless = true;
        }
        
        if (opts.configurable) {
            var configurable_opts = 0;
            for (key in opts.configurable) {
                if (opts.configurable.hasOwnProperty(key)) {
                    if (_known_configurable_options[key] !== undefined) {
                        configurable_opts += 1;
                    }
                }
            }
            
            // add configurable button
            if (configurable_opts > 0) {
                var configurable_btn_div = document.createElement("div");
                
                configurable_btn_div.classList.add("wui-rangeslider-configurable-btn");
                
                configurable_btn_div.addEventListener("click", _onConfigurableBtnClick, false);
                configurable_btn_div.addEventListener("touchstart", _onConfigurableBtnClick, false);
                
                // accomodate the slider layout for the configurable button
                if (opts.title_on_top && !opts.vertical) {
                    configurable_btn_div.style.bottom = "0";
                    title_div.style.marginBottom = "4px";
                } else if (opts.title_on_top && opts.vertical) {
                    title_div.style.marginLeft = "16px";
                    title_div.style.marginRight = "16px";
                    configurable_btn_div.style.top = "0";
                } else {
                    title_div.style.marginLeft = "16px";
                    configurable_btn_div.style.top = "0";
                }
                
                if (opts.vertical) {
                    range_slider.appendChild(configurable_btn_div);
                } else {
                    range_slider.insertBefore(configurable_btn_div, title_div);
                }
            }
        }
        
        if (opts.midi) {
            if (navigator.requestMIDIAccess) {
                var midi_learn_elem = document.createElement("div");
                midi_learn_elem.classList.add(_class_name.midi_learn_btn);
                midi_learn_elem.title = _title.midi_learn_btn;
                
                midi_learn_elem.addEventListener("click", _onMIDILearnBtnClick, false);
                midi_learn_elem.addEventListener("touchstart", _onMIDILearnBtnClick, false);
                
                rs.learn_elem = midi_learn_elem;
                
                if (opts.midi["type"]) {
                    rs.midi.ctrl_type = opts.midi.type;
                }
                
                range_slider.appendChild(midi_learn_elem);
            } else {
                console.log("WUI_RangeSlider id '" + id + "' : Web MIDI API is disabled. (not supported by your browser?)");
            }
        }

        if (opts.bar) {
            bar.addEventListener("mousedown", _rsMouseDown, false);
            bar.addEventListener("touchstart", _rsMouseDown, false);

            hook.addEventListener("dblclick", _rsDblClick, false);

            bar.addEventListener("mousewheel", _rsMouseWheel, false);
            bar.addEventListener("DOMMouseScroll", _rsMouseWheel, false);
        }
        
        value_input.addEventListener("input", _inputChange, false);
        
        _widget_list[id] = rs;

        _update(range_slider, rs, opts.value);

        return id;
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element,
            
            owner_doc,
            
            container_element;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_RangeSlider, destroying aborted.");

            return;
        }

        if (_midi_learn_current === id) {
            midi_learn_current = null;
        }
        
        _removeMIDIControls(id);
        
        element = widget.element;

        element.parentElement.removeChild(element);
        
        owner_doc = element.ownerDocument;
        
        container_element = owner_doc.getElementById(id + _container_suffix_id);
        
        if (container_element) {
            owner_doc.removeChild(container_element);
        }

        delete _widget_list[id];
    };
    
    this.getParameters = function (id) {
        var widget = _widget_list[id],
            parameters = { },
            key;
        
        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_RangeSlider, getParameters aborted.");

            return;
        }
        
        for (key in widget) {
            if (widget.hasOwnProperty(key)) {
                if (_exportable_parameters[key] !== undefined) {
                    parameters[key] = widget[key];
                }
            }
        }
        
        return parameters;
    };
    
    this.setParameters = function (id, parameters) {
        var widget = _widget_list[id],
            key;
        
        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_RangeSlider, setParameters aborted.");

            return;
        }
        
        for (key in widget) {
            if (widget.hasOwnProperty(key)) {
                if (parameters[key] !== undefined) {
                    widget[key] = parameters[key];
                }
            }
        }
        
        if (widget.midi.device) {
            if (widget.midi.controller) {
                _midi_controls["d" + widget.midi.device]["c" + widget.midi.controller].widgets.push(id);
            }
        }

        _update(widget.element, widget, widget.value);
    };
    
    this.submitMIDIMessage = function (midi_event) {
        var id = _midi_learn_current,
            
            widget,
            
            device = midi_event.data[0],
            controller = midi_event.data[1],
            value = parseInt(midi_event.data[2], 10),
            
            kdevice = "d" + device,
            kcontroller = "c" + controller,
            
            ctrl_obj,
            
            elems,
            elem,
            
            detached_slider,
            
            new_value,
            
            i = 0;
        
        if (_midi_learn_current) {
            widget = _widget_list[id];
            
            if (!_midi_controls[kdevice]) {
                _midi_controls[kdevice] = {};
            }
            
            if (!_midi_controls[kdevice][kcontroller]) {
                _midi_controls[kdevice][kcontroller] = { 
                        prev_value: value,
                        widgets: [],
                        increments: 1
                    };
            }
            
            _midi_controls[kdevice][kcontroller].widgets.push(id);
            
            detached_slider = _getDetachedElement(id);
            
            if (detached_slider) {
                elems = detached_slider.getElementsByClassName(_class_name.midi_learn_btn);
                if (elems.length > 0) {
                    elems[0].style = "";
                    elems[0].title = kdevice + " " + kcontroller;
                }
            }
            
            widget.midi.device = device;
            widget.midi.controller = controller;
            
            widget.learn = false;
            widget.learn_elem.style = "";
            widget.learn_elem.title = kdevice + " " + kcontroller;
            _midi_learn_current = null;
            
            return;
        }
        
        if (_midi_controls[kdevice]) {
            if (_midi_controls[kdevice][kcontroller]) {
                ctrl_obj = _midi_controls[kdevice][kcontroller];
                
                for (i = 0; i < ctrl_obj.widgets.length; i += 1) {
                    id = ctrl_obj.widgets[i];
                    
                    widget = _widget_list[id];
                    
                    detached_slider = _getDetachedElement(id);
                    if (detached_slider) {
                        elem = detached_slider;
                    } else {
                        elem = widget.element;
                    }
                    
                    if (widget.midi.ctrl_type === "abs") {
                        new_value = widget.opts.min + widget.opts.range * (value / 127.0);
                        
                        _update(elem, widget, new_value);
        
                        _onChange(widget.opts.on_change, new_value);
                    } else if (widget.midi.ctrl_type === "rel") {
                        if (ctrl_obj.prev_value > value) {
                            ctrl_obj.increments = -widget.opts.step;
                            
                            new_value = widget.value - widget.opts.step;
                            
                            if (new_value < widget.opts.min && !widget.endless) {
                                continue;
                            }
                            
                            ctrl_obj.prev_value = value;
                        } else if (ctrl_obj.prev_value < value) {
                            ctrl_obj.increments = widget.opts.step;
                            
                            new_value = widget.value + widget.opts.step;

                            if (new_value > widget.opts.max && !widget.endless) {
                                continue;
                            }
                            
                            ctrl_obj.prev_value = value;
                        } else {
                            new_value = widget.value + ctrl_obj.increments;
                            
                            if (!widget.endless) {
                                if (new_value > widget.opts.max) {
                                    continue;
                                } else if (new_value < widget.opts.min) {
                                    continue;
                                }
                            }
                        }
                        
                        _update(elem, widget, new_value);
        
                        _onChange(widget.opts.on_change, new_value);
                    }
                }
            }
        }
    };
})();

var WUI_Input = WUI_RangeSlider;