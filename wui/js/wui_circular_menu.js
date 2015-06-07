/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_CircularMenu = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _elems = [],

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

            _elems.push(elem);

            if (item.on_click) {
                elem.addEventListener("click", _onClickHandler(win, doc, item.on_click));
            }

            elem.classList.add(_class_name.show);

            a += ia;
        }

        var handler = _onClickOutHandler(win, doc);

        win.addEventListener("click", handler);
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
