/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_Form = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _widget_list = {},

        _class_name = {
            form: "wui-form"
        },

        _known_options = {

        },

        _identifier_patterns = {
            wui_item: "wui_form_item_",
            std_item: "wui_form_std_item_"
        },

        _allowed_form_items = [
            "button", "datalist", "input", "label", "legend", "meter", "optgroup", "option", "select", "textarea"
        ],

        _allowed_wui_items = [
            "WUI_RangeSlider", "WUI_Input", "WUI_DropDown"
        ];

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

    var _addFormItems = function (legend_name, element, frame_object, index) {
        var i = 0,

            fields_count = index,

            frame_elem,
            frame_item,
            frame_legend,
            wui_form_elem,
            form_elem;

        frame_elem = document.createElement("fieldset");
        frame_legend = document.createElement("legend");
        frame_legend.innerHTML = legend_name;

        frame_elem.appendChild(frame_legend);

        for (i = 0; i < frame_object.length; i += 1) {
            frame_item = frame_object[i];

            if (frame_item["type"]) {
                if (_allowed_form_items.indexOf(frame_item.type) !== -1) { // standard form items
                    form_elem = document.createElement(frame_item.type);
                    form_elem.id = _identifier_patterns.std_item + fields_count;

                    // TODO

                    frame_elem.appendChild(form_elem);

                    fields_count += 1;
                } else if (_allowed_wui_items.indexOf(frame_item.type) !== -1) { // WUI items
                    if (window[frame_item.type]) {
                        wui_form_elem = document.createElement("div");
                        wui_form_elem.id = _identifier_patterns.wui_item + fields_count;

                        window[frame_item.type].create(wui_form_elem, frame_item["opts"], frame_item["items"]);

                        frame_elem.appendChild(wui_form_elem);

                        fields_count += 1;
                    }
                } else if (frame_item.type === "fieldset") {
                    if (frame_item["items"]) {
                        if (frame_item["name"]) {
                            fields_count = _addFormItems(frame_item.name, frame_elem, frame_item.items, fields_count);
                        }
                    }
                }
            }
        }

        element.appendChild(frame_elem);

        return fields_count;
    };

    var _createFailed = function () {
        _log("WUI_Form 'create' failed, first argument not an id nor a DOM element.");
    };

    /***********************************************************
        Public section.

        Functions.
    ************************************************************/

    this.create = function (id, options, items) {
        var element,

            frame,

            frame_elem,

            total_items = 0,

            opts = {},

            key,

            i = 0;

        if ((typeof id) === "string") {
            element = document.getElementById(id);
        } else if ((typeof id) === "object") {
            if ((typeof id.innerHTML) !== "string") {
                _createFailed();

                return;
            }

            element = id;

            id = element.id;
        } else {
            _createFailed();

            return;
        }

        if (_widget_list[id] !== undefined) {
            _log("WUI_Form id '" + id + "' already created, aborting.");

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

        for (key in items) {
            if (items.hasOwnProperty(key)) {
                frame = items[key];

                total_items = _addFormItems(key, element, frame, 0);
            }
        }

        element.classList.add(_class_name.form);

        _widget_list[id] = {
            element: element,
            total_items: total_items,
            opts : opts
        };

        return id;
    };

    this.destroy = function (id) {
        var widget = _widget_list[id],

            element,

            wui_form_item,

            i, j;

        if (widget === undefined) {
            _log("Element id '" + id + "' is not a WUI_Form, destroying aborted.");

            return;
        }

        element = widget.element;

        // delete WUI form items
        for (i = 0; i < widget.total_items; i += 1) {
            wui_form_item = document.getElementById(_identifier_patterns.wui_item + i);
            if (wui_form_item) {
                for (j = 0; j < _allowed_wui_items.length; j += 1) {
                    window[_allowed_wui_items[j]].destroy(wui_form_item);
                }
            }
        }

        delete _widget_list[id];
    };
})();
