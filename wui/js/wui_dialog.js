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
        
        _class_name = {
            btn:           "wui-dialog-btn",
            btn_close:     "wui-dialog-close",
            minimize:      "wui-dialog-minimize",
            maximize:      "wui-dialog-maximize",
            header:        "wui-dialog-header",
            open:          "wui-dialog-open",
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
            
            halign: "none", // 'left', 'center', 'right' or 'none'
            valign: "none", // 'top', 'center', 'bottom' or 'none'
            
            top: "0px",
            bottom: "0px",
            left: "0px",
            right: "0px",
            
            use_event_listener: true
        };
    
    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
    var _onCloseBtnClick = function (ev) {
        var dialog = ev.target.parentElement.parentElement;
        
        dialog.classList.remove(_class_name.open);
    };
    
    var _onMinimaxiBtnClick = function (ev) {
        var btn = ev.target,
            
            dialog = ev.target.parentElement.parentElement;

        btn.classList.toggle(_class_name.minimize);
        btn.classList.toggle(_class_name.maximize);

        dialog.classList.toggle("wui-dialog-minimized");
    };
    
    var _windowMouseMove = function (ev) {
        if(ev.preventDefault) {
            ev.preventDefault();
        }
        
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
                    
                    break;
                }
            }
        } else {
            _dragged_dialog = null;
            
            document.body.style.cursor = "default";
            
            window.removeEventListener('mousemove', _windowMouseMove, false);
        }
    };
    
    var _onMouseDown = function (ev) {
        var z_index = 100,
            
            cz_index = 0,
            
            dialog = null,
            
            x = ev.clientX,
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
        
        for (var i in _widget_list) {
            if (_widget_list.hasOwnProperty(i)) {
                dialog = _widget_list[i].dialog;
                
                if (!isNaN(dialog.style.zIndex)) {
                    cz_index = parseInt(dialog.style.zIndex, 10);

                    if (cz_index > z_index) {
                        z_index = cz_index; 
                    }
                    
                    if (cz_index > 100000) { // guess 100000 dialogs is safe
                        cz_index -= 100000;
                    }
                }
            }
        }
        
        _dragged_dialog.style.zIndex = z_index + 1;
        
        document.body.style.cursor = "move";
        
        _drag_x = x - parseInt(_dragged_dialog.style.left, 10);
        _drag_y = y - parseInt(_dragged_dialog.style.top,  10);

        window.addEventListener('mousemove', _windowMouseMove, false);
        window.addEventListener('touchmove', _windowMouseMove, false);
    };
    
    /***********************************************************
        Public section.
        
        Functions.
    ************************************************************/
    
    /**
     * Trigger an event manually.
     */
    this.triggerEvent = function (event, type) {
        var element = event.target,
            
            e_type = event.type;
        
        if (type !== undefined) {
            e_type = type;
        }

        if (e_type === "click") {
            if (element.classList.contains(_class_name.btn_close)) {
                _onCloseBtnClick(event);
                
                return true;
            } else if (element.classList.contains(_class_name.minimize) ||
                element.classList.contains(_class_name.maximize)) {
                _onMinimaxiBtnClick(event);
                
                return true;
            }
        } else if (e_type === "mousedown") {
            if (element.classList.contains(_class_name.header)) {
                _onMouseDown(event);
                
                return true;
            }
        }
        
        return false;
    };
    
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
        
        dialog.classList.add("wui-dialog");
        
        content.classList.add("wui-dialog-content");
        
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
        }

        if (opts.draggable) {
            dialog.classList.toggle(_class_name.draggable);

            if (opts.use_event_listener) {
                header.addEventListener("mousedown", _onMouseDown, false);
                header.addEventListener("touchstart", _onMouseDown, false);
            }

            // exception for this one
            window.addEventListener('mouseup', _windowMouseUp, false);
            window.addEventListener('touchend', _windowMouseUp, false);
        }

        if (opts.closable) {
            header_close_btn = document.createElement("div"); 
            header_close_btn.className = _class_name.btn + " " + _class_name.btn_close;
            
            if (opts.use_event_listener) {
                header_close_btn.addEventListener("click", _onCloseBtnClick, false);
                header_close_btn.addEventListener("touchstart", _onCloseBtnClick, false);
            }
            
            header.appendChild(header_close_btn);
        }
        
        if (opts.minimizable) {
            header_minimaxi_btn = document.createElement("div");
            header_minimaxi_btn.className = _class_name.btn + " " + _class_name.minimize;
            
            if (opts.use_event_listener) {
                header_minimaxi_btn.addEventListener("click", _onMinimaxiBtnClick, false);
                header_close_btn.addEventListener("touchstart", _onMinimaxiBtnClick, false);
            }
            
            header.appendChild(header_minimaxi_btn);
        }

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
        if (_widget_list[id] === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot open WUI dialog \"" + id + "\".");
            }
            
            return;   
        }
        
        _widget_list[id].dialog.classList.add(_class_name.open);
    };
})();
