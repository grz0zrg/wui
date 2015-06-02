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

            height: "100%"
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
