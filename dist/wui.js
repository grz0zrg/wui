/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_Dialog = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _widget_list = {},

        _dragged_dialog = null,
        _resized_dialog = null,

        _touch_identifier = null,

        _drag_x = 0,
        _drag_y = 0,

        _resize_start_x = 0,
        _resize_start_y = 0,

        _resize_timeout = null,

        _class_name = {
            dialog:         "wui-dialog",
            content:        "wui-dialog-content",
            btn:            "wui-dialog-btn",
            btn_close:      "wui-dialog-close",
            minimized:      "wui-dialog-minimized",
            minimize:       "wui-dialog-minimize",
            maximize:       "wui-dialog-maximize",
            header:         "wui-dialog-header",
            open:           "wui-dialog-open",
            closed:         "wui-dialog-closed",
            draggable:      "wui-dialog-draggable",
            dim_transition: "wui-dialog-dim-transition"
        },

        _known_options = {
            title: "",

            width: "80%",
            height: "40%",

            open: true,

            closable: true,
            minimizable: false,
            draggable: false,
            resizable: false,

            min_width: "title",
            min_height: 32,

            keep_align_when_resized: false,

            halign: "left", // 'left', 'center', 'right'
            valign: "top", // 'top', 'center', 'bottom'

            top: 0,
            left: 0,

            modal: false,

            minimized: false,

            on_close: null
        };

    /***********************************************************
        Private section.

        Functions.
    ************************************************************/

    var _close = function (dialog, propagate) {
        var widget = _widget_list[dialog.id];

        if (!widget.dialog.classList.contains(_class_name.open)) {
            return;
        }

        if (widget.modal_element) {
            document.body.removeChild(widget.modal_element);
        }

        dialog.classList.add(_class_name.closed);
        dialog.classList.remove(_class_name.open);

        if (propagate) {
            if (widget.opts.on_close !== null) {
                widget.opts.on_close();
            }
        }
    };

    var _focus = function (dialog) {
        var cz_index = 0,

            tmp_dialog = null,

            widget = _widget_list[dialog.id];

        if (widget.opts.modal) {
            return;
        }

        for (var i in _widget_list) {
            if (_widget_list.hasOwnProperty(i)) {
                tmp_dialog = _widget_list[i].dialog;

                if (!isNaN(tmp_dialog.style.zIndex)) {
                    cz_index = parseInt(tmp_dialog.style.zIndex, 10);

                    if (cz_index > 100) {
                        tmp_dialog.style.zIndex = 100;
                    }
                }
            }
        }

        dialog.style.zIndex = 101;
    };

    var _computeThenSetPosition = function (dialog) {
        var widget = _widget_list[dialog.id],

            opts = widget.opts,

            parent_width = dialog.parentElement.offsetWidth,
            parent_height = dialog.parentElement.offsetHeight,

            dialog_width = dialog.offsetWidth,
            dialog_height = dialog.offsetHeight;

        if (opts.halign === "center") {
            dialog.style.left = ((parent_width - dialog_width) / 2 + opts.left) + "px";
        } else if (opts.halign === "right") {
            dialog.style.left = (parent_width - dialog_width + opts.left) + "px";
        } else {
            dialog.style.left = opts.left + "px";
        }

        if (opts.valign === "center") {
            dialog.style.top = ((parent_height - dialog_height) / 2 + opts.top) + "px";
        } else if (opts.valign === "bottom") {
            dialog.style.top = (parent_height - dialog_height + opts.top) + "px";
        } else {
            dialog.style.top = opts.top + "px";
        }
    };

    var _minimize = function (minimize_btn, dialog) {
        var widget = _widget_list[dialog.id];

        minimize_btn.classList.toggle(_class_name.minimize);
        minimize_btn.classList.toggle(_class_name.maximize);

        dialog.classList.toggle(_class_name.minimized);

        if (widget.resize_handler) {
            if (dialog.classList.contains(_class_name.minimized)) {
                widget.resize_handler.style.display = "none";
            } else {
                widget.resize_handler.style.display = "block";
            }
        }
    };

    var _onWindowResize = function () {
        if (_resize_timeout === null) {
            _resize_timeout = setTimeout(function() {
                _resize_timeout = null;

                var dialog_contents = document.getElementsByClassName(_class_name.content),

                    i;

                // resize content & set position
                for (i = 0; i < dialog_contents.length; i += 1) {
                    var content = dialog_contents[i],

                        dialog = content.parentElement;

                    content.style.height = dialog.offsetHeight - 32 + "px";

                    _computeThenSetPosition(dialog);
                }
            }, 1000 / 8);
        }
    };

    var _onClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var element = ev.target,

            dialog = null;

        if (element.classList.contains(_class_name.btn_close)) {
            dialog = element.parentElement.parentElement;

            _close(dialog, true);
        } else if (element.classList.contains(_class_name.maximize) ||
                   element.classList.contains(_class_name.minimize)) {
            dialog = element.parentElement.parentElement;

            _minimize(element, dialog);
        }
    };

    var _windowMouseMove = function (ev) {
        ev.preventDefault();

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

        _dragged_dialog.style.left = new_x + 'px';
        _dragged_dialog.style.top  = new_y + 'px';
    };

    var _windowMouseUp = function (ev) {
        var touches = ev.changedTouches,

            touch = null,

            i;

        if (touches) {
            for (i = 0; i < touches.length; i += 1) {
                touch = touches[i];

                if (touch.identifier === _touch_identifier) {
                    _dragged_dialog = null;

                    document.body.style.cursor = "default";

                    window.removeEventListener('touchmove', _windowMouseMove, false);
                    window.removeEventListener('touchmove', _windowMouseUp, false);

                    break;
                }
            }
        } else {
            _dragged_dialog = null;

            document.body.style.cursor = "default";

            window.removeEventListener('mousemove', _windowMouseMove, false);
            window.removeEventListener('mousemove', _windowMouseUp, false);
        }
    };

    var _onMouseDown = function (ev) {
        var x = ev.clientX,
            y = ev.clientY,

            left = 0,
            top = 0,

            touches = ev.changedTouches;

        ev.preventDefault();

        if (_dragged_dialog === null) {
            if (touches) {
                _touch_identifier = touches[0].identifier;

                x = touches[0].clientX;
                y = touches[0].clientY;
            } else if (ev.button !== 0) {
                return;
            }
        }

        _dragged_dialog = ev.target.parentElement;

        if (_dragged_dialog.classList.contains(_class_name.maximize) ||
           !_dragged_dialog.classList.contains(_class_name.draggable)) {
            return;
        }

        _focus(_dragged_dialog);

        document.body.style.cursor = "move";

        left = parseInt(_dragged_dialog.style.left, 10);
        top = parseInt(_dragged_dialog.style.top,  10);

        _drag_x = x - left;
        _drag_y = y - top;

        window.addEventListener('mousemove', _windowMouseMove, false);
        window.addEventListener('touchmove', _windowMouseMove, false);

        window.addEventListener('mouseup', _windowMouseUp, false);
        window.addEventListener('touchend', _windowMouseUp, false);
    };

    var _onStartResize = function (e) {
        e.preventDefault();
        e.stopPropagation();

        var dialog = e.target.parentElement,

            left = dialog.offsetLeft,
            top  = dialog.offsetTop,

            touches = e.changedTouches;

        if (touches) {
            _touch_identifier = touches[0].identifier;
        }

        _resize_start_x = left;
        _resize_start_y = top;

        dialog.classList.remove(_class_name.dim_transition);

        window.addEventListener('mousemove', _onResize, false);
        window.addEventListener('touchmove', _onResize, false);

        window.addEventListener('mouseup', _onStopResize, false);
        window.addEventListener('touchend', _onStopResize, false);

        _resized_dialog = dialog;
    };

    var _onResize = function (e) {
        e.preventDefault();

        var x = e.clientX, y = e.clientY,

            touches = e.changedTouches,

            touch = null,

            widget = _widget_list[_resized_dialog.id],

            dialog_contents = null,

            title_div = null,
            title_div_width = 0,

            i = 0,

            w, h;

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

        w = x - _resize_start_x;
        h = y - _resize_start_y;

        title_div = _resized_dialog.firstElementChild.firstElementChild.firstElementChild;

        title_div_width = title_div.offsetWidth + 108;

        if (widget.opts.min_width === "title" &&
            w < title_div_width) {
            w = title_div_width;
        } else if (w < widget.opts.min_width) {
            w = widget.opts.min_width;
        }

        if (h < widget.opts.min_height) {
            h = widget.opts.min_height;
        }

        _resized_dialog.style.width  = w + "px";

        if (!_resized_dialog.classList.contains(_class_name.minimized)) {
            _resized_dialog.style.height = h + "px";
        }

        dialog_contents = _resized_dialog.getElementsByClassName(_class_name.content);

        for (i = 0; i < dialog_contents.length; i += 1) {
            var content = dialog_contents[i];

            content.style.height = _resized_dialog.offsetHeight - 32 + "px";

            if (widget.opts.keep_align_when_resized) {
                _computeThenSetPosition(_resized_dialog);
            }
        }
    };

    var _onStopResize = function (e) {
        e.preventDefault();

        _resized_dialog.classList.add(_class_name.dim_transition);

        window.removeEventListener('mousemove', _onResize, false);
        window.removeEventListener('touchmove', _onResize, false);

        window.removeEventListener('mouseup', _onStopResize, false);
        window.removeEventListener('touchend', _onStopResize, false);

        _resized_dialog = null;
    };

    /***********************************************************
        Public section.

        Functions.
    ************************************************************/

    this.create = function (id, options) {
        var opts = {},

            key;

        if (_widget_list[id] !== undefined) {
            console.log("WUI_Dialog id '" + id + "' already created, aborting.");

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
        }

        var dialog = document.getElementById(id),

            header = document.createElement("div"),

            resize_handler = null,

            header_close_btn     = null,
            header_minimaxi_btn  = null,
            header_title         = null,
            header_title_wrapper = null;

        if (dialog === null) {
            if (typeof console !== "undefined") {
                console.log("WUI dialog create, unknow element with id \"" + id + "\".");
            }

            return;
        }

        var content = dialog.firstElementChild;

        if (content === null) {
            content = document.createElement("div");

            dialog.appendChild(content);
        }

        // set dialog style
        dialog.style.width  = opts.width;
        dialog.style.height = opts.height;

        dialog.classList.add(_class_name.dialog);

        content.classList.add(_class_name.content);

        // build the dialog header (btns and the title)
        header.className = _class_name.header;

        content.style.height = dialog.offsetHeight - 32 + "px";

        //if (opts.title !== "") {
            header_title_wrapper = document.createElement("div");
            header_title = document.createElement("div");

            header_title_wrapper.style.display = "inline-block";

            header_title.className = "wui-dialog-title";
            header_title_wrapper.innerHTML = opts.title;

            header_title.appendChild(header_title_wrapper);
            header.appendChild(header_title);
        //}

        if (opts.open) {
            dialog.classList.add(_class_name.open);
        } else {
            dialog.classList.add(_class_name.closed);
        }

        if (opts.draggable) {
            dialog.classList.toggle(_class_name.draggable);

            header.addEventListener("mousedown", _onMouseDown, false);
            header.addEventListener("touchstart", _onMouseDown, false);
        }

        if (opts.closable) {
            header_close_btn = document.createElement("div");
            header_close_btn.className = _class_name.btn + " " + _class_name.btn_close;

            header.appendChild(header_close_btn);
        }

        if (opts.minimizable) {
            header_minimaxi_btn = document.createElement("div");
            header_minimaxi_btn.className = _class_name.btn + " " + _class_name.minimize;

            if (opts.minimized) {
                _minimize(header_minimaxi_btn, dialog);
            }

            header.appendChild(header_minimaxi_btn);
        }

        dialog.addEventListener("click", _onClick, false);
        dialog.addEventListener("touchstart", _onClick, false);

        window.addEventListener("resize", _onWindowResize, false);

        dialog.classList.add("wui-dialog-transition");
        dialog.classList.add(_class_name.dim_transition);

        // go!
        dialog.insertBefore(header, content);

        if (opts.resizable) {
            resize_handler = document.createElement("div");

            resize_handler.addEventListener("mousedown", _onStartResize, false);
            resize_handler.addEventListener("touchstart", _onStartResize, false);

            resize_handler.classList.add("wui-dialog-resize");

            dialog.appendChild(resize_handler);
        }

        _widget_list[id] =  {
                                dialog: dialog,
                                minimized_id: -1,

                                resize_handler: resize_handler,

                                opts: opts,

                                modal_element: null
                            };

        _computeThenSetPosition(dialog);

        return id;
    };

    this.open = function (id) {
        var widget = _widget_list[id],

            div;

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot open WUI dialog \"" + id + "\".");
            }

            return;
        }

        if (widget.opts.modal) {
            div = document.createElement("div");

            div.className = "wui-dialog-modal";

            div.addEventListener("click", function (ev) {
                ev.preventDefault();

                _close(widget.dialog, true);
            });

            div.style.zIndex = 999999;

            widget.dialog.style.zIndex = 1000000;

            widget.modal_element = div;

            document.body.appendChild(div);
        }

        widget.dialog.classList.remove(_class_name.closed);
        widget.dialog.classList.add(_class_name.open);

        _focus(widget.dialog);
    };

    this.close = function (id, propagate) {
        var widget = _widget_list[id];

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot close WUI dialog \"" + id + "\".");
            }

            return;
        }

        _close(widget.dialog, propagate);
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_Dialog, destroying aborted.");

            return;
        }

        if (widget.modal_element) {
            document.body.removeChild(widget.modal_element);
        }

        element = widget.dialog;

        element.parentElement.removeChild(element);

        delete _widget_list[id];
    };
})();

