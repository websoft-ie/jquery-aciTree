
/*
 * aciTree jQuery Plugin v3.0.0-rc.7
 * http://acoderinsights.ro
 *
 * Copyright (c) 2013 Dragos Ursu
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Require jQuery Library >= v1.7.1 http://jquery.com
 * + aciPlugin >= v1.1.1 https://github.com/dragosu/jquery-aciPlugin
 *
 * Date: Apr Mon 29 09:40 2013 +0200
 */

/*
 * This extension adds item selection/keyboard navigation to aciTree.
 *
 */

(function($, window, undefined) {

    // extra default options

    var options = {
        selectable: true,               // if TRUE then one item can be selected (and the tree navigation with the keyboard will be enabled)
        // the 'tabIndex' attribute need to be >= 0 set on the container (by default will be set to 0)
        fullRow: false,                 // if TRUE then the selection will be made on the entire row (the CSS need to reflect this)
        textSelection: false            // if FALSE then the item text can't be selected
    };

    // aciTree selectable extension
    // adds item selection & keyboard navigation (left/right, up/down, pageup/pagedown, home/end, space, enter, escape)
    // dblclick also toggles the item

    var aciTree_selectable = {
        __extend: function() {
            // add extra data
            $.extend(this._instance, {
                focus: false
            });
            $.extend(this._private, {
                blurTimeout: null,
                focus: null
            });
            // call the parent
            this._super();
        },
        // test if has focus
        hasFocus: function() {
            return this._instance.focus;
        },
        // get focused element
        _lastFocus: function() {
            return (this._instance.focus && this._private.focus) ? this._private.focus : $([]);
        },
        // process onfocus
        _focus: function(element) {
            window.clearTimeout(this._private.blurTimeout);
            this._private.focus = element;
            if (!this._instance.focus) {
                this._instance.focus = true;
                this._instance.jQuery.addClass('aciTreeFocus');
                this._trigger(null, 'focused');
            }
        },
        // process onblur
        _blur: function() {
            window.clearTimeout(this._private.blurTimeout);
            this._private.blurTimeout = window.setTimeout($.proxy(function() {
                if (this._instance.focus) {
                    this._instance.focus = false;
                    this._instance.jQuery.removeClass('aciTreeFocus');
                    this._trigger(null, 'blurred');
                }
            }, this), 10);
        },
        // init selectable
        _initSelectable: function() {
            var _this = this;
            if (this._instance.jQuery.attr('tabindex') === undefined) {
                this._instance.jQuery.attr('tabindex', 0);
            }
            this._instance.jQuery.bind('focusin' + this._private.nameSpace, function(e) {
                _this._focus($(e.target));
            }).bind('focusout' + this._private.nameSpace, function() {
                _this._blur();
            }).bind('keydown' + this._private.nameSpace, function(e) {
                if (!_this._instance.focus) {
                    // do not handle if we do not have focus
                    return;
                }
                var selected = _this.selected();
                if (selected.length && _this.isBusy(selected)) {
                    // skip when busy
                    return false;
                }
                var item = $([]);
                switch (e.which) {
                    case 38: // up
                        item = selected.length ? _this._prevOpen(selected) : _this.first();
                        break;
                    case 40: // down
                        item = selected.length ? _this._nextOpen(selected) : _this.first();
                        break;
                    case 37: // left
                        if (selected.length) {
                            if (_this.isOpen(selected)) {
                                _this.close(selected, {
                                    collapse: _this._instance.options.collapse,
                                    expand: _this._instance.options.expand,
                                    unique: _this._instance.options.unique
                                });
                            } else {
                                item = _this.parent(selected);
                            }
                        } else {
                            item = _this.first();
                        }
                        break;
                    case 39: // right
                        if (selected.length) {
                            if (_this.isFolder(selected) && _this.isClosed(selected)) {
                                _this.open(selected, {
                                    collapse: _this._instance.options.collapse,
                                    expand: _this._instance.options.expand,
                                    unique: _this._instance.options.unique
                                });
                            } else {
                                item = _this.first(selected);
                            }
                        } else {
                            item = _this.first();
                        }
                        break;
                    case 33: // pgup
                        item = selected.length ? _this._prevPage(selected) : _this.first();
                        break;
                    case 34: // pgdown
                        item = selected.length ? _this._nextPage(selected) : _this.first();
                        break;
                    case 36: // home
                        item = _this.first();
                        break;
                    case 35: // end
                        item = _this._lastOpen();
                        break;
                    case 13: // enter
                        if (selected.length && _this.isFolder(selected) && _this.isClosed(selected)) {
                            _this.open(selected, {
                                collapse: _this._instance.options.collapse,
                                expand: _this._instance.options.expand,
                                unique: _this._instance.options.unique
                            });
                        }
                        break;
                    case 27: // escape
                        if (selected.length && _this.isOpen(selected)) {
                            _this.close(selected, {
                                collapse: _this._instance.options.collapse,
                                expand: _this._instance.options.expand,
                                unique: _this._instance.options.unique
                            });
                        }
                        break;
                    case 32: // space
                        if (selected.length && _this.isFolder(selected)) {
                            _this.toggle(selected, {
                                collapse: _this._instance.options.collapse,
                                expand: _this._instance.options.expand,
                                unique: _this._instance.options.unique
                            });
                        }
                        break;
                }
                if (item.length) {
                    if (!_this.isSelected(item)) {
                        if (!_this.isVisible(item)) {
                            _this.setVisible(item);
                        }
                        _this.select(item, {
                            select: true
                        });
                        return false;
                    } else if (!_this.isVisible(item)) {
                        _this.setVisible(item);
                        return false;
                    }
                }
            });
            this._fullRow(this._instance.options.fullRow);
        },
        // change full row mode
        _fullRow: function(state) {
            var _this = this;
            this._instance.jQuery.off(this._private.nameSpace, '.aciTreeLine,.aciTreeItem').off(this._private.nameSpace, '.aciTreeItem');
            this._instance.jQuery.on('click' + this._private.nameSpace, state ? '.aciTreeLine,.aciTreeItem' : '.aciTreeItem', function(e) {
                var item = _this.itemFrom(e.target);
                if (!_this.isVisible(item)) {
                    _this.setVisible(item);
                }
                if (!_this.isSelected(item)) {
                    _this.select(item, {
                        select: true
                    });
                }
            }).on('dblclick' + this._private.nameSpace, state ? '.aciTreeLine,.aciTreeItem' : '.aciTreeItem', function(e) {
                var item = _this.itemFrom(e.target);
                if (_this.isFolder(item)) {
                    _this.toggle(item, {
                        collapse: _this._instance.options.collapse,
                        expand: _this._instance.options.expand,
                        unique: _this._instance.options.unique
                    });
                    return false;
                }
            });
        },
        // override _initHook
        _initHook: function() {
            if (this.isSelectable()) {
                this._initSelectable();
            }
            // call the parent
            this._super();
        },
        // override _itemHook
        _itemHook: function(parent, item, itemData, level) {
            if (!this._instance.options.textSelection) {
                // make text unselectable
                this._selectable(item.children('.aciTreeLine').find('.aciTreeItem'));
            }
            this._super(parent, item, itemData, level);
        },
        // make element (un)selectable
        _selectable: function(element, state) {
            if (state) {
                element.css({
                    '-webkit-user-select': 'text',
                    '-moz-user-select': 'text',
                    '-ms-user-select': 'text',
                    '-o-user-select': 'text',
                    'user-select': 'text'
                }).attr({
                    'unselectable': null,
                    'onselectstart': null
                }).unbind('selectstart' + this._private.nameSpace);
            } else {
                element.css({
                    '-webkit-user-select': 'none',
                    '-moz-user-select': '-moz-none',
                    '-ms-user-select': 'none',
                    '-o-user-select': 'none',
                    'user-select': 'none'
                }).attr({
                    'unselectable': 'on',
                    'onselectstart': 'return false'
                }).bind('selectstart' + this._private.nameSpace, function() {
                    return true;
                });
            }
        },
        // get last visible child starting from item
        _lastOpen: function(item) {
            var _this = this;
            var opened = function(item) {
                var last = _this.last(item);
                if (_this.isOpen(last)) {
                    return opened(last);
                } else {
                    return last;
                }
            };
            if (!item) {
                item = this.last();
            }
            if (this.isOpen(item)) {
                return opened(item);
            } else {
                return item;
            }
        },
        // get prev visible starting with item
        _prevOpen: function(item) {
            var prev = this.prev(item);
            if (prev.length) {
                return this._lastOpen(prev);
            } else {
                var parent = this.parent(item);
                return parent.length ? parent : item;
            }
        },
        // get next visible starting with item
        _nextOpen: function(item) {
            var _this = this;
            var opened = function(item) {
                var parent = _this.parent(item);
                if (parent.length) {
                    var next = _this.next(parent);
                    if (next.length) {
                        return next;
                    } else {
                        return opened(parent);
                    }
                }
                return null;
            };
            if (this.isOpen(item)) {
                return this.first(item);
            } else {
                var next = this.next(item);
                if (next.length) {
                    return next;
                } else {
                    next = opened(item);
                    return next ? next : item;
                }
            }
        },
        // get item height
        _itemHeight: function(item) {
            var size = item.first().children('.aciTreeLine').find('.aciTreeItem');
            return size.outerHeight(true);
        },
        // get prev visible starting with item (with a 'page' size)
        _prevPage: function(item) {
            var now = this._itemHeight(item);
            var space = this._instance.jQuery.height();
            var last = $([]), prev = item;
            do {
                prev = this._prevOpen(prev);
                if (prev.length) {
                    if (prev.get(0) == last.get(0)) {
                        break;
                    }
                    now += this._itemHeight(prev);
                    last = prev;
                } else {
                    break;
                }
            } while (now < space);
            return prev;
        },
        // get next visible starting with item (with a 'page' size)
        _nextPage: function(item) {
            var now = this._itemHeight(item);
            var space = this._instance.jQuery.height();
            var last = $([]), next = item;
            do {
                next = this._nextOpen(next);
                if (next.length) {
                    if (next.get(0) == last.get(0)) {
                        break;
                    }
                    now += this._itemHeight(next);
                    last = next;
                } else {
                    break;
                }
            } while (now < space);
            return next;
        },
        _selectHook: function(unselected, selected) {
            // override this to process after select, return TRUE to skip
        },
        // select/deselect item
        // options.select is the new state
        // options.oldSelected will keep the old selected item
        select: function(item, options) {
            var _this = this;
            options = this._options(options, null, function() {
                this._trigger(item, 'selectfail', options);
            });
            if (this.isSelectable() && this.isItem(item)) {
                // a way to cancel the select
                if (!this._trigger(item, 'beforeselect', options)) {
                    this._fail(item, options);
                    return;
                }
                var select = options.select;
                var unselect = this._instance.jQuery.find('.aciTreeSelected');
                if (select) {
                    unselect = unselect.not(item.first());
                }
                options.oldSelected = this.selected();
                unselect.removeClass('aciTreeSelected').each(function() {
                    _this._trigger($(this), 'unselected', options);
                });
                if (select) {
                    if (this.isSelected(item)) {
                        this._trigger(item, 'wasselected', options);
                    } else {
                        item.first().addClass('aciTreeSelected');
                        this._selectHook(options.oldSelected, item);
                        this._trigger(item, 'selected', options);
                    }
                }
                this._success(item, options);
            } else {
                this._fail(item, options);
            }
        },
        // get selected item
        selected: function() {
            return this._instance.jQuery.find('.aciTreeSelected:first');
        },
        // test if item is selected
        isSelected: function(item) {
            return item && item.first().hasClass('aciTreeSelected');
        },
        // test if selectable is enabled
        isSelectable: function() {
            return this._instance.options.selectable;
        },
        // override set option
        option: function(option, value) {
            var _this = this;
            if (this.wasInit() && !this.isLocked()) {
                if ((option == 'selectable') && (value != this.isSelectable())) {
                    if (value) {
                        this._initSelectable();
                    } else {
                        this._doneSelectable();
                    }
                }
                if ((option == 'fullRow') && (value != this._instance.options.fullRow)) {
                    this._fullRow(value);
                }
                if ((option == 'textSelection') && (value != this._instance.options.textSelection)) {
                    if (value) {
                        this._instance.jQuery.find('.aciTreeItem').each(function() {
                            _this._selectable($(this), true);
                        });
                    } else {
                        this._instance.jQuery.find('.aciTreeItem').each(function() {
                            _this._selectable($(this));
                        });
                    }
                }
            }
            // call the parent
            this._super(option, value);
        },
        // done selectable
        _doneSelectable: function(destroy) {
            if (this._instance.jQuery.attr('tabindex') == '0') {
                this._instance.jQuery.removeAttr('tabindex');
            }
            this._instance.jQuery.unbind(this._private.nameSpace);
            this._instance.jQuery.off(this._private.nameSpace, '.aciTreeItem');
            this._instance.jQuery.removeClass('aciTreeFocus');
            this._instance.focus = false;
            if (!destroy) {
                var selected = this.selected();
                if (selected.length) {
                    this.select(selected, {
                        select: false
                    });
                }
            }
        },
        // override _destroyHook
        _destroyHook: function(unloaded) {
            if (unloaded) {
                this._doneSelectable(true);
            }
            // call the parent
            this._super(unloaded);
        }

    };

    // extend the base aciTree class and add the selectable stuff
    aciPluginClass.plugins.aciTree = aciPluginClass.plugins.aciTree.extend(aciTree_selectable, 'aciTreeSelectable');

    // add extra default options
    aciPluginClass.defaults('aciTree', options);

})(jQuery, this);
