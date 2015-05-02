/* jslint browser: true */
/* jshint globalstrict: false */
/* global */

var WUI_DropDown = new (function() {
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
            transition: "wui-dropdown-transition"
        },
        
        _known_options = {
            width: "auto",
            height: 24,
            
            ms_before_hiding: 2000,
            
            vertical: false,
            
            vspacing: 0,
            
            selected_id: 0, // default item selected
            
            on_item_selected: null,
            
            use_event_listener: true
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
        widget.floating_content.classList.add(_class_name.transition);
        
        widget.element.classList.remove("wui-dropdown-on");
        
        widget.close_timeout = null;
    };
    
    var _click = function (ev) {
        var current_element = ev.target,
            
            widget = _widget_list[current_element.id],
            
            floating_content = null,
            
            floating_content_childs = null,
            
            i;
        
        if ( current_element.classList.contains(_class_name.item)) {
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
        var current_element = ev.target,
            
            widget = _widget_list[current_element.id],
            
            offset = null,
            
            floating_content = null;

        if (current_element.classList.contains(_class_name.dropdown)) {
            floating_content = widget.floating_content;
            
            widget.element.classList.add("wui-dropdown-on");

            offset = _getElementOffset(current_element);

            floating_content.style.top = (offset.top - floating_content.offsetHeight - widget.opts.vspacing) + "px";
            floating_content.style.left = offset.left + "px";

            floating_content.classList.remove(_class_name.transition);
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
    
    /**
     * Trigger an event manually.
     */
    this.triggerEvent = function (event, type) {
        var e_type = event.type;
        
        if (type !== undefined) {
            e_type = type;
        }

        if (e_type === "mouseover") {
            _mouseOver(event);
        } else if (e_type === "click") {
            _click(event);
        }
                
        return false;
    };
    
    this.create = function (id, options, content_array) {
        var dropdown = document.getElementById(id),
            
            div_item = null,
            
            item = "",
            
            items = [],

            opts = {},
        
            key,
            
            i = 0;
        
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
        
        if (opts.use_event_listener) {
            dropdown.addEventListener("mouseover", _mouseOver, false);
            floating_content.addEventListener("mouseover", _mouseOver, false);
        }
        
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
                
            if (opts.use_event_listener) {
                div_item.addEventListener("click", _click, false);
                div_item.addEventListener("mouseover", _mouseOver, false);
            }
            
            if (item === content_array[opts.selected_id]) {
                div_item.classList.add(_class_name.selected);
            }
        }
        
        floating_content.classList.add(_class_name.content);
        floating_content.classList.add(_class_name.transition);
        
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
    };
    
})();