/* jslint browser: true */
/* jshint globalstrict: false */
/* global */

var WUI_DropDown = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _widget_list = {},

        _class_name = {
            dropdown:   "wui-dropdown",
            item:       "wui-dropdown-item",
            content:    "wui-dropdown-content",
            selected:   "wui-dropdown-selected",
            open:       "wui-dropdown-open"
        },

        _known_options = {
            width: "auto",
            height: 24,

            ms_before_hiding: 2000,

            vertical: false,

            vspacing: 0,

            selected_id: 0, // default item selected

            on_item_selected: null
        };

    /***********************************************************
        Private section.

        Functions.
    ************************************************************/

    var _getElementOffset = function (elem) {
        var box = elem.getBoundingClientRect(),
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

    var _close = function (widget) {
        widget.floating_content.classList.remove(_class_name.open);

        widget.element.classList.remove("wui-dropdown-on");

        widget.close_timeout = null;
    };

    var _dd_click = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var current_element = ev.target,

            widget = null,

            floating_content = null;

        if (current_element.classList.contains(_class_name.dropdown)) {
            widget = _widget_list[current_element.id];

            floating_content = widget.floating_content;

            if (widget.floating_content.classList.contains(_class_name.open)) {
                _close(widget);
            }
        } else {
            return;
        }
    };

    var _item_click = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var current_element = ev.target,

            widget = _widget_list[current_element.id],

            floating_content = null,

            floating_content_childs = null,

            i;

        if (current_element.classList.contains(_class_name.item)) {
            floating_content = current_element.parentElement;

            widget = _widget_list[floating_content.dataset.linkedto];
        } else {
            return;
        }

        floating_content_childs = floating_content.getElementsByTagName('div');

        for (i = 0; i < floating_content_childs.length; i += 1) {
            floating_content_childs[i].classList.remove(_class_name.selected);
        }

        current_element.classList.add(_class_name.selected);

        widget.button_item.innerHTML = current_element.textContent;

        if (widget.opts.on_item_selected !== undefined) {
            widget.opts.on_item_selected(current_element.dataset.index);
        }
    };

    var _mouseOver = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var current_element = ev.target,

            widget = null,

            offset = null,

            floating_content = null;

        if (current_element.classList.contains(_class_name.dropdown)) {
            widget = _widget_list[current_element.id];

            widget.element.classList.add("wui-dropdown-on");

            floating_content = widget.floating_content;

            offset = _getElementOffset(current_element);

            floating_content.style.top = (offset.top - floating_content.offsetHeight - widget.opts.vspacing) + "px";
            floating_content.style.left = offset.left + "px";

            floating_content.classList.add(_class_name.open);
        } else if ( current_element.classList.contains(_class_name.content)) {
            widget = _widget_list[current_element.dataset.linkedto];
        } else if ( current_element.classList.contains(_class_name.item)) {
            widget = _widget_list[current_element.parentElement.dataset.linkedto];
        } else {
            return;
        }

        window.clearTimeout(widget.close_timeout);

        current_element.addEventListener("mouseleave", _mouseLeave, false);
    };

    var _mouseLeave = function (ev) {
        ev.preventDefault();

        var current_element = ev.target,

            widget = null;

        if ( current_element.classList.contains(_class_name.content)) {
            widget = _widget_list[current_element.dataset.linkedto];
        } else if ( current_element.classList.contains(_class_name.item)) {
            widget = _widget_list[current_element.parentElement.dataset.linkedto];
        } else {
            widget = _widget_list[current_element.id];
        }

        widget.close_timeout = window.setTimeout(_close, widget.opts.ms_before_hiding, widget);

        current_element.removeEventListener("mouseleave", _mouseLeave, false);
    };

    /***********************************************************
        Public section.

        Functions.
    ************************************************************/

    this.create = function (id, options, content_array) {
        var dropdown = document.getElementById(id),

            div_item = null,

            item = "",

            items = [],

            opts = {},

            key,

            i = 0;

        if (_widget_list[id] !== undefined) {
            console.log("WUI_DropDown id '" + id + "' already created, aborting.");

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
        }

        dropdown.classList.add(_class_name.dropdown);

        dropdown.style.width = opts.width;
        dropdown.style.height = opts.height;

        var div_icon = document.createElement("div");
        div_icon.classList.add("wui-dropdown-icon");

        dropdown.appendChild(div_icon);

        var div_button = document.createElement("div");
        div_button.classList.add("wui-dropdown-text");

        if (content_array.length !== 0) {
            div_button.innerHTML = content_array[opts.selected_id];
        }

        dropdown.appendChild(div_button);

        var floating_content = document.createElement("div");

        dropdown.addEventListener("click", _dd_click, false);

        for (i = 0; i < content_array.length; i += 1) {
            item = content_array[i];

            div_item = document.createElement("div");

            if (!opts.vertical) {
                div_item.classList.add("wui-dropdown-horizontal");
            }

            div_item.classList.add(_class_name.item);

            div_item.innerHTML = item;

            div_item.dataset.index = i;

            floating_content.appendChild(div_item);

            items.push(div_item);

            div_item.addEventListener("click", _item_click, false);

            if (item === content_array[opts.selected_id]) {
                div_item.classList.add(_class_name.selected);
            }
        }

        dropdown.addEventListener("mouseover", _mouseOver, false);
        floating_content.addEventListener("mouseover", _mouseOver, false);

        floating_content.classList.add(_class_name.content);

        floating_content.dataset.linkedto = id;

        document.body.appendChild(floating_content);

        var dd = {
            element: dropdown,

            floating_content: floating_content,
            items: items,

            opts: opts,

            button_item: div_button,

            hover_count: 0,

            close_timeout: null
        };

        _widget_list[id] = dd;

        return id;
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element,
            floating_element;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_DropDown, destroying aborted.");

            return;
        }

        element = widget.element;
        floating_element = widget.floating_content;

        element.parentElement.removeChild(element);
        floating_element.parentElement.removeChild(floating_element);

        delete _widget_list[id];
    };
})();

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

        if (opts.vertical) {
            title_div.style.textAlign = "center";
        }

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

        return id;
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

