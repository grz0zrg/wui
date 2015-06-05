/* jslint browser: true */

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

        _detached_windows = [],

        _class_name = {
            dialog:         "wui-dialog",
            content:        "wui-dialog-content",
            btn:            "wui-dialog-btn",
            btn_close:      "wui-dialog-close",
            detach:         "wui-dialog-detach",
            minimized:      "wui-dialog-minimized",
            minimize:       "wui-dialog-minimize",
            maximize:       "wui-dialog-maximize",
            header:         "wui-dialog-header",
            open:           "wui-dialog-open",
            closed:         "wui-dialog-closed",
            draggable:      "wui-dialog-draggable",
            transition:     "wui-dialog-transition",
            dim_transition: "wui-dialog-dim-transition",
            modal:          "wui-dialog-modal",
            status_bar:     "wui-dialog-status-bar"
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
            detachable: false,
            
            min_width: "title",
            min_height: 32,

            status_bar: false,
            status_bar_content: "",

            keep_align_when_resized: false,

            halign: "left", // 'left', 'center', 'right'
            valign: "top", // 'top', 'center', 'bottom'
            
            top: 0,
            left: 0,

            modal: false,
            
            minimized: false,

            on_close: null,
            on_detach: null,
            on_resize: null
        };
    
    /***********************************************************
        Private section.
        
        Initialization.
    ************************************************************/

    // this keep track of event listeners... globally
    // a tricky solution but the only one i know of until a standard pop up or someone have a better solution
    if (!Element.prototype['_addEventListener']) {
        Element.prototype._addEventListener = Element.prototype.addEventListener;
        Element.prototype.addEventListener = function(a, b, c) {
            this._addEventListener(a, b, c);
            if (!this['eventListenerList']) {
                this['eventListenerList'] = {};
            }

            if(!this.eventListenerList[a]) {
                this.eventListenerList[a] = [];
            }
            this.eventListenerList[a].push(b);
        };
        Element.prototype._removeEventListener = Element.prototype.removeEventListener;
        Element.prototype.removeEventListener = function(a, b, c) {
            if (this['eventListenerList']) {
                var events = this.eventListenerList[a], i;
                if(events) {
                    for (i = 0; i < events.length; i += 1) {
                        if (events[i] === b) {
                            events.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            this._removeEventListener(a, b, c);
        };
    }

    /***********************************************************
        Private section.

        Functions.
    ************************************************************/
    
    var _removeDetachedWindow = function (widget) {
        for (var i = 0; i < _detached_windows.length; i += 1) {
            if (_detached_windows[i] === widget.detachable_ref) {
                _detached_windows.splice(i, 1);
                break;
            }
        }
    };

    var _close = function (dialog, detach, propagate, remove_modal_element) {
        var widget = _widget_list[dialog.id], modal_elems, i, j, w;

        if (!widget) {
            return;
        }

        if (detach) {
            if(widget.detachable_ref) {
                if (!widget.detachable_ref.closed) {
                    widget.detachable_ref.close();
                }

                _removeDetachedWindow(widget);
            }
        }
        
        if (remove_modal_element) {
            if (widget.modal_element) {
                document.body.removeChild(widget.modal_element);

                for (i = 0; i < _detached_windows.length; i += 1) {
                    w = _detached_windows[i];

                    modal_elems = w.document.body.getElementsByClassName(_class_name.modal);

                    for (j = 0; j < modal_elems.length; j += 1) {
                        w.document.body.removeChild(modal_elems[j]);
                    }
                }
            }
        }

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

    var _createModalElement = function (dialog) {
        var div = document.createElement("div");

        div.className = "wui-dialog-modal";

        div.addEventListener("click", function (ev) {
            ev.preventDefault();

            _close(dialog, true, true, true);
        });

        div.style.zIndex = 16777270;

        return div;
    };

    var _computeThenSetPosition = function (dialog) {
        var widget = _widget_list[dialog.id],

            opts = widget.opts,

            parent_width = dialog.parentElement.offsetWidth,
            parent_height = dialog.parentElement.offsetHeight,

            dialog_width = dialog.offsetWidth,
            dialog_height = dialog.offsetHeight;

        if (opts.halign === "center") {
            dialog.style.left = Math.round((parent_width - dialog_width) / 2 + opts.left) + "px";
        } else if (opts.halign === "right") {
            dialog.style.left = (parent_width - dialog_width + opts.left) + "px";
        } else {
            dialog.style.left = opts.left + "px";
        }

        if (opts.valign === "center") {
            dialog.style.top = Math.round((parent_height - dialog_height) / 2 + opts.top) + "px";
        } else if (opts.valign === "bottom") {
            dialog.style.top = (parent_height - dialog_height + opts.top) + "px";
        } else {
            dialog.style.top = opts.top + "px";
        }
    };

    var _minimize = function (minimize_btn, dialog) {
        var widget = _widget_list[dialog.id],
            resize_handler = widget.resize_handler;

        minimize_btn.classList.toggle(_class_name.minimize);
        minimize_btn.classList.toggle(_class_name.maximize);

        dialog.classList.toggle(_class_name.minimized);

        if (resize_handler) {
            resize_handler.classList.toggle(_class_name.open);
        }

        if (widget.status_bar) {
            widget.status_bar.classList.toggle(_class_name.open);
        }
    };

    var _onWindowResize = function (detached) {
        if (_resize_timeout === null) {
            _resize_timeout = setTimeout(function() {
                _resize_timeout = null;

                var doc = document,
                    dialog_contents,

                    widget,

                    content,
                    dialog,

                    status_bar,

                    bcr,

                    i;

                if (detached) {
                    doc = detached.document;

                    dialog_contents = doc.getElementsByClassName(_class_name.content);

                    for (i = 0; i < dialog_contents.length; i += 1) {
                        content = dialog_contents[i];

                        dialog = content.parentElement;

                        widget = _widget_list[dialog.id];

                        status_bar = dialog.getElementsByClassName(_class_name.status_bar);

                        if (status_bar.length > 0) {
                            content.style.height = (detached.innerHeight - 32) + "px";
                        } else {
                            content.style.height = detached.innerHeight + "px";
                        }

                        bcr = content.getBoundingClientRect();

                        if (widget.opts.on_resize) {
                            widget.opts.on_resize(bcr.width, bcr.height);
                        }
                    }

                    return;
                }

                dialog_contents = doc.getElementsByClassName(_class_name.content);

                // resize content & set position
                for (i = 0; i < dialog_contents.length; i += 1) {
                    content = dialog_contents[i];

                    dialog = content.parentElement;

                    status_bar = dialog.getElementsByClassName(_class_name.status_bar);

                    if (status_bar.length > 0) {
                        content.style.height = dialog.offsetHeight - 64 + "px";
                    } else {
                        content.style.height = dialog.offsetHeight - 32 + "px";
                    }

                    _computeThenSetPosition(dialog);

                    bcr = content.getBoundingClientRect();

                    widget = _widget_list[dialog.id];

                    if (widget.opts.on_resize) {
                        widget.opts.on_resize(bcr.width, bcr.height);
                    }
                }
            }, 1000 / 8);
        }
    };

    var _addListenerWalk = function (elem, target) {
        var key, i;

        do {
            if(elem.nodeType == 1) {
                if (elem['eventListenerList']) {
                    for (key in elem.eventListenerList) {
                        if (key === 'length' || !elem.eventListenerList.hasOwnProperty(key)) continue;
                            for (i = 0; i < elem.eventListenerList[key].length; i += 1) {
                                target.addEventListener(key, elem.eventListenerList[key][i], false);
                            }
                        }
                    }
                }
                if(elem.hasChildNodes()) {
                    _addListenerWalk(elem.firstChild, target.firstChild);
                }

                elem = elem.nextSibling;
                target = target.nextSibling;
            }
            while (elem && target);
    };

    var _detach = function (dialog) {
        var widget = _widget_list[dialog.id],

            //window_w, window_h,
            w, h,

            screen_left, screen_top,

            dialog_title_element = dialog.firstElementChild.firstElementChild.firstElementChild,

            stripped_title = dialog_title_element.textContent || dialog_title_element.innerText || "",

            child_window = widget.detachable_ref,

            css, css_html, i, dbc = dialog.getBoundingClientRect();

        if (dialog.classList.contains(_class_name.minimized)) {
            w = parseInt(dialog.style.width,  10);
            h = parseInt(dialog.style.height, 10) - 32;
        } else {
            w = dbc.width;
            h = dbc.height - 32;
        }

        screen_left = typeof window.screenLeft !== "undefined" ? window.screenLeft : screen.left;
        screen_top = typeof window.screenTop !== "undefined" ? window.screenTop : screen.top;

        /*window_w = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.availWidth;
        window_h = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.availHeight;*/

        _close(dialog, true, false, false);

        child_window = window.open("", stripped_title, [
            "toolbar=no",
            "location=no",
            "directories=no",
            "status=no",
            "menubar=no",
            "scrollbars=yes",
            "resizable=yes",
            "width=" + w,
            "height=" + h,
            "top=" + (dbc.top + screen_top + 32),//((window_h-h)/2 + screen_top),
            "left=" + (dbc.left  + screen_left)].join(','));//((window_w-w) / 2 + screen_left)].join(','));

        css_html = "";

        css = document.head.getElementsByTagName("link");

        for (i = 0; i < css.length; i += 1) {
            if (css[i].type === "text/css" && css[i].rel === "stylesheet") {
                css_html += css[i].outerHTML;
            }
        }

        css = document.head.getElementsByTagName("style");

        for (i = 0; i < css.length; i += 1) {
            css_html += css[i].outerHTML;
        }

        // insert the dialog content in the newly opened window
        // it insert back all CSS files of the parent as well...
        child_window.document.open();
        child_window.document.write(['<html>',
                                     '<head>',
                                     '<title>' + stripped_title + '</title>',
                                     css_html,
                                     '</head>',
                                     '<body class="wui-dialog-detach-window-body">',
                                     //dialog.children[1].outerHTML,
                                     '</body>',
                                     '</html>'].join(''));
        child_window.document.close();

        child_window.document.body.appendChild(dialog.children[1].cloneNode(true));

        var status_bar = dialog.getElementsByClassName(_class_name.status_bar);

        if (status_bar.length > 0) {
            var new_status_bar = status_bar[0].cloneNode(true);

            new_status_bar.classList.add(_class_name.open);

            child_window.document.body.appendChild(new_status_bar);
        }

        child_window.addEventListener("resize", function () { _onWindowResize(child_window); }, false);

        child_window.addEventListener("load", function () {
            _addListenerWalk(dialog.children[1], child_window.document.body.firstElementChild);

            if (widget.opts.on_detach) {
                widget.opts.on_detach(child_window);
            }
        });

        child_window.addEventListener("beforeunload", function () {
            //_removeDetachedWindow(widget);
            _close(dialog, true, true, true);

            /*if (widget.modal_element) {
                document.body.removeChild(widget.modal_element);
            }*/
        }, false);

        widget.detachable_ref = child_window;

        _detached_windows.push(child_window);
    };

    var _onClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var element = ev.target,

            dialog = null;

        if (element.classList.contains(_class_name.btn_close)) {
            dialog = element.parentElement.parentElement;

            _close(dialog, false, true, true);
        } else if (element.classList.contains(_class_name.maximize) ||
                   element.classList.contains(_class_name.minimize)) {
            dialog = element.parentElement.parentElement;

            _minimize(element, dialog);
        } else if (element.classList.contains(_class_name.detach)) {
            dialog = element.parentElement.parentElement;

            _detach(dialog);
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
        if (!_dragged_dialog) {
            return;
        }

        var touches = ev.changedTouches,
            
            touch = null,
            
            i,

            owner_doc = _dragged_dialog.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;
        
        if (touches) {
            for (i = 0; i < touches.length; i += 1) {
                touch = touches[i];
                
                if (touch.identifier === _touch_identifier) {
                    _dragged_dialog = null;
                    
                    owner_doc.body.style.cursor = "default";
                    
                    owner_win.removeEventListener('touchmove', _windowMouseMove, false);
                    owner_win.removeEventListener('touchmove', _windowMouseUp, false);
                    
                    break;
                }
            }
        } else {
            _dragged_dialog = null;
            
            owner_doc.body.style.cursor = "default";
            
            owner_win.removeEventListener('mousemove', _windowMouseMove, false);
            owner_win.removeEventListener('mousemove', _windowMouseUp, false);
        }
    };
    
    var _onMouseDown = function (ev) {
        var x = ev.clientX,
            y = ev.clientY,
            
            left = 0,
            top = 0,

            touches = ev.changedTouches,

            owner_doc,
            owner_win;
        
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
        
        owner_doc = _dragged_dialog.ownerDocument;
        owner_win = owner_doc.defaultView || owner_doc.parentWindow;

        if (_dragged_dialog.classList.contains(_class_name.maximize) ||
           !_dragged_dialog.classList.contains(_class_name.draggable)) {
            return;
        }
        
        _focus(_dragged_dialog);
        
        owner_doc.body.style.cursor = "move";
        
        left = parseInt(_dragged_dialog.style.left, 10);
        top = parseInt(_dragged_dialog.style.top,  10);

        _drag_x = x - left;
        _drag_y = y - top;

        owner_win.addEventListener('mousemove', _windowMouseMove, false);
        owner_win.addEventListener('touchmove', _windowMouseMove, false);

        owner_win.addEventListener('mouseup',  _windowMouseUp, false);
        owner_win.addEventListener('touchend', _windowMouseUp, false);
    };
    
    var _onStartResize = function (e) {
        e.preventDefault();
        e.stopPropagation();

        var dialog = e.target.parentElement,

            left = dialog.offsetLeft,
            top  = dialog.offsetTop,

            touches = e.changedTouches,

            owner_doc = dialog.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;

        if (touches) {
            _touch_identifier = touches[0].identifier;
        }

        _resize_start_x = left;
        _resize_start_y = top;

        dialog.classList.remove(_class_name.dim_transition);

        owner_win.addEventListener('mousemove', _onResize, false);
        owner_win.addEventListener('touchmove', _onResize, false);

        owner_win.addEventListener('mouseup', _onStopResize, false);
        owner_win.addEventListener('touchend', _onStopResize, false);

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

            w, h, off_h = 0;

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

        /*if (widget.opts.halign === "center") {
            w += 2;
        }

        if (widget.opts.valign === "center") {
            h += 2;
        }*/

        title_div = _resized_dialog.firstElementChild.firstElementChild.firstElementChild;

        title_div_width = title_div.offsetWidth + 148;

        if (widget.opts.min_width === "title" &&
            w < title_div_width) {
            w = title_div_width;
        } else if (w < widget.opts.min_width) {
            w = widget.opts.min_width;
        }

        if (widget.opts.status_bar) {
            off_h = 32;
        }

        if (h < (widget.opts.min_height + off_h)) {
            h = widget.opts.min_height + off_h;
        }

        _resized_dialog.style.width  = w + "px";

        if (!_resized_dialog.classList.contains(_class_name.minimized)) {
            _resized_dialog.style.height = h + "px";
        }

        dialog_contents = _resized_dialog.getElementsByClassName(_class_name.content);

        for (i = 0; i < dialog_contents.length; i += 1) {
            var content = dialog_contents[i],

                widg = _widget_list[content.parentElement.id],

                bcr;

            content.style.height = (_resized_dialog.offsetHeight - 32 - off_h) + "px";

            bcr = content.getBoundingClientRect();

            if (widg.opts.on_resize) {
                widg.opts.on_resize(bcr.width, bcr.height);
            }

            if (widget.opts.keep_align_when_resized) {
                _computeThenSetPosition(_resized_dialog);
            }
        }
    };

    var _onStopResize = function (e) {
        var owner_doc = _resized_dialog.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;

        e.preventDefault();

        _resized_dialog.classList.add(_class_name.dim_transition);

        owner_win.removeEventListener('mousemove', _onResize, false);
        owner_win.removeEventListener('touchmove', _onResize, false);

        owner_win.removeEventListener('mouseup', _onStopResize, false);
        owner_win.removeEventListener('touchend', _onStopResize, false);

        _resized_dialog = null;
    };

    var _onBeforeUnload = function () {
        for (var id in _widget_list) {
            if (_widget_list.hasOwnProperty(id)) {
                _close(_widget_list[id].dialog, true, false, true);
            }
        }
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

            header_detach_btn    = null,
            header_close_btn     = null,
            header_minimaxi_btn  = null,
            header_title         = null,
            header_title_wrapper = null,

            status_bar = null;
            
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
        
        if (opts.status_bar) {
            content.style.height = dialog.offsetHeight - 64 + "px";
        } else {
            content.style.height = dialog.offsetHeight - 32 + "px";
        }
        
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

            header_close_btn.title = "Close";

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

        if (opts.detachable) {
            header_detach_btn = document.createElement("div");
            header_detach_btn.className = _class_name.btn + " " + _class_name.detach;

            header_detach_btn.title = "Detach";

            header.appendChild(header_detach_btn);
        }

        if (opts.status_bar) {
            status_bar = document.createElement("div");

            status_bar.classList.add(_class_name.status_bar);
            status_bar.classList.add(_class_name.transition);
            status_bar.classList.add(_class_name.open);

            status_bar.innerHTML = opts.status_bar_content;

            dialog.appendChild(status_bar);
        }

        dialog.addEventListener("click", _onClick, false);
        //dialog.addEventListener("touchstart", _onClick, false);

        window.addEventListener("resize", function () { _onWindowResize(false); }, false);
        window.addEventListener("beforeunload", _onBeforeUnload, false);

        dialog.classList.add(_class_name.transition);
        dialog.classList.add(_class_name.dim_transition);

        // go!
        dialog.insertBefore(header, content);
        
        if (opts.resizable) {
            resize_handler = document.createElement("div");

            resize_handler.addEventListener("mousedown", _onStartResize, false);
            resize_handler.addEventListener("touchstart", _onStartResize, false);

            resize_handler.classList.add("wui-dialog-resize");

            resize_handler.classList.add(_class_name.transition);

            resize_handler.classList.add(_class_name.open);

            dialog.appendChild(resize_handler);
        }

        _widget_list[id] =  {
                                dialog: dialog,
                                minimized_id: -1,

                                resize_handler: resize_handler,

                                opts: opts,
            
                                detachable_ref: null,

                                modal_element: null,

                                status_bar: status_bar
                            };
        
        _computeThenSetPosition(dialog);

        return id;
    };
    
    this.setStatusBarContent = function (id, content) {
        var widget = _widget_list[id],

            detached_dialog_elem,

            status_bar,

            detach_ref;

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot setStatusBarContent of WUI dialog \"" + id + "\".");
            }

            return;
        }

        if (widget.status_bar) {
            widget.status_bar.innerHTML = content;

            detach_ref = widget.detachable_ref;
            if (detach_ref) {
                if (!detach_ref.closed) {
                    status_bar = detach_ref.document.body.getElementsByClassName(_class_name.status_bar);

                    if (status_bar.length > 0) {
                        status_bar[0].innerHTML = content;
                    }
                }
            }
        }
    };

    this.open = function (id, detach) {
        var widget = _widget_list[id],

            div, i, dialog;

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot open WUI dialog \"" + id + "\".");
            }
            
            return;   
        }
        
        if (widget.detachable_ref) {
            if (!widget.detachable_ref.closed) {
                widget.detachable_ref.focus();

                return;
            }
        }

        dialog = widget.dialog;

        if (widget.opts.modal) {
            div = _createModalElement(dialog);

            widget.dialog.style.zIndex = 16777271;

            widget.modal_element = div;

            document.body.appendChild(div);

            for (i = 0; i < _detached_windows.length; i += 1) {
                div = _createModalElement(dialog);

                _detached_windows[i].document.body.appendChild(div);
            }
        }

        if (detach) {
            _detach(dialog);

            return;
        }

        dialog.classList.remove(_class_name.closed);
        dialog.classList.add(_class_name.open);

        _focus(dialog);
    };

    this.close = function (id, propagate) {
        var widget = _widget_list[id];

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot close WUI dialog \"" + id + "\".");
            }

            return;
        }

        _close(widget.dialog, true, propagate);
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_Dialog, destroying aborted.");

            return;
        }

        _close(widget.dialog, true, false, true);

        element = widget.dialog;

        element.parentElement.removeChild(element);

        delete _widget_list[id];
    };
})();
