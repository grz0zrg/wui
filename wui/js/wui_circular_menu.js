/* jslint browser: true */
/* jshint globalstrict: false */

var WUI_CircularMenu = new (function() {
    "use strict";

    /***********************************************************
        Private section.

        Fields.
    ************************************************************/

    var _elems = [],

        _last_time = 0,

        _class_name = {
            item:       "wui-circularmenu-item",
            show:       "wui-circularmenu-show"
        },

        _known_options = {
            x: null,
            y: null,

            rx: 64,
            ry: 48,

            angle: 0,

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

        //try { // this is in case it is in a detached WUI dialog, it will try to remove something that does not exist if the dialog was closed while the circular menu is still shown
            for (i = 0; i < _elems.length; i += 1) {
                elem = _elems[i];

                if (doc.body.contains(elem)) {
                    doc.body.removeChild(elem);
                }
            }
        /*} catch (e) {
            _elems = [];
        }*/
    };

    var _onClickOutHandler = function (win, doc) {
        var handler = function (ev) {
            ev.preventDefault();

            var now = new Date().getTime();
            if (now - _last_time <= 500) {
                return;
            }

            if (ev.target.classList.contains(_class_name.item)) {
                return;
            }

            _destroy(doc);

            //win.removeEventListener("click", handler);
            win.removeEventListener("mousedown", handler);
        };

        return handler;
    };

    var _onClickHandler = function (win, doc, cb) {
        var handler = function (ev) {
            ev.preventDefault();
console.log("_onClickHandler", ev.target);
console.log("");
            cb();

            _destroy(doc);

            win.removeEventListener("mousedown", _onClickOutHandler(win, doc));
        };

        return handler;
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

        return { top: Math.round(top), left: Math.round(left), width: box.width, height: box.height };
    };

    var _toRadians = function (angle) {
        return angle * (Math.PI / 180.0);
    };

    var _addItems = function (opts, items, win, doc, x, y) {
        _destroy(doc);

        var elem, item, i, handler,
            a = -(Math.PI / 2) + _toRadians(opts.angle),
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

            // for the transition to work, force the layout engine
            win.getComputedStyle(elem).width;

            _elems.push(elem);

            if (item.on_click) {
                elem.addEventListener("click", _onClickHandler(win, doc, item.on_click));
            }

            elem.classList.add(_class_name.show);

            a += ia;
        }

        handler = _onClickOutHandler(win, doc);

        //win.addEventListener("click", handler);

        _last_time = new Date().getTime();

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
            elem_bcr = _getElementOffset(elem);

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
