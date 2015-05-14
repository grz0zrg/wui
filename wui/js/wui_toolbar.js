/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_ToolBar = new (function() {
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
        } else if (element.classList.contains(_class_name.minimize_icon) ||
                   element.classList.contains(_class_name.maximize_icon)) {
            return _widget_list[element.parentElement.id];
        } else {
            return _widget_list[element.parentElement.parentElement.id];
        }
    };
    
    var _propagate = function (tool, type, state) {
        if (tool.on_click !== undefined &&
            tool.on_click !== null) {
            var o = {type: type};
            
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
        toolbar.classList.add("wui-toolbar");
        
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
                        
                        widget = {
                            element: tool_element,
                            on_click: tool.on_click,
                            icon: tool.icon,
                            items: [],
                            tooltip: "",
                            type: tool.type,
                            dd_items_width: tool.dropdown_items_width,
                            orientation: tool.orientation
                        },
                        
                        tool_id = _widget_list[id].tools.length,

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
