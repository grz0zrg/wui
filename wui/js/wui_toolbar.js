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

    var _log = function (content) {
        if (!window.WUI_Reporting) {
            return;
        }

        if (typeof console !== "undefined") {
            console.log(content);
        }
    };

    var _getWidget = function (toolbar_id) {
        var widget = _widget_list[toolbar_id];

        if (widget === undefined) {
            _log("_getWidget failed, the element id \"" + toolbar_id + "\" is not a WUI_ToolBar.");

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

    var _createFailed = function () {
        _log("WUI_RangeSlider 'create' failed, first argument not an id nor a DOM element.");
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
        var toolbar,

            group = null,
            elem = null,

            index = null,

            previous_group = null,

            opts = {},

            key;

        if ((typeof id) === "string") {
            toolbar = document.getElementById(id);
        } else if ((typeof id) === "object") {
            if ((typeof id.innerHTML) !== "string") {
                _createFailed();

                return;
            }

            toolbar = id;

            id = toolbar.id;
        } else {
            _createFailed();

            return;
        }

        if (_widget_list[id] !== undefined) {
            _log("WUI_Toolbar id '" + id + "' already created, aborting.");

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
                            on_rclick: tool.on_rclick,
                            icon: tool.icon,
                            items: [],
                            tooltip: "",
                            type: tool.type,
                            dd_items_width: tool.dropdown_items_width,
                            orientation: tool.orientation,
                            id: tool_id
                        },

                        j;

                    if (widget.on_rclick) {
                        tool_element.addEventListener("contextmenu", function (e) {
                                var widget = _getWidgetFromElement(e.target),
                                    my_tool = widget.tools[e.target.dataset.tool_id];

                                e.preventDefault();

                                my_tool.on_rclick();
                            });
                    }

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
            _log("Element id '" + id + "' is not a WUI_ToolBar, destroying aborted.");

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
