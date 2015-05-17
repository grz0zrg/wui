/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_Dialog = new (function() {
    /***********************************************************
        Private section.
        
        Fields.
    ************************************************************/
    
    var _widget_list = {},
        
        _dragged_dialog = null,
        
        _touch_identifier = null,
        
        _drag_x = 0,
        _drag_y = 0,
        
        _resize_timeout = null,

        _class_name = {
            dialog:        "wui-dialog",
            content:       "wui-dialog-content",
            btn:           "wui-dialog-btn",
            btn_close:     "wui-dialog-close",
            minimize:      "wui-dialog-minimize",
            maximize:      "wui-dialog-maximize",
            header:        "wui-dialog-header",
            open:          "wui-dialog-open",
            closed:        "wui-dialog-closed",
            draggable:     "wui-dialog-draggable"
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
        minimize_btn.classList.toggle(_class_name.minimize);
        minimize_btn.classList.toggle(_class_name.maximize);

        dialog.classList.toggle("wui-dialog-minimized");
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
        
        if(ev.preventDefault) {
            ev.preventDefault();
        }

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
            
            header_close_btn    = null,
            header_minimaxi_btn = null,
            header_title        = null;
            
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
        
        if (opts.resizable) {
            dialog.style.resize = "both";
        }
        
        dialog.classList.add(_class_name.dialog);
        
        content.classList.add(_class_name.content);
        
        // build the dialog header (btns and the title)
        header.className = _class_name.header;
        
        content.style.height = dialog.offsetHeight - 32 + "px";
        
        if (opts.title !== "") {
            header_title = document.createElement("div");
            
            header_title.className = "wui-dialog-title";
            header_title.innerHTML = opts.title;
            
            header.appendChild(header_title);
        }
        
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

        // go!
        dialog.insertBefore(header, content);
        
        _widget_list[id] =  {
                                dialog: dialog,
                                minimized_id: -1,

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
