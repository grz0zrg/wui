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
            
            halign: "none", // 'left', 'center', 'right' or 'none'
            valign: "none", // 'top', 'center', 'bottom' or 'none'
            
            top: "0px",
            bottom: "0px",
            left: "0px",
            right: "0px",
            
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

            tmp_dialog = null;

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

                for (i = 0; i < dialog_contents.length; i += 1) {
                    var content = dialog_contents[i],

                        dialog = content.parentElement;

                    content.style.height = dialog.offsetHeight - 32 + "px";
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
            
            new_x, new_y,
            
            widget = _widget_list[_dragged_dialog.id];   
        
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
        
        if (widget.opts.halign === "right") {
            _dragged_dialog.style.right = new_x + 'px';
        } else if (widget.opts.halign === "center") {
            _dragged_dialog.style.right = -new_x + 'px';
        }
        
        if (widget.opts.valign === "bottom") {
            _dragged_dialog.style.bottom = new_y  + 'px';
        } else if (widget.opts.valign === "center") {
            _dragged_dialog.style.bottom = -new_y  + 'px';
        }
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
        
        _drag_x = x - parseInt(_dragged_dialog.style.left, 10);
        _drag_y = y - parseInt(_dragged_dialog.style.top,  10);

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

        if (opts.halign === "center") {
            dialog.style.left  = "0";
            dialog.style.right = "0";
        } else if (opts.halign === "right") {
            dialog.style.right = "0";
            dialog.style.left = "auto";
        } else if (opts.halign === "left") {
            dialog.style.left = "0";
        } else {
            dialog.style.left = opts.left;
            dialog.style.right = opts.right;
        }
        
        if (opts.valign === "center") {
            dialog.style.top    = "0";
            dialog.style.bottom = "0";
        } else if (opts.valign === "bottom") {
            dialog.style.top = "auto";
            dialog.style.bottom = "0";
        } else if (opts.valign === "top") {
            dialog.style.top = "0";
        } else {
            dialog.style.top = opts.top;
            dialog.style.bottom = opts.bottom;
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
                                bottom_pos: dialog.style.bottom,
            
                                opts: opts
                            };
        
        return id;
    };
    
    this.open = function (id) {
        var widget = _widget_list[id];

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot open WUI dialog \"" + id + "\".");
            }
            
            return;   
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

        element = widget.dialog;

        element.parentElement.removeChild(element);

        delete _widget_list[id];
    };
})();
