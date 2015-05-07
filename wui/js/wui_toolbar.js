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
            toggle:         "wui-toolbar-toggle",
            toggle_on:      "wui-toolbar-toggle-on"
        },
        
        _known_options = {
            item_hmargin: 3,
            
            icon_width: 32,
            icon_height: 32,
            
            allow_groups_minimize: false,
            
            vertical: false,
            
            use_event_listener: true
        };

    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
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
        if (tool.onClick !== undefined &&
            tool.onClick !== null) {
            var o = {type: type};
            
            if (state !== undefined) {
                o.state = state;
            }
            
            tool.onClick(o);
        }
    };
    
    var _onToggle = function (ev, toolbar_id, propagate) {
        var element = ev.target,

            widget = null,
            
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

                    if (propagate) {
                        _propagate(tool, "toggle", false);
                    }
                }
            }
        }

        if (propagate) {
            _propagate(my_tool, "toggle", state);
        }
    };
    
    var _onClick = function (ev, toolbar_id) {
        if(ev.preventDefault) {
            ev.preventDefault();
        }

        var element = ev.target,

            widget = null;
        
        widget = _getWidgetFromElement(element, toolbar_id);
        
        var my_tool = widget.tools[element.dataset.tool_id];
        
        _propagate(my_tool, "click");
    };
    
    var _onMinimizeGroup = function (ev) {
        if(ev.preventDefault) {
            ev.preventDefault();
        }

        var element = ev.target,

            group = element.nextSibling,
            
            group_childs = group.getElementsByTagName('div'),
            
            widget = null,
            
            group_item = null,
            
            i;
        
        widget = _getWidgetFromElement(element);
        
        if (element.classList.contains(_class_name.minimize_icon)) {
            element.classList.add(_class_name.maximize_icon);
            element.classList.remove(_class_name.minimize_icon);
            
            element.title = "Maximize group";
            
            group.style.width = "0";
            group.style.height = "0";
            
            for (i = 0; i < group_childs.length; i += 1) {
                group_item = group_childs[i];
                
                group_item.style.minWidth  = "0";
                group_item.style.minHeight = "0";
            }
        } else {
            element.classList.add(_class_name.minimize_icon);
            element.classList.remove(_class_name.maximize_icon);
            
            element.title = "Minimize group";
            
            group.style.width = "auto";
            group.style.height = "auto";
            
            for (i = 0; i < group_childs.length; i += 1) {
                group_item = group_childs[i];
                
                group_item.style.minWidth  = widget.opts.icon_width  + "px";
                group_item.style.minHeight = widget.opts.icon_height + "px";
            }
        }
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
            if (element.classList.contains(_class_name.toggle)) {
                _onToggle({target: element}, undefined, true);
                
                return true;
            } else if (element.classList.contains(_class_name.minimize_group) ||
                       element.classList.contains("wui-toolbar-minimize-group-vertical")) {
                _onMinimizeGroup( {target: element});
                
                return true;
            } else if (element.classList.contains(_class_name.button)) {
                _onClick( {target: element});
                
                return true;
            }
        }
        
        return false;
    };
    
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
            tools: [],
            opts: opts
        };
        
        // build the toolbar and its items
        toolbar.classList.add("wui-toolbar");
        
        var group_class = "wui-toolbar-group",
            item_class = "wui-toolbar-item",
            spacer_class = "wui-toolbar-spacer",
            group_minimize_class = _class_name.minimize_group;
        
        if (opts.vertical) {
            toolbar.classList.add("wui-toolbar-vertical");
            
            group_class = "wui-toolbar-group-vertical";
            item_class += " wui-toolbar-item-vertical";
            spacer_class = "wui-toolbar-spacer-vertical";
            group_minimize_class = "wui-toolbar-minimize-group-vertical";

            toolbar.style.maxWidth = (opts.icon_width + 4) + "px";
        } else {
            toolbar.style.maxHeight = (opts.icon_height + 4) + "px";
        }
        
        group_minimize_class = _class_name.button + " " + _class_name.minimize_icon + " " + group_minimize_class;
        
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
                    
                    if (opts.use_event_listener) {
                        elem.addEventListener("click", _onMinimizeGroup, false);
                    }
                }
               
                group = tools[index];
               
                var group_element = document.createElement("div");
                group_element.className = group_class;

                if (opts.vertical) {
                    group_element.style.maxWidth = opts.icon_width + "px";
                } else {
                    group_element.style.maxHeight = opts.icon_height + "px";
                }

                for (var i = 0; i < group.length; i += 1) {
                    var tool = group[i],
                        tool_element = document.createElement("div"),
                        
                        widget = { element: tool_element, onClick: tool.onClick, icon: tool.icon },
                        
                        tool_id = _widget_list[id].tools.length;

                    tool_element.className = item_class;
                    
                    tool_element.style.minWidth = opts.icon_width + "px";
                    tool_element.style.minHeight = opts.icon_height + "px";
                    tool_element.style.marginLeft = opts.item_hmargin + "px";
                    tool_element.style.marginRight = opts.item_hmargin + "px";
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
                        
                        tool_element.style.lineHeight = opts.icon_height + "px";
                        
                        tool_element.classList.add("wui-toolbar-text");
                    } 
                    
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
                            
                            _onToggle({target: tool_element}, id, true);
                        }
                        
                        if (opts.use_event_listener) {
                            tool_element.addEventListener("click", _onToggle, false);
                        }
                    } else { // default to standard button
                        tool_element.classList.add(_class_name.button);
                        
                        if (opts.use_event_listener) {
                            tool_element.addEventListener("click", _onClick, false);
                        }
                    }
                    
                    if (tool.icon !== undefined) {
                        tool_element.classList.add(tool.icon);
                    }
                }
                
                toolbar.appendChild(group_element);
                
                previous_group = group;
           }
        }
        
        return id;
    };

    this.toggle = function (toolbar_id, tool_index, propagate) {
        var widget = _widget_list[toolbar_id];

        if (widget === undefined) {
            if (typeof console !== "undefined") {
                console.log("Cannot toggle, WUI toolbar \"" + toolbar_id + "\" was not created.");
            }

            return;
        }

        _onToggle({target: widget.tools[tool_index].element}, toolbar_id, propagate);
    };
})();