/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_Tabs = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _widget_list = {},

        _class_name = {
            enabled:      "wui-tab-enabled",
            disabled:     "wui-tab-disabled",
            display_none: "wui-tab-display-none",
            tabs:         "wui-tabs",
            tab:          "wui-tab",
            tabs_content: "wui-tabs-content",
            tab_content:  "wui-tab-content",
            underline:    "wui-tabs-underline"
        },

        _known_options = {
            on_tab_click: null,

            height: "100%"
        };

    /***********************************************************
        Private section.

        Functions.
    ************************************************************/

    var _onTabClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var tab_elem = ev.target,

            tabs = tab_elem.parentElement,
            content = tabs.nextElementSibling.nextElementSibling,

            widget_id = tabs.parentElement.id,

            tab_index = 0,
            elem = null,

            i = 0;

        for (i = 0; i < tabs.childElementCount; i += 1) {
            elem = tabs.children[i];

            elem.classList.remove(_class_name.enabled);
            elem.classList.add(_class_name.disabled);

            if (elem === tab_elem) {
                tab_index = i;
            }
        }

        for (i = 0; i < content.childElementCount; i += 1) {
            elem = content.children[i];

            elem.classList.remove(_class_name.display_none);

            if (tab_index !== i) {
                elem.classList.add(_class_name.display_none);
            }
        }

        ev.target.classList.remove(_class_name.disabled);
        ev.target.classList.toggle(_class_name.enabled);

        if (_widget_list[widget_id].opts.on_tab_click) {
            _widget_list[widget_id].opts.on_tab_click(tab_index);
        }
    };

    /***********************************************************
        Public section.

        Functions.
    ************************************************************/

    /**
     * Create a tabs widget from an element.
     * @param {String}   id       DOM Element id
     * @param {Function} tab_click_callback Called when a tab is clicked
     */
    this.create = function (id, options) {
        var element = document.getElementById(id),

            tabs      = element.firstElementChild,
            underline = document.createElement("div"),
            content   = tabs.nextElementSibling,

            first_tab = tabs.children[0],

            opts = {},

            key,

            i = 0;

        if (_widget_list[id] !== undefined) {
            console.log("WUI_Tabs id '" + id + "' already created, aborting.");

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
        }

        underline.className = "wui-tabs-underline";

        element.insertBefore(underline, content);

        // style tabs
        tabs.classList.add(_class_name.tabs);

        var tab_count = tabs.childElementCount;

        for (i = 0; i < tab_count; i += 1) {
            var tab = tabs.children[i];

            tab.classList.add("wui-tab");

            if (tab !== first_tab) {
                tab.classList.add(_class_name.disabled);
            }

            tab.addEventListener("click", _onTabClick, false);
            tab.addEventListener("touchstart", _onTabClick, false);
        }

        first_tab.classList.add(_class_name.enabled);
        first_tab.classList.add("wui-first-tab");

        // style tabs content
        content.classList.add("wui-tabs-content");

        var tab_content_count = content.childElementCount;

        content.style.height = opts.height;

        content.children[0].classList.add(_class_name.tab_content);

        for (i = 1; i < tab_content_count; i += 1) {
            var tab_content = content.children[i];

            tab_content.classList.add(_class_name.tab_content);
            tab_content.classList.add(_class_name.display_none);
        }

        _widget_list[id] = { element: element, opts : opts };

        return id;
    };

    /**
     * Get tab content element from a widget id and tab id
     * @param   {String} id     Widget id
     * @param   {Number} tab_id Tab id
     * @returns {Object} DOM Element of the tab content
     */
    this.getContentElement = function (id, tab_id) {
        var element = document.getElementById(id);
        var content = element.firstElementChild.nextElementSibling.nextElementSibling;

        return content.children[tab_id];
    };

    /**
     * Get a tab name from a widget id and tab id
     * @param   {String} id     Widget id
     * @param   {Number} tab_id Tab id
     * @returns {String} Tab name
     */

    this.getTabName = function (id, tab_id) {
        var content = this.getContentElement(id, tab_id);

        return content.getAttribute("data-group-name");
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element,

            tabs, tabs_underline, tabs_content,

            i;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_Tabs, destroying aborted.");

            return;
        }

        element = widget.element;

        // make it compatible with WUI_Dialog, it shouldn't remove the WUI_Dialog content div...
        if (!element.classList.contains("wui-dialog-content")) {
            element.parentElement.removeChild(element);
        } else {
            tabs = element.getElementsByClassName(_class_name.tabs);
            tabs_underline = element.getElementsByClassName(_class_name.underline);
            tabs_content = element.getElementsByClassName(_class_name.tabs_content);

            for (i = 0; i < tabs.length; i += 1) {
                element.removeChild(tabs[i]);
                element.removeChild(tabs_underline[i]);
                element.removeChild(tabs_content[i]);
            }
        }

        delete _widget_list[id];
    };
})();

