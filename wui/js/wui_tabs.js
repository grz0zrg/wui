/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_Tabs = new (function() {
    /***********************************************************
        Private section.
        
        Fields.
    ************************************************************/
    
    var _widget_list = {},
        
        _class_name = {
            enabled:      "wui-tab-enabled",
            disabled:     "wui-tab-disabled",
            display_none: "wui-tab-display-none",
            tab:          "wui-tab",
            tab_content:  "wui-tab-content"
        },
        
        _known_options = {
            on_tab_click: null,
            use_event_listener: true
        };

    /***********************************************************
        Private section.
        
        Functions.
    ************************************************************/
    
    var _onTabClick = function (ev) {
        var tab_elem = ev.target,
            
            tabs = tab_elem.parentElement,
            content = tabs.nextElementSibling.nextElementSibling,
            
            widget_id = tabs.parentElement.id,
            
            tab_index = 0,
            elem = null,
            
            i = 0;
        
        for (i = 0; i < tabs.childElementCount; i += 1) {
            elem = tabs.children[i];
            
            elem.classList.remove(_class_name.enabled);
            elem.classList.add(_class_name.disabled);
            
            if (elem === tab_elem) {
                tab_index = i;
            }
        }
        
        for (i = 0; i < content.childElementCount; i += 1) {
            elem = content.children[i];
            
            elem.classList.remove(_class_name.display_none);
            
            if (tab_index !== i) {
                elem.classList.add(_class_name.display_none);
            }
        }
        
        ev.target.classList.remove(_class_name.disabled);
        ev.target.classList.toggle(_class_name.enabled);
        
        if (_widget_list[widget_id] !== undefined) {
            _widget_list[widget_id](tab_index);
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
            if (element.classList.contains(_class_name.tab)) {
                _onTabClick(event);

                return true;
            }
        }
        
        return false;
    };

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
        
        underline.className = "wui-tabs-underline";
        
        element.insertBefore(underline, content);
        
        // style tabs
        tabs.classList.add("wui-tabs");
        
        var tab_count = tabs.childElementCount;
        
        for (i = 0; i < tab_count; i += 1) {
            var tab = tabs.children[i];
            
            tab.classList.add("wui-tab");
            
            if (tab !== first_tab) {
                tab.classList.add(_class_name.disabled);
            }
            
            if (opts.use_event_listener) {
                tab.addEventListener("click", _onTabClick, false);
            }
        }
        
        first_tab.classList.add(_class_name.enabled);
        first_tab.classList.add("wui-first-tab");
        
        // style tabs content
        content.classList.add("wui-tabs-content");
        
        var tab_content_count = content.childElementCount;
        
        content.style.height = content.offsetHeight - 32 + "px";
        
        content.children[0].classList.add(_class_name.tab_content);  
        
        for (i = 1; i < tab_content_count; i += 1) {
            var tab_content = content.children[i];
            
            tab_content.classList.add(_class_name.tab_content);
            tab_content.classList.add(_class_name.display_none);   
        }
        
        if (_widget_list[id] === undefined) {
            _widget_list[id] = opts.on_tab_click;
        }
        
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
})();
