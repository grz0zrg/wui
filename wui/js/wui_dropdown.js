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
        
        dd.classList.remove("wui-dropdown-on");

        if (widget.floating_content) {
            doc.body.removeChild(widget.floating_content);
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

            if (widget.floating_content.classList.contains(_class_name.open)) {
                _deleteFloatingContent(ev.target.ownerDocument, current_element, widget);
            }
        }

        return;
    };

    var _itemClick = function (ev) {
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
        
        widget.selected_id = parseInt(current_element.dataset.index, 10);

        widget.target_element.lastElementChild.innerHTML = current_element.textContent;
        
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
            
            floating_content = null,

            owner_doc = current_element.ownerDocument,
            owner_win = owner_doc.defaultView || owner_doc.parentWindow;

        if (current_element.classList.contains(_class_name.dropdown)) {
            widget = _widget_list[current_element.id];
            
            if (widget.floating_content === null) {
                current_element.classList.add("wui-dropdown-on");

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
