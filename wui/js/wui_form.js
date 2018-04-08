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
            form: "wui-form",
            main_group: "wui-form-main-group",
            sub_group: "wui-form-sub-group",
            sub_group_div: "wui-form-sub-group-div",
            tn: "wui-form-tn",
            sm: "wui-form-sm",
            md: "wui-form-md",
            xl: "wui-form-xl",
            align_right: "wui-form-align-right",
            inline: "wui-form-inline"
        },

        _known_options = {
            width: "auto",
            on_change: null
        },

        _identifier_patterns = {
            wui_item: "wui_form_item_",
            std_item: "wui_form_std_item_"
        },

        // this is the type="" (value) mapped to a HTML element (key)
        _form_type_table = {
            "checkbox": "input",
            "text": "input",
            "color": "input",
            "date": "input",
            "datetime-local": "input",
            "email": "input",
            "file": "input",
            "hidden": "input",
            "image": "input",
            "month": "input",
            "number": "input",
            "radio": "input",
            "range": "input",
            "reset": "input",
            "search": "input",
            "submit": "input",
            "tel": "input",
            "time": "input",
            "url": "input",
            "week": "input",
            "password": "input"
        },

        _allowed_form_items = [
            "button",
            "datalist",
            "input",
            "label",
            "legend",
            "meter",
            "select",
            "textarea",

            // <input> see _form_type_table
            "checkbox",
            "text",
            "color",
            "date",
            "datetime-local",
            "email",
            "file",
            "hidden",
            "image",
            "month",
            "number",
            "radio",
            "range",
            "reset",
            "search",
            "submit",
            "tel",
            "time",
            "url",
            "week",
            "password"
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

    var _copyAttributes = function (src, dst) {
        var key;

        for (key in src) {
            if (src.hasOwnProperty(key)) {
                dst.setAttribute(key, src[key]);
            }
        }
    };

    var _getOnChange = function (obj, cb) {
        return function (ev) {
            cb(ev, obj);
        };
    }

    var _addFormItems = function (legend_name, attr_list, element, frame_object, index, opts) {
        var i = 0,
            j = 0,

            key,

            fields_count = index,

            frame_elem,
            frame_item,
            frame_legend,
            wui_form_elem,

            div_elem,
            form_elem,
            label_elem,
            option_elem,
            option_parent,
            opt_group_elem,
            datalist_input_elem,
            sub_group_attr,

            final_elem,

            option;

        if (legend_name === undefined) {
            frame_elem = document.createElement("div");
            frame_legend = document.createElement("legend");
        } else {
            frame_elem = document.createElement("fieldset");
            frame_legend = document.createElement("legend");
            frame_legend.innerHTML = legend_name;
        }

        if (attr_list !== undefined) {
            _copyAttributes(attr_list, frame_elem);
        }

        frame_elem.appendChild(frame_legend);

        for (i = 0; i < frame_object.length; i += 1) {
            frame_item = frame_object[i];

            if (frame_item["type"]) {
                if (_allowed_form_items.indexOf(frame_item.type) !== -1) { // standard HTML form items
                    div_elem = null;

                    if (_form_type_table[frame_item.type]) {
                        form_elem = document.createElement(_form_type_table[frame_item.type]);
                        form_elem.type = frame_item.type;

                        final_elem = form_elem;
                    } else {
                        form_elem = document.createElement(frame_item.type);
                        final_elem = form_elem;
                    }

                    if (frame_item["wrap"]) {
                        div_elem = document.createElement("div");
                        div_elem.appendChild(form_elem);
                        final_elem = div_elem;
                    }

                    form_elem.id = _identifier_patterns.std_item + fields_count + "_" + element.id;

                    if (opts.on_change) {
                        form_elem.addEventListener("change", _getOnChange({}, opts.on_change));
                    }

                    if (frame_item["group"]) {
                        form_elem.name = frame_item.group;
                    }

                    if (frame_item["label"]) {
                        label_elem = document.createElement("label");
                        label_elem.setAttribute("for", form_elem.id);

                        label_elem.innerHTML = frame_item.label;

                        if (div_elem === null) {
                            frame_elem.appendChild(label_elem);
                        } else {
                            final_elem.insertBefore(label_elem, form_elem);
                        }

                        if (frame_item.type === "input") {
                            label_elem.appendChild(form_elem);
                            final_elem = label_elem;
                        }
                    }

                    if (frame_item["attr"]) {
                        _copyAttributes(frame_item.attr, form_elem);
                    }

                    if (frame_item.type === "select" || frame_item.type === "datalist") {
                        if (frame_item.type === "datalist") {
                            datalist_input_elem = document.createElement("input");
                            datalist_input_elem.setAttribute("list", form_elem.id);

                            if (frame_item["id"]) {
                                datalist_input_elem.setAttribute("id", frame_item.id);
                            }

                            if (frame_item["name"]) {
                                datalist_input_elem.setAttribute("name", frame_item.name);
                            }

                            final_elem.appendChild(datalist_input_elem);
                        }

                        if (frame_item["options"]) {
                            option_parent = form_elem;

                            for (j = 0; j < frame_item.options.length; j += 1) {
                                option = frame_item.options[j];

                                if ((typeof option) === "object") {
                                    if (option["group"]) {
                                        option_parent = document.createElement("optgroup");
                                        option_parent.setAttribute("label", option.group);
                                        if (option["group_attr"]) {
                                            _copyAttributes(option.group_attr, option_parent);
                                        }
                                        form_elem.appendChild(option_parent);
                                    }
                                }

                                option_elem = document.createElement("option");

                                if ((typeof option) === "string") {
                                    option_elem.innerHTML = option;
                                    option_parent.appendChild(option_elem);
                                } else if ((typeof option) === "object") {
                                    if (option["name"]) {
                                        option_elem.innerHTML = option.name;
                                        option_parent.appendChild(option_elem);

                                        if (option["label"]) {
                                            option_elem.setAttribute("label", option.label);
                                        }

                                        if ((typeof option["disabled"]) === "booleans") {
                                            option_elem.setAttribute("disabled", option.disabled);
                                        }

                                        if ((typeof option["selected"]) === "booleans") {
                                            option_elem.setAttribute("selected", option.selected);
                                        }

                                        if (option["value"]) {
                                            option_elem.setAttribute("value", option.value);
                                        }

                                        if (option["attr"]) {
                                            _copyAttributes(option.attr, option_elem);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (frame_item["value"]) {
                        form_elem.value = frame_item.value;
                    }

                    frame_elem.appendChild(final_elem);

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
                        sub_group_attr = {
                            "style": ""
                        };

                        if (frame_item["class"]) {
                            sub_group_attr["class"] = frame_item.class;
                            sub_group_attr["class"] += " " + _class_name.sub_group;
                        } else {
                            sub_group_attr["class"] = _class_name.sub_group;
                        }

                        if (frame_item["style"]) {
                            sub_group_attr.style += frame_item.style;
                        }

                        if (frame_item["width"]) {
                            sub_group_attr.style += "width: " + frame_item["width"];
                        }

                        if (frame_item["height"]) {
                            sub_group_attr.style += "height: " + frame_item["height"];
                        }

                        if (frame_item["content_align"] === "right") {
                            sub_group_attr["class"] += " " + _class_name.align_right;
                        }

                        if (frame_item["inline"]) {
                            sub_group_attr["class"] += " " + _class_name.inline;
                        }

                        if (frame_item["items_size"]) {
                            if (frame_item.items_size === "tn") {
                              sub_group_attr["class"] += " " + _class_name.tn;
                            } else if (frame_item.items_size === "sm") {
                                sub_group_attr["class"] += " " + _class_name.sm;
                            } else if (frame_item.items_size === "md") {
                                sub_group_attr["class"] += " " + _class_name.md;
                            } else if (frame_item.items_size === "xl") {
                                sub_group_attr["class"] += " " + _class_name.xl;
                            }
                        } else {
                            sub_group_attr["class"] += " " + _class_name.sm;
                        }

                        if (frame_item["name"] === undefined) {
                            sub_group_attr["class"] += " " + _class_name.sub_group_div;
                        }

                        fields_count = _addFormItems(frame_item["name"], sub_group_attr, frame_elem, frame_item.items, fields_count, opts);
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

                total_items = _addFormItems(key, { "class": _class_name.main_group }, element, frame, 0, opts);
            }
        }

        element.style.width = opts.width;

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
            wui_form_item = document.getElementById(_identifier_patterns.wui_item + i + "_" + element.id);
            if (wui_form_item) {
                for (j = 0; j < _allowed_wui_items.length; j += 1) {
                    window[_allowed_wui_items[j]].destroy(wui_form_item);
                }
            }
        }

        delete _widget_list[id];
    };
})();