/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_ToolBar = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _widget_list = {},

        _class_name = {
            minimize_icon:  "wui-toolbar-minimize-icon",
            maximize_icon:  "wui-toolbar-maximize-icon",
            button:         "wui-toolbar-button",
            minimize_group: "wui-toolbar-minimize-group",
            minimize_gr_v:  "wui-toolbar-minimize-group-vertical",
            toggle:         "wui-toolbar-toggle",
            toggle_on:      "wui-toolbar-toggle-on",
            item:           "wui-toolbar-item",
            group:          "wui-toolbar-group",
            vertical_group: "wui-toolbar-group-vertical",
            tb:             "wui-toolbar",

            // dropdown
            dd_content:     "wui-toolbar-dropdown-content",
            dd_item:        "wui-toolbar-dropdown-item",
            dd_open:        "wui-toolbar-dropdown-open"
        },

        _known_options = {
            item_hmargin: null,
            item_vmargin: null,

            item_width: 32,
            item_height: 32,

            icon_width: 32,
            icon_height: 32,

            allow_groups_minimize: false,

            vertical: false
        };

    /***********************************************************
        Private section.

        Functions.
    ************************************************************/

    var _getWidget = function (toolbar_id) {
        var widget = _widget_list[toolbar_id];

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("_getWidget failed, the element id \"" + toolbar_id + "\" is not a WUI_ToolBar.");
            }

            return null;
        }

        return widget;
    };

    var _getElementOffset = function (elem) {
        var box = elem.getBoundingClientRect(),
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

    var _getWidgetFromElement = function (element, toolbar_id) {
        if (toolbar_id !== undefined) {
            return _widget_list[toolbar_id];
        } else if (element.classList.contains(_class_name.tb)) {
            return _widget_list[element.id];
        } else if (element.classList.contains(_class_name.minimize_icon) ||
                   element.classList.contains(_class_name.maximize_icon) ||
                   element.classList.contains(_class_name.vertical_group)||
                   element.classList.contains(_class_name.group)) {
            return _widget_list[element.parentElement.id];
        } else {
            return _widget_list[element.parentElement.parentElement.id];
        }
    };

    var _propagate = function (tool, type, state) {
        if (tool.on_click !== undefined &&
            tool.on_click !== null) {
            var o = {
                id: tool.id,
                type: type
            };

            if (state !== undefined) {
                o.state = state;
            }

            tool.on_click(o);
        }
    };

    var _toggle = function (element, toolbar_id, propagate) {
        var widget = null,

            state = false,

            toggle_group,

            i = 0;

        widget = _getWidgetFromElement(element, toolbar_id);

        var my_tool = widget.tools[element.dataset.tool_id];

        if (my_tool.element.dataset.on === "1") {
            my_tool.element.dataset.on = 0;

            my_tool.element.title = my_tool.tooltip;

            if (my_tool.icon !== undefined) {
                my_tool.element.classList.add(my_tool.icon);
                my_tool.element.classList.remove(my_tool.toggled_icon);
            }
        } else {
            my_tool.element.dataset.on = 1;

            if (my_tool.tooltip_toggled !== undefined) {
                my_tool.element.title = my_tool.tooltip_toggled;
            }

            if (my_tool.toggled_icon !== undefined) {
                my_tool.element.classList.add(my_tool.toggled_icon);
                my_tool.element.classList.remove(my_tool.icon);
            }

            state = true;
        }

        if (my_tool.toggled_style !== "none") {
            my_tool.element.classList.toggle(_class_name.toggle_on);
        }

        toggle_group = element.dataset.toggle_group;

        if (toggle_group !== undefined) {
            for (i = 0; i < widget.tools.length; i += 1) {
                var tool = widget.tools[i];

                if (toggle_group === tool.element.dataset.toggle_group &&
                    tool.element !== element) {

                    if (tool.element.dataset.on === "0") {
                        continue;
                    }

                    tool.element.dataset.on = "0";

                    tool.element.classList.remove(_class_name.toggle_on);

                    if (tool.toggled_icon !== undefined) {
                        tool.element.classList.remove(tool.toggled_icon);
                    }

                    if (tool.icon !== undefined) {
                        tool.element.classList.add(tool.icon);
                    }

                    if (propagate || propagate === undefined) {
                        _propagate(tool, "toggle", false);
                    }
                }
            }
        }

        if (propagate === true || propagate === undefined) {
            _propagate(my_tool, "toggle", state);
        }
    };

    var _ddItemClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var item_element = ev.target,

            dropdown_content = item_element.parentElement,

            widget = _widget_list[dropdown_content.dataset.linkedto_tb],

            my_tool = widget.tools[parseInt(dropdown_content.dataset.linkedto_tool_index, 10)],

            item_index = parseInt(item_element.dataset.index, 10),

            item = my_tool.items[item_index];

        if (item.on_click !== undefined) {
            item.on_click();

            my_tool.element.classList.remove(_class_name.toggle_on);

            dropdown_content.classList.remove(_class_name.dd_open);
        }
    };

    var _hideDdFloatingContent = function (my_tool, dropdown_floating_content) {
        dropdown_floating_content.classList.remove(_class_name.dd_open);

        my_tool.element.classList.remove(_class_name.toggle_on);
    };

    var _hideDdFloatingContentHandler = function (my_tool, dropdown_floating_content) {
        var handler = function () {
            _hideDdFloatingContent(my_tool, dropdown_floating_content);

            window.removeEventListener('click', handler);
        };

        return handler;
    };

    var _onClick = function (ev) {
        ev.preventDefault();

        var element = ev.target;

        // delegation
        if (element.classList.contains(_class_name.minimize_group) ||
            element.classList.contains(_class_name.minimize_gr_v)) {
            _minimizeGroup(element);

            return;
        } else if (element.classList.contains(_class_name.toggle)) {
            _toggle(element);

            return;
        } else if (element.classList.contains(_class_name.tb) ||
                   element.classList.contains(_class_name.group) ||
                   element.classList.contains(_class_name.vertical_group)) {
            return;
        }

        // else, regular button

        var my_tool = null,

            dropdown_floating_content = null,

            offset = null,

            widget = null;

        widget = _getWidgetFromElement(element);

        my_tool = widget.tools[element.dataset.tool_id];

        if (my_tool.type === "dropdown") {
            dropdown_floating_content = my_tool.floating_content;

            if (element.classList.contains(_class_name.toggle_on)) {
                _hideDdFloatingContent(my_tool, dropdown_floating_content);

                return;
            }

            var tool_element = my_tool.element;

            tool_element.classList.add(_class_name.toggle_on);

            offset = _getElementOffset(element);

            if (my_tool.dd_items_width === "tb_item") {
                dropdown_floating_content.style.width = element.offsetWidth + "px";
            }

            if (my_tool.orientation === "s") {
                dropdown_floating_content.style.top  = (offset.top + element.offsetHeight) + "px";
                dropdown_floating_content.style.left = offset.left + "px";
            } else if (my_tool.orientation === "sw") {
                dropdown_floating_content.style.top  = (offset.top + element.offsetHeight) + "px";
                dropdown_floating_content.style.left = (offset.left - dropdown_floating_content.offsetWidth) + "px";
            } else if (my_tool.orientation === "nw") {
                dropdown_floating_content.style.top  = (offset.top - dropdown_floating_content.offsetHeight + element.offsetHeight) + "px";
                dropdown_floating_content.style.left = (offset.left - dropdown_floating_content.offsetWidth) + "px";
            } else if (my_tool.orientation === "se") {
                dropdown_floating_content.style.top  = (offset.top + element.offsetHeight) + "px";
                dropdown_floating_content.style.left = (offset.left + element.offsetWidth) + "px";
            } else if (my_tool.orientation === "ne") {
                dropdown_floating_content.style.top  = (offset.top - dropdown_floating_content.offsetHeight + element.offsetHeight) + "px";
                dropdown_floating_content.style.left = (offset.left + element.offsetWidth) + "px";
            } else { // n
                dropdown_floating_content.style.top  = (offset.top - dropdown_floating_content.offsetHeight) + "px";
                dropdown_floating_content.style.left = offset.left + "px";
            }

            dropdown_floating_content.classList.add(_class_name.dd_open);

            if(ev.stopPropagation) {
                ev.stopPropagation();
            }

            window.addEventListener("click", _hideDdFloatingContentHandler(my_tool, dropdown_floating_content), false);
        } else {
            _propagate(my_tool, "click");
        }
    };

    var _minimizeGroup = function (minimize_element) {
        var group = minimize_element.nextSibling;

        if (minimize_element.classList.contains(_class_name.minimize_icon)) {
            minimize_element.classList.add(_class_name.maximize_icon);
            minimize_element.classList.remove(_class_name.minimize_icon);

            minimize_element.title = "Maximize group";

            group.style.display = "none";
        } else {
            minimize_element.classList.add(_class_name.minimize_icon);
            minimize_element.classList.remove(_class_name.maximize_icon);

            minimize_element.title = "Minimize group";

            group.style.display = "";
        }
    };

    /***********************************************************
        Public section.

        Functions.
    ************************************************************/

    /**
     * Create a toolbar widget from an element.
     *
     * @param   {String} id      DOM Element id
     * @param   {Array}    tools   [[Description]]
     * @param   {Object}   options [[Description]]
     * @returns {String} Created widget reference, internally used to recognize the widget
     */
    this.create = function (id, tools, options) {
        var toolbar = document.getElementById(id),

            group = null,
            elem = null,

            index = null,

            previous_group = null,

            opts = {},

            key;

        if (_widget_list[id] !== undefined) {
            console.log("WUI_Toolbar id '" + id + "' already created, aborting.");

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
        }

        // build up the toolbar widget internal data structure
        _widget_list[id] = {
            element: toolbar,

            tools: [],
            opts: opts
        };

        // build the toolbar and its items
        toolbar.classList.add(_class_name.tb);

        var group_class = _class_name.group,
            item_class = _class_name.item,
            spacer_class = "wui-toolbar-spacer",
            group_minimize_class = _class_name.minimize_group;

        if (opts.vertical) {
            toolbar.classList.add("wui-toolbar-vertical");

            group_class = _class_name.vertical_group;
            item_class += " wui-toolbar-item-vertical";
            spacer_class = "wui-toolbar-spacer-vertical";
            group_minimize_class = _class_name.minimize_gr_v;

            toolbar.style.maxWidth = (opts.item_width + 4) + "px";

            if (opts.item_hmargin === null) {
                opts.item_hmargin = 3;
            }

            if (opts.item_vmargin === null) {
                opts.item_vmargin = 8;
            }
        } else {
            toolbar.style.maxHeight = (opts.item_height + 4) + "px";

            if (opts.item_hmargin === null) {
                opts.item_hmargin = 3;
            }

            if (opts.item_vmargin === null) {
                opts.item_vmargin = 0;
            }
        }

        group_minimize_class = _class_name.button + " " + _class_name.minimize_icon + " " + group_minimize_class;

        toolbar.addEventListener("click", _onClick, false);

        for(index in tools) {
            if (tools.hasOwnProperty(index)) {
                if (previous_group !== null) {
                    elem = document.createElement("div");
                    elem.className = spacer_class;

                    toolbar.appendChild(elem);
                }

                if (opts.allow_groups_minimize) {
                    elem = document.createElement("div");
                    elem.className = group_minimize_class;

                    elem.title = "Minimize group";

                    toolbar.appendChild(elem);
                }

                group = tools[index];

                var group_element = document.createElement("div");
                group_element.className = group_class;

                if (opts.vertical) {
                    group_element.style.maxWidth = opts.item_width + "px";
                } else {
                    group_element.style.maxHeight = opts.item_height + "px";
                }

                for (var i = 0; i < group.length; i += 1) {
                    var tool = group[i],
                        tool_element = document.createElement("div"),

                        tool_id = _widget_list[id].tools.length,

                        widget = {
                            element: tool_element,
                            on_click: tool.on_click,
                            icon: tool.icon,
                            items: [],
                            tooltip: "",
                            type: tool.type,
                            dd_items_width: tool.dropdown_items_width,
                            orientation: tool.orientation,
                            id: tool_id
                        },

                        j;

                    tool_element.className = item_class;

                    tool_element.style.minWidth     = opts.item_width   + "px";
                    tool_element.style.minHeight    = opts.item_height  + "px";
                    tool_element.style.marginLeft   = opts.item_hmargin + "px";
                    tool_element.style.marginRight  = opts.item_hmargin + "px";
                    tool_element.style.marginTop    = opts.item_vmargin + "px";
                    tool_element.style.marginBottom = opts.item_vmargin + "px";

                    tool_element.style.backgroundSize = (opts.icon_width - 4) + "px " + (opts.icon_height - 4) + "px";

                    group_element.appendChild(tool_element);

                    _widget_list[id].tools.push(widget);

                    tool_element.dataset.tool_id = tool_id;

                    widget.tooltip = tool.tooltip;

                    if (tool.tooltip !== undefined) {
                        tool_element.title = tool.tooltip;
                    }

                    if (tool.text !== undefined) {
                        tool_element.innerHTML = tool.text;

                        tool_element.style.lineHeight = opts.item_height + "px";

                        tool_element.classList.add("wui-toolbar-text");

                        if (tool.icon !== undefined) {
                            tool_element.style.paddingLeft = (opts.icon_width + 2) + "px";
                            tool_element.style.backgroundPosition = "left center";
                        }
                    }

                    if (tool.icon !== undefined) {
                        tool_element.classList.add(tool.icon);
                    }

                    // handle button type
                    if (tool.type === "toggle") {
                        tool_element.classList.add(_class_name.toggle);

                        widget.toggled_icon = tool.toggled_icon;
                        widget.tooltip_toggled = tool.tooltip_toggled;
                        widget.toggled_style = tool.toggled_style;

                        if (tool.toggle_group !== undefined) {
                            tool_element.dataset.toggle_group = tool.toggle_group;
                        }

                        if (tool.toggle_state) {
                            tool_element.dataset.on = "0";

                            _toggle(tool_element, id, true);
                        }
                    } else if (tool.type === "dropdown") {
                        tool_element.classList.add(_class_name.button);

                        var dropdown_floating_content = document.createElement("div");

                        if (tool.items !== undefined) {
                            for (j = 0; j < tool.items.length; j += 1) {
                                var item = tool.items[j];

                                var div_item = document.createElement("div");

                                if (!tool.vertical) {
                                    div_item.classList.add("wui-toolbar-dropdown-horizontal");
                                }

                                div_item.classList.add(_class_name.dd_item);

                                div_item.innerHTML = item.title;

                                div_item.dataset.index = j;

                                dropdown_floating_content.appendChild(div_item);

                                widget.items.push({ element: div_item, on_click: item.on_click});
                            }
                        }

                        dropdown_floating_content.addEventListener("click", _ddItemClick, false);

                        widget.floating_content = dropdown_floating_content;

                        dropdown_floating_content.style.width = widget.dd_items_width + "px";

                        dropdown_floating_content.classList.add(_class_name.dd_content);

                        dropdown_floating_content.dataset.linkedto_tb = id;
                        dropdown_floating_content.dataset.linkedto_tool_index = tool_id;

                        document.body.appendChild(dropdown_floating_content);
                    } else { // default to standard button
                        tool_element.classList.add(_class_name.button);
                    }
                }

                toolbar.appendChild(group_element);

                previous_group = group;
           }
        }

        return id;
    };

    this.hideGroup = function (toolbar_id, group_index) {
        var widget = _getWidget(toolbar_id),

            groups, group, minimize_group;

        if (widget) {
            if (widget.opts.vertical) {
                groups = widget.element.getElementsByClassName(_class_name.vertical_group);
            } else {
                groups = widget.element.getElementsByClassName(_class_name.group);
            }

            if (groups.length === 0) {
                return;
            }

            group = groups[group_index];

            minimize_group = group.previousElementSibling;

            if (minimize_group.classList.contains(_class_name.minimize_group) ||
                minimize_group.classList.contains(_class_name.minimize_gr_v)) {
                minimize_group.style.display = "none";
            }

            group.style.display = "none";
        }
    };

    this.showGroup = function (toolbar_id, group_index) {
        var widget = _getWidget(toolbar_id),

            groups, group, minimize_group;

        if (widget) {
            if (widget.opts.vertical) {
                groups = widget.element.getElementsByClassName(_class_name.vertical_group);
            } else {
                groups = widget.element.getElementsByClassName(_class_name.group);
            }

            if (groups.length === 0) {
                return;
            }

            group = groups[group_index];

            minimize_group = group.previousElementSibling;

            if (minimize_group.classList.contains(_class_name.minimize_group) ||
                minimize_group.classList.contains(_class_name.minimize_gr_v)) {
                minimize_group.style.display = "";
            }

            groups[group_index].style.display = "";
        }
    };

    this.toggle = function (toolbar_id, tool_index, propagate) {
        var widget = _getWidget(toolbar_id);

        if (widget) {
            _toggle(widget.tools[tool_index].element, toolbar_id, propagate);
        }
    };

    this.getItemElement = function (toolbar_id, tool_index) {
        var widget = _getWidget(toolbar_id);

        if (widget) {
            return widget.tools[tool_index].element;
        }
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element,

            tools, tool, tool_items, first_item, first_item_element,

            i;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_ToolBar, destroying aborted.");

            return;
        }

        element = widget.toolbar;

        tools = widget.tools;

        element.parentElement.removeChild(element);

        // destroy any related content as well (like the floating element created by a dropdown tool)
        for (i = 0; i < tools.length; i += 1) {
            tool = tools[i];

            if (tool.type === "dropdown") {
                tool_items = tool.items;

                if (tool_items.length > 0) {
                    first_item = tool_items[0];

                    first_item_element = first_item.element;

                    first_item_element.parentElement.removeChild(first_item_element);
                }
            }
        }

        delete _widget_list[id];
    };
})();

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