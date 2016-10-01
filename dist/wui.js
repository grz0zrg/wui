/* jslint browser: true */

var WUI_Dialog = new (function() {
    "use strict";

    /***********************************************************
        Private section.
        
        Fields.
    ************************************************************/
    
    var _self = this,
    
        _widget_list = {},
        
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
    // a tricky solution but the only one i know of until a standard pop up or someone has a better solution
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
            
            elem = null,

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
        
        // traverse backward to see if it is contained by another dialog and focus all the parents, note: could be done once for performances
        elem = widget.dialog.parentElement;
        
        while (elem !== null) {
            if (elem.classList.contains(_class_name.dialog)) {
                elem.style.zIndex = 101;
            }
            
            elem = elem.parentElement;
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
        
        if (widget.dialog !== dialog) {
            _minimize(widget.header_minimaxi_btn, widget.dialog);
        }

        minimize_btn.classList.toggle(_class_name.minimize);
        minimize_btn.classList.toggle(_class_name.maximize);

        dialog.classList.toggle(_class_name.minimized);
        
        if (dialog.classList.contains(_class_name.minimized)) {
            dialog.style.borderStyle = "solid";
            dialog.style.borderColor = "#808080";
            dialog.style.borderWidth = "1px";
        } else {
            dialog.style.borderStyle = "";
            dialog.style.borderColor = "";
            dialog.style.borderWidth = "";
        }

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
        
        widget.detachable_ref = child_window;

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
                                     '<body id="' + dialog.id + "\" class=\"wui-dialog-detach-window-body\" onload=\"parent.opener.WUI_Dialog.childWindowLoaded(document.body.id)\">",
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
        
        child_window.addEventListener("keyup", function (ev) { if (ev.keyCode !== 27) { return; } _close(dialog, true, true, true); }, false);

        child_window.addEventListener("resize", function () { _onWindowResize(child_window); }, false);

        child_window.addEventListener("beforeunload", function () {
            //_removeDetachedWindow(widget);
            _close(dialog, true, true, true);

            /*if (widget.modal_element) {
                document.body.removeChild(widget.modal_element);
            }*/
        }, false);

        _detached_windows.push(child_window);
    };

    var _onClick = function (ev) {
        ev.preventDefault();
        //ev.stopPropagation();

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
    
    var _onKeyUp = function (ev) {
        if (ev.keyCode !== 27) {
            return;
        }
        
        var key, widget;
        
        for(key in _widget_list) { 
            if (_widget_list.hasOwnProperty(key)) {
                widget = _widget_list[key];
                
                if (widget.opts.closable &&
                    widget.dialog.style.zIndex === "101" && 
                    widget.dialog.classList.contains(_class_name.open)) {
                    _self.close(key, true);
                    
                    return;
                }
            }
        }
    };
    
    var _windowMouseMove = function (ev) {
        if (!_dragged_dialog) {
            return;
        }

        ev.preventDefault();
        
        var widget = _widget_list[_dragged_dialog.id],
        
            x = ev.clientX,
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
        
        if (widget.dialog !== _dragged_dialog) {
            widget.dialog.style.left = new_x + 'px';
            widget.dialog.style.top  = new_y + 'px';
        }
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
                    owner_win.removeEventListener('touchend', _windowMouseUp, false);
                    
                    break;
                }
            }
        } else {
            _dragged_dialog = null;
            
            owner_doc.body.style.cursor = "default";
            
            owner_win.removeEventListener('mousemove', _windowMouseMove, false);
            owner_win.removeEventListener('mouseup', _windowMouseUp, false);
        }
    };
    
    var _onMouseDown = function (ev) {
        var x = ev.clientX,
            y = ev.clientY,
            
            left = 0,
            top = 0,

            touches = ev.changedTouches,

            owner_doc,
            owner_win,

            dragged_dialog;
        
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
        
        dragged_dialog = ev.target.parentElement;

        if (dragged_dialog.classList.contains(_class_name.maximize) ||
           !dragged_dialog.classList.contains(_class_name.draggable)) {
            return;
        }
        
        _dragged_dialog = dragged_dialog;

        owner_doc = _dragged_dialog.ownerDocument;
        owner_win = owner_doc.defaultView || owner_doc.parentWindow;

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
        
        header.addEventListener("click", _onClick, false);
        header.addEventListener("touchstart", _onClick, false);

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
            
                                header_minimaxi_btn: header_minimaxi_btn,

                                opts: opts,
            
                                detachable_ref: null,

                                modal_element: null,

                                status_bar: status_bar
                            };
        
        _computeThenSetPosition(dialog);
        
        _focus(dialog);

        return id;
    };
    
    this.setStatusBarContent = function (id, content) {
        var widget = _widget_list[id],
            
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
    
    this.focus = function (id) {
        var widget = _widget_list[id];

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot focus WUI dialog \"" + id + "\".");
            }

            return;
        }
        
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

        _close(widget.dialog, true, propagate, true);
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
    
    // called from a dialog detached window, this basically ensure that the window is initialized before adding back listeners on elements
    this.childWindowLoaded = function (id) {
        var widget = _widget_list[id],
            child_window = widget.detachable_ref;
        
        if (!child_window) {
            return;
        }
        
        if (child_window.document.body.firstElementChild) {
            _addListenerWalk(widget.dialog.children[1], child_window.document.body.firstElementChild);

            if (widget.opts.on_detach) {
                widget.opts.on_detach(child_window);
            }
        } else {
            window.setTimeout(function(){ // temporary
                WUI_Dialog.childWindowLoaded(id);
            }, 500);
        }
    };
    
    document.addEventListener("keyup", _onKeyUp, false);
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
            open:       "wui-dropdown-open",
            on:         "wui-dropdown-on"
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
    
    var _createFloatingContent = function (doc, widget) {
        var floating_content = doc.createElement("div"),
            div_item = null,
            item = "",
            i;

        for (i = 0; i < widget.content_array.length; i += 1) {
            item = widget.content_array[i];

            div_item = doc.createElement("div");

            if (!widget.opts.vertical) {
                div_item.classList.add("wui-dropdown-horizontal");
            }

            div_item.classList.add(_class_name.item);

            div_item.innerHTML = item;

            div_item.dataset.index = i;

            floating_content.appendChild(div_item);

            //widget.items.push(div_item);

            div_item.addEventListener("click", _itemClick, false);

            if (item === widget.content_array[widget.selected_id]) {
                div_item.classList.add(_class_name.selected);
            }
        }

        floating_content.addEventListener("mouseover", _mouseOver, false);

        floating_content.classList.add(_class_name.content);

        floating_content.dataset.linkedto = widget.element.id;

        doc.body.appendChild(floating_content);

        widget.floating_content = floating_content;
    };

    var _deleteFloatingContent = function (doc, dd, widget) {
        //widget.floating_content.classList.remove(_class_name.open);
        dd.classList.remove(_class_name.on);

        if (widget.floating_content) {
            if (widget.floating_content.parentElement === doc.body) {
                doc.body.removeChild(widget.floating_content);
            }
        }

        widget.floating_content = null;
        
        widget.close_timeout = null;
    };
    
    var _click = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var current_element = ev.target,

            widget = null,

            floating_content = null;

        if (current_element.classList.contains(_class_name.dropdown)) {
            widget = _widget_list[current_element.id];

            floating_content = widget.floating_content;

            if (floating_content) {
                if (floating_content.classList.contains(_class_name.open)) {
                    _deleteFloatingContent(ev.target.ownerDocument, current_element, widget);
                }
            } else {
                _mouseOver(ev);
            }
        }

        return;
    };

    var _itemClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var current_element = ev.target,
            
            widget,
            
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
        
        widget.selected_id = parseInt(current_element.dataset.index, 10);
        widget.target_element.lastElementChild.innerHTML = current_element.textContent;
        
        if (widget.element !== widget.target_element) {
            widget.element.lastElementChild.innerHTML = current_element.textContent;
        }
        
        if (widget.opts.on_item_selected !== undefined) {
            widget.opts.on_item_selected(current_element.dataset.index);  
        }

        _deleteFloatingContent(current_element.ownerDocument, widget.target_element, widget);
    };
    
    var _mouseOver = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var current_element = ev.target,
            
            widget = null,
            
            offset = null,
            
            floating_content = null,

            owner_doc = current_element.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;

        if (current_element.classList.contains(_class_name.dropdown)) {
            widget = _widget_list[current_element.id];
            
            if (widget.floating_content === null) {
                current_element.classList.add(_class_name.on);

                _createFloatingContent(owner_doc, widget);

                floating_content = widget.floating_content;

                offset = _getElementOffset(current_element);

                floating_content.style.top = (offset.top - floating_content.offsetHeight - widget.opts.vspacing) + "px";
                floating_content.style.left = offset.left + "px";

                floating_content.classList.add(_class_name.open);

                widget.target_element = current_element;
            }
        } else if ( current_element.classList.contains(_class_name.content)) {
            widget = _widget_list[current_element.dataset.linkedto];
        } else if ( current_element.classList.contains(_class_name.item)) {
            widget = _widget_list[current_element.parentElement.dataset.linkedto];
        } else {
            return;
        }
        
        owner_win.clearTimeout(widget.close_timeout);

        current_element.addEventListener("mouseleave", _mouseLeave, false);
    };
    
    var _mouseLeave = function (ev) {
        ev.preventDefault();

        var current_element = ev.target,
            
            widget = null,

            owner_doc = current_element.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;
    
        if (current_element.classList.contains(_class_name.content)) {
            widget = _widget_list[current_element.dataset.linkedto];
        } else if (current_element.classList.contains(_class_name.item)) {
            widget = _widget_list[current_element.parentElement.dataset.linkedto];
        } else {
            widget = _widget_list[current_element.id];
        }
            
        widget.close_timeout = owner_win.setTimeout(_deleteFloatingContent, widget.opts.ms_before_hiding, owner_doc, widget.target_element, widget);

        current_element.removeEventListener("mouseleave", _mouseLeave, false);
    };

    /***********************************************************
        Public section.
        
        Functions.
    ************************************************************/

    this.create = function (id, options, content_array) {
        var dropdown = document.getElementById(id),

            opts = {},
        
            key;
        
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
        
        dropdown.addEventListener("click", _click, false);
        
        dropdown.addEventListener("mouseover", _mouseOver, false);
        
        var dd = {
            element: dropdown,

            floating_content: null,
            //items: [],
            selected_id: opts.selected_id,

            content_array: content_array,
            
            opts: opts,
            
            button_item: div_button,
            
            hover_count: 0,
            
            target_element: null,

            close_timeout: null
        };
        
        _widget_list[id] = dd;

        return id;
    };
    
    this.destroy = function (id) {
        var widget = _widget_list[id],

            element;

        if (widget === undefined) {
            console.log("Element id '" + id + "' is not a WUI_DropDown, destroying aborted.");

            return;
        }

        element = widget.element;

        _deleteFloatingContent(document, element, widget);

        element.parentElement.removeChild(element);

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
        
        _container_suffix_id = "_wui_container",
        
        _class_name = {
            hook:        "wui-rangeslider-hook",
            bar:         "wui-rangeslider-bar",
            filler:      "wui-rangeslider-filler",

            hook_focus:  "wui-rangeslider-hook-focus",
            
            value_input: "wui-rangeslider-input"
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
            
            default_value: 0.5,
            
            /*
                can be an object with the following form (example) :
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
        };
    
    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
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
        
            bar    = element.getElementsByClassName(_class_name.bar)[0],//element.childNodes[1],
            filler = bar.firstElementChild,
            hook   = filler.firstElementChild,
            
            value_input = bar.nextElementSibling,
            
            width = rs.opts.width,
            height = rs.opts.height,
        
            pos = Math.abs((value - rs.opts.min) / rs.opts.range);
        
        value = _truncateDecimals(value, 4);

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
            // TODO: optimize all this
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

            v = _truncateDecimals(_hook_value, 4);

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
                opts.min = _truncateDecimals(target.value, 4);

                widget.value_input.min = opts.min;
                
                //if (opts.min < 0) {
                    opts.range = opts.max - opts.min;
                //}
            } else if (conf_key === "max") {
                opts.max = _truncateDecimals(target.value, 4);

                widget.value_input.max = opts.max;
                
                //opts.range = opts.max;
                
                //if (opts.min < 0) {
                    opts.range = opts.max - opts.min;
                //}
            } else if (conf_key === "step") {
                opts.step = _truncateDecimals(target.value, 4);

                widget.value_input.step = opts.step;
            } else if (conf_key === "scroll_step") {
                opts.scroll_step = _truncateDecimals(target.value, 4);
            }
            
            if (opts.configurable[conf_key] !== undefined) {
                opts.configurable[conf_key].val = target.value;
            }
        };
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

                    bar: bar,
                    filler: filler,
                    hook: hook,

                    value_input: value_input,
                  
                    value: opts.default_value, 
                 };
        
        title_div.innerHTML = opts.title;
        
        value_input.setAttribute("value", opts.default_value);
        value_input.setAttribute("type",  "number");
        value_input.setAttribute("min",   opts.min);
        value_input.setAttribute("max",   opts.max);
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
        
        bar.appendChild(filler);
        filler.appendChild(hook);
        
        range_slider.appendChild(title_div);
        range_slider.appendChild(bar);

        range_slider.appendChild(value_input);
        
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
                
                // accomodate the slider layour for the configurable button
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

        bar.addEventListener("mousedown", _rsMouseDown, false);
        bar.addEventListener("touchstart", _rsMouseDown, false);
            
        hook.addEventListener("dblclick", _rsDblClick, false);
            
        value_input.addEventListener("input", _inputChange, false);
            
        bar.addEventListener("mousewheel", _rsMouseWheel, false);
        bar.addEventListener("DOMMouseScroll", _rsMouseWheel, false);
        
        _widget_list[id] = rs;

        _update(range_slider, rs, opts.default_value);

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

        element = widget.element;

        element.parentElement.removeChild(element);
        
        owner_doc = element.ownerDocument;
        
        container_element = owner_doc.getElementById(id + _container_suffix_id);
        
        if (container_element) {
            owner_doc.removeChild(container_element);
        }

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

            height: "calc(100% - 30px)"
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
            
            widget = _widget_list[widget_id],

            tab_index = 0,
            elem = null,
            
            i = 0;
        
        for (i = 0; i < tabs.childElementCount; i += 1) {
            elem = tabs.children[i];
            
            elem.classList.remove(_class_name.enabled);
            elem.classList.add(_class_name.disabled);
            
            widget.tabs[i].classList.remove(_class_name.enabled);
            widget.tabs[i].classList.add(_class_name.disabled);

            if (elem === tab_elem) {
                tab_index = i;
            }
        }

        for (i = 0; i < content.childElementCount; i += 1) {
            elem = content.children[i];
            
            elem.classList.remove(_class_name.display_none);
            
            widget.contents[i].classList.remove(_class_name.display_none);

            if (tab_index !== i) {
                elem.classList.add(_class_name.display_none);

                widget.contents[i].classList.add(_class_name.display_none);
            }
        }
        
        widget.tabs[tab_index].classList.remove(_class_name.disabled);
        widget.tabs[tab_index].classList.add(_class_name.enabled);

        ev.target.classList.remove(_class_name.disabled);
        ev.target.classList.add(_class_name.enabled);

        if (widget.opts.on_tab_click) {
            widget.opts.on_tab_click(tab_index);
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
        
        element.style.overflow = "hidden";

        underline.className = "wui-tabs-underline";
        
        element.insertBefore(underline, content);
        
        // style tabs
        tabs.classList.add(_class_name.tabs);
        
        var tab_count = tabs.childElementCount,
            tab_elems = [];
        
        for (i = 0; i < tab_count; i += 1) {
            var tab = tabs.children[i];
            
            tab.classList.add("wui-tab");
            
            if (tab !== first_tab) {
                tab.classList.add(_class_name.disabled);
            }
            
            tab.addEventListener("click", _onTabClick, false);
            tab.addEventListener("touchstart", _onTabClick, false);

            tab_elems.push(tab);
        }
        
        first_tab.classList.add(_class_name.enabled);
        first_tab.classList.add("wui-first-tab");
        
        // style tabs content
        content.classList.add("wui-tabs-content");
        
        var tab_content_count = content.childElementCount,
            content_elems = [content.children[0]];
        
        content.style.height = opts.height;
        
        content.children[0].classList.add(_class_name.tab_content);  
        
        for (i = 1; i < tab_content_count; i += 1) {
            var tab_content = content.children[i];
            
            tab_content.classList.add(_class_name.tab_content);
            tab_content.classList.add(_class_name.display_none);

            content_elems.push(tab_content);
        }
        
        _widget_list[id] = { element: element, tabs: tab_elems, contents: content_elems, opts : opts };
        
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
    
    var _createDdFloatingContent = function (doc, tool, widget) {
        var dropdown_floating_content = doc.createElement("div"), j;

        if (tool.items !== undefined) {
            for (j = 0; j < tool.items.length; j += 1) {
                var item = tool.items[j],

                    div_item = doc.createElement("div");

                if (!tool.vertical) {
                    div_item.classList.add("wui-toolbar-dropdown-horizontal");
                }

                div_item.classList.add(_class_name.dd_item);

                div_item.innerHTML = item.title;

                div_item.dataset.index = j;

                dropdown_floating_content.appendChild(div_item);
            }
        }

        dropdown_floating_content.addEventListener("click", _ddItemClick, false);

        //widget.floating_content = dropdown_floating_content;

        dropdown_floating_content.style.width = widget.dd_items_width + "px";

        dropdown_floating_content.classList.add(_class_name.dd_content);

        dropdown_floating_content.dataset.linkedto_tb = widget.element.id;
        dropdown_floating_content.dataset.linkedto_tool_index = tool.id;

        doc.body.appendChild(dropdown_floating_content);

        return dropdown_floating_content;
    };

    var _toggle = function (element, toolbar_id, propagate) {
        var widget = null,
            
            state = false,
            
            toggle_group,
            
            tb,

            tools,

            i = 0;
        
        widget = _getWidgetFromElement(element, toolbar_id);
        
        tb = widget.element;

        if (element.parentElement) {
            if (element.parentElement.parentElement) {
                tb = element.parentElement.parentElement;
            }
        }

        var my_tool = widget.tools[parseInt(element.dataset.tool_id, 10)];
        
        if (my_tool.element.dataset.on === "1") {
            my_tool.element.dataset.on = 0;
            element.dataset.on = 0;
            
            my_tool.element.title = my_tool.tooltip;

            element.title = my_tool.tooltip;

            if (my_tool.icon !== undefined) {
                my_tool.element.classList.add(my_tool.icon);
                my_tool.element.classList.remove(my_tool.toggled_icon);

                element.classList.add(my_tool.icon);
                element.classList.remove(my_tool.toggled_icon);
            }
        } else {
            my_tool.element.dataset.on = 1;
            element.dataset.on = 1;
            
            if (my_tool.tooltip_toggled !== undefined) {
                my_tool.element.title = my_tool.tooltip_toggled;
                element.title = my_tool.tooltip_toggled;
            }
            
            if (my_tool.toggled_icon !== undefined) {
                my_tool.element.classList.add(my_tool.toggled_icon);
                my_tool.element.classList.remove(my_tool.icon);

                element.classList.add(my_tool.toggled_icon);
                element.classList.remove(my_tool.icon);
            }
            
            state = true;
        }
        
        if (my_tool.toggled_style !== "none") {
            if (element.classList.contains(_class_name.toggle_on)) {
                my_tool.element.classList.remove(_class_name.toggle_on);
                element.classList.remove(_class_name.toggle_on);
            } else {
                my_tool.element.classList.add(_class_name.toggle_on);
                element.classList.add(_class_name.toggle_on);
            }
        }
        
        toggle_group = element.dataset.toggle_group;

        if (toggle_group !== undefined) {
            tools = tb.getElementsByClassName(_class_name.item);

            for (i = 0; i < tools.length; i += 1) {
                var tool_element = tools[i],

                    tool = widget.tools[parseInt(tool_element.dataset.tool_id, 10)];

                if (toggle_group === tool_element.dataset.toggle_group &&
                    tool_element.dataset.tool_id !== element.dataset.tool_id) {

                    if (tool_element.dataset.on === "0") {
                        continue;
                    }
                    
                    tool_element.dataset.on = "0";
                    tool.element.dataset.on = "0";

                    tool_element.classList.remove(_class_name.toggle_on);
                    tool.element.classList.remove(_class_name.toggle_on);

                    if (my_tool.toggled_icon !== undefined) {
                        tool_element.classList.remove(tool.toggled_icon);
                        tool.element.classList.remove(tool.toggled_icon);
                    }

                    if (my_tool.icon !== undefined) {
                        tool_element.classList.add(tool.icon);
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

            doc = item_element.ownerDocument,

            dropdown_content = item_element.parentElement,

            widget = _widget_list[dropdown_content.dataset.linkedto_tb],

            tool_index = parseInt(dropdown_content.dataset.linkedto_tool_index, 10),

            my_tool = widget.tools[tool_index],

            item_index = parseInt(item_element.dataset.index, 10),

            item = my_tool.items[item_index],

            tb_elem = doc.getElementById(dropdown_content.dataset.linkedto_tb),

            tool_elems = tb_elem.getElementsByClassName(_class_name.item),

            tool_elem = tool_elems[tool_index];

        if (item.on_click !== undefined) {
            item.on_click();

            tool_elem.classList.remove(_class_name.toggle_on);
            my_tool.element.classList.remove(_class_name.toggle_on);

            _removeDdFloatingContent(my_tool, tool_elem);
            //dropdown_content.classList.remove(_class_name.dd_open);
        }
    };

    var _removeDdFloatingContent = function (tool, element) {
        var owner_doc = element.ownerDocument,

            floating_contents = owner_doc.body.getElementsByClassName(_class_name.dd_content),

            floating_content_element,

            i;

        for (i = 0; i < floating_contents.length; i += 1) {
            floating_content_element = floating_contents[i];

            floating_content_element.removeEventListener("click", _ddItemClick, false);
            floating_content_element.parentElement.removeChild(floating_content_element);
        }

        tool.element.classList.remove(_class_name.toggle_on);
        element.classList.remove(_class_name.toggle_on);
    };

    var _removeDdFloatingContentHandler = function (tool, element) {
        var handler = function () {
            var owner_doc = element.ownerDocument,
                owner_win = owner_doc.defaultView || owner_doc.parentWindow;

            _removeDdFloatingContent(tool, element);

            owner_win.removeEventListener('click', handler);
        };

        return handler;
    };

    var _onClick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

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

            widget = null,

            owner_doc = element.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;

        widget = _getWidgetFromElement(element);

        my_tool = widget.tools[element.dataset.tool_id];

        if (my_tool.type === "dropdown") {
            if (element.classList.contains(_class_name.toggle_on)) {
                _removeDdFloatingContent(my_tool, element);

                return;
            }

            dropdown_floating_content = _createDdFloatingContent(owner_doc, my_tool, widget);

            var tool_element = my_tool.element;

            element.classList.add(_class_name.toggle_on);
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
        
            owner_win.addEventListener("click", _removeDdFloatingContentHandler(my_tool, element), false);
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
     * @param   {Object}   options [[Description]]
     * @param   {Array}    tools   [[Description]]
     * @returns {String} Created widget reference, internally used to recognize the widget
     */
    this.create = function (id, options, tools) {
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

        var i;

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

                for (i = 0; i < group.length; i += 1) {
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
                            tool_element.dataset.on = "1";
                        }
                    } else if (tool.type === "dropdown") {
                        tool_element.classList.add(_class_name.button);

                        if (tool.items !== undefined) {
                            for (j = 0; j < tool.items.length; j += 1) {
                                var item = tool.items[j];
                                widget.items.push({ title: item.title, on_click: item.on_click });
                            }
                        }
                    } else { // default to standard button
                        tool_element.classList.add(_class_name.button);
                    }
                }
                
                toolbar.appendChild(group_element);
                
                previous_group = group;
           }
        }
        
        // now setup tools state, this could have been done before,
        // but to work with the detachable dialog widget we need them added to the toolbar before calling _toggle etc.
        var tools_elems = toolbar.getElementsByClassName(_class_name.item);

        for (i = 0; i < tools_elems.length; i += 1) {
            var tool_elem = tools_elems[i];

            if (tool_elem.dataset.on === "1") {
                tool_elem.dataset.on = "0";

                _toggle(tool_elem, id, true);
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

var WUI_CircularMenu = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _elems = [],

        _last_time = 0,

        _class_name = {
            item:       "wui-circularmenu-item",
            show:       "wui-circularmenu-show"
        },

        _known_options = {
            x: null,
            y: null,

            rx: 64,
            ry: 48,

            item_width:  32,
            item_height: 32,

            window: null,

            element: null
        };

    /***********************************************************
        Private section.

        Functions.
    ************************************************************/

    var _destroy = function (doc) {
        var elem,

            i;

        for (i = 0; i < _elems.length; i += 1) {
            elem = _elems[i];

            doc.body.removeChild(elem);
        }

        _elems = [];
    };

    var _onClickHandler = function (win, doc, cb) {
        var handler = function (ev) {
            ev.preventDefault();

            cb();

            _destroy(doc);
        };

        return handler;
    };

    var _onClickOutHandler = function (win, doc) {
        var handler = function (ev) {
            ev.preventDefault();

            var now = new Date().getTime();
            if (now - _last_time <= 500) {
                return;
            }

            if (ev.target.classList.contains(_class_name.item)) {
                return;
            }

            _destroy(doc);

            win.removeEventListener("click", handler);
            win.removeEventListener("mousedown", handler);
        };

        return handler;
    };

    var _addItems = function (opts, items, win, doc, x, y) {
        _destroy(doc);

        var elem, item, i,
            a = -(Math.PI / 2),
            c = items.length,
            ia = (Math.PI * 2 / c);

        for (i = 0; i < c; i += 1) {
            item = items[i];

            elem = document.createElement("div");

            elem.classList.add(_class_name.item);

            elem.style.width  = opts.item_width  + "px";
            elem.style.height = opts.item_height + "px";

            elem.style.backgroundSize = (opts.item_width - 4)  + "px " + (opts.item_height - 4) + "px";

            elem.style.left = (x + opts.rx * Math.cos(a)) + "px";
            elem.style.top  = (y + opts.ry * Math.sin(a)) + "px";

            elem.classList.add(item.icon);

            if (item.tooltip) {
                elem.title = item.tooltip;
            }

            doc.body.appendChild(elem);

            // for the transition to work, force the layout engine
            win.getComputedStyle(elem).width;

            _elems.push(elem);

            if (item.on_click) {
                elem.addEventListener("click", _onClickHandler(win, doc, item.on_click));
            }

            elem.classList.add(_class_name.show);

            a += ia;
        }

        var handler = _onClickOutHandler(win, doc);

        win.addEventListener("click", handler);

        _last_time = new Date().getTime();

        win.addEventListener("mousedown", handler);
    };

    /***********************************************************
        Public section.

        Functions.
    ************************************************************/

    /**
     * Create a circular menu.
     */
    this.create = function (options, items) {
        var opts = {},

            key,

            x, y,

            elem,
            elem_bcr,

            owner_doc = document,
            owner_win = window;

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

        elem = opts.element;

        if (elem !== null) {
            elem_bcr = elem.getBoundingClientRect();

            owner_doc = elem.ownerDocument;
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;

            x = elem_bcr.left + (elem_bcr.width  - opts.item_width)  / 2;
            y = elem_bcr.top  + (elem_bcr.height - opts.item_height) / 2;

            _addItems(opts, items, owner_win, owner_doc, x, y);
        } else if (x !== null && y !== null) {
            if (opts.window !== null) {
                owner_win = opts.window;
                owner_doc = owner_win.document;
            }

            x = opts.x - opts.item_width  / 2;
            y = opts.y - opts.item_height / 2;

            _addItems(opts, items, owner_win, owner_doc, x, y);
        }
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
            _dragged_element.style.left = new_x + 'px';
            
            draggable.x = new_x;
        }
        
        if (draggable.axisLock !== 1) {
            new_y = y - _drag_y;
            _dragged_element.style.top  = new_y + 'px';
            
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
     * @param {Boolean} state false value mean the element will be no more draggable
     */
    this.draggable = function (element, draggable_state, on_drag_cb) {
        if (draggable_state) {
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
                x: parseInt(element.style.left, 10),
                y: parseInt(element.style.top, 10)
            });
        } else {
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
