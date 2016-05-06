(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('@most/multicast', ['exports', '@most/prelude'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('@most/prelude'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.prelude);
    global.mostMulticast = mod.exports;
  }
})(this, function (exports, _prelude) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.MulticastSource = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var MulticastDisposable = function () {
    function MulticastDisposable(source, sink) {
      _classCallCheck(this, MulticastDisposable);

      this.source = source;
      this.sink = sink;
      this.disposed = false;
    }

    _createClass(MulticastDisposable, [{
      key: 'dispose',
      value: function dispose() {
        if (this.disposed) {
          return;
        }
        this.disposed = true;
        var remaining = this.source.remove(this.sink);
        return remaining === 0 && this.source._dispose();
      }
    }]);

    return MulticastDisposable;
  }();

  function tryEvent(t, x, sink) {
    try {
      sink.event(t, x);
    } catch (e) {
      sink.error(t, e);
    }
  }

  function tryEnd(t, x, sink) {
    try {
      sink.end(t, x);
    } catch (e) {
      sink.error(t, e);
    }
  }

  var dispose = function dispose(disposable) {
    return disposable.dispose();
  };

  var emptyDisposable = {
    dispose: function dispose() {}
  };

  var MulticastSource = function () {
    function MulticastSource(source) {
      _classCallCheck(this, MulticastSource);

      this.source = source;
      this.sink = undefined;
      this.sinks = [];
      this._disposable = emptyDisposable;
    }

    _createClass(MulticastSource, [{
      key: 'run',
      value: function run(sink, scheduler) {
        var n = this.add(sink);
        if (n === 1) {
          this._disposable = this.source.run(this, scheduler);
        }
        return new MulticastDisposable(this, sink);
      }
    }, {
      key: '_dispose',
      value: function _dispose() {
        var disposable = this._disposable;
        this._disposable = void 0;
        return Promise.resolve(disposable).then(dispose);
      }
    }, {
      key: 'add',
      value: function add(sink) {
        if (this.sink === undefined) {
          this.sink = sink;
          return 1;
        }

        this.sinks = (0, _prelude.append)(sink, this.sinks);
        return this.sinks.length + 1;
      }
    }, {
      key: 'remove',
      value: function remove(sink) {
        if (sink === this.sink) {
          this.sink = this.sinks.shift();
          return this.sink === undefined ? 0 : this.sinks.length + 1;
        }

        this.sinks = (0, _prelude.remove)((0, _prelude.findIndex)(sink, this.sinks), this.sinks);
        return this.sinks.length + 1;
      }
    }, {
      key: 'event',
      value: function event(time, value) {
        var s = this.sinks;
        if (s.length === 0) {
          this.sink.event(time, value);
        } else {
          tryEvent(time, value, this.sink);
          for (var i = 0; i < s.length; ++i) {
            tryEvent(time, value, s[i]);
          }
        }
      }
    }, {
      key: 'end',
      value: function end(time, value) {
        // Important: slice first since sink.end may change
        // the set of sinks
        var s = this.sinks.slice();
        tryEnd(time, value, this.sink);
        for (var i = 0; i < s.length; ++i) {
          tryEnd(time, value, s[i]);
        }
      }
    }, {
      key: 'error',
      value: function error(time, err) {
        // Important: slice first since sink.error may change
        // the set of sinks
        var s = this.sinks.slice();
        this.sink.error(time, err);
        for (var i = 0; i < s.length; ++i) {
          s[i].error(time, err);
        }
      }
    }]);

    return MulticastSource;
  }();

  function multicast(stream) {
    var source = stream.source;
    return source instanceof MulticastSource ? stream : new stream.constructor(new MulticastSource(source));
  }

  exports.MulticastSource = MulticastSource;
  exports.default = multicast;
});
