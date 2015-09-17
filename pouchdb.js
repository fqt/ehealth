(function() {
  function pathToTree(e) {
    for (var t, n = e.shift(), r = [n.id, n.opts, []], o = r; e.length;) n = e.shift(), t = [n.id, n.opts, []], o[2].push(t), o = t;
    return r
  }

  function mergeTree(e, t) {
    for (var n = [{
        tree1: e,
        tree2: t
      }], r = !1; n.length > 0;) {
      var o = n.pop(),
        a = o.tree1,
        i = o.tree2;
      (a[1].status || i[1].status) && (a[1].status = "available" === a[1].status || "available" === i[1].status ? "available" : "missing");
      for (var u = 0; i[2].length > u; u++)
        if (a[2][0]) {
          for (var s = !1, c = 0; a[2].length > c; c++) a[2][c][0] === i[2][u][0] && (n.push({
            tree1: a[2][c],
            tree2: i[2][u]
          }), s = !0);
          s || (r = "new_branch", a[2].push(i[2][u]), a[2].sort())
        } else r = "new_leaf", a[2][0] = i[2][u]
    }
    return {
      conflicts: r,
      tree: e
    }
  }

  function doMerge(e, t, n) {
    var r, o = [],
      a = !1,
      i = !1;
    return e.length ? (e.forEach(function(e) {
      if (e.pos === t.pos && e.ids[0] === t.ids[0]) r = mergeTree(e.ids, t.ids), o.push({
        pos: e.pos,
        ids: r.tree
      }), a = a || r.conflicts, i = !0;
      else if (n !== !0) {
        var u = e.pos < t.pos ? e : t,
          s = e.pos < t.pos ? t : e,
          c = s.pos - u.pos,
          d = [],
          l = [];
        for (l.push({
            ids: u.ids,
            diff: c,
            parent: null,
            parentIdx: null
          }); l.length > 0;) {
          var f = l.pop();
          0 !== f.diff ? f.ids && f.ids[2].forEach(function(e, t) {
            l.push({
              ids: e,
              diff: f.diff - 1,
              parent: f.ids,
              parentIdx: t
            })
          }) : f.ids[0] === s.ids[0] && d.push(f)
        }
        var p = d[0];
        p ? (r = mergeTree(p.ids, s.ids), p.parent[2][p.parentIdx] = r.tree, o.push({
          pos: u.pos,
          ids: u.ids
        }), a = a || r.conflicts, i = !0) : o.push(e)
      } else o.push(e)
    }), i || o.push(t), o.sort(function(e, t) {
      return e.pos - t.pos
    }), {
      tree: o,
      conflicts: a || "internal_node"
    }) : {
      tree: [t],
      conflicts: "new_leaf"
    }
  }

  function stem(e, t) {
    var n = rootToLeaf(e).map(function(e) {
      var n = e.ids.slice(-t);
      return {
        pos: e.pos + (e.ids.length - n.length),
        ids: pathToTree(n)
      }
    });
    return n.reduce(function(e, t) {
      return doMerge(e, t, !0).tree
    }, [n.shift()])
  }

  function replicate(e, t, n, r) {
    function o(e, t, r) {
      if (f.notifyRequestComplete(), n.onChange)
        for (var o = 0; r > o; o++) n.onChange.apply(this, [S]);
      m -= r, S.docs_written += r, l()
    }

    function a() {
      if (!p.length) return f.notifyRequestComplete();
      var e = p.length;
      t.bulkDocs({
        docs: p
      }, {
        new_edits: !1
      }, function(t, n) {
        o(t, n, e)
      }), p = []
    }

    function i(t, n) {
      e.get(t, {
        revs: !0,
        rev: n,
        attachments: !0
      }, function(e, t) {
        f.notifyRequestComplete(), p.push(t), f.enqueue(a)
      })
    }

    function u(e, t) {
      if (f.notifyRequestComplete(), e) return y && r.cancel(), call(n.complete, e, null), void 0;
      if (0 === Object.keys(t).length) return m--, l(), void 0;
      var o = function(e) {
        f.enqueue(i, [a, e])
      };
      for (var a in t) t[a].missing.forEach(o)
    }

    function s(e) {
      t.revsDiff(e, u)
    }

    function c(e) {
      g = e.seq, v.push(e), S.docs_read++, m++;
      var t = {};
      t[e.id] = e.changes.map(function(e) {
        return e.rev
      }), f.enqueue(s, [t])
    }

    function d() {
      _ = !0, l()
    }

    function l() {
      _ && 0 === m && (S.end_time = Date.now(), writeCheckpoint(t, h, g, function(e) {
        call(n.complete, e, S)
      }))
    }
    var f = new RequestManager,
      p = [],
      h = genReplicationId(e, t, n),
      v = [],
      _ = !1,
      m = 0,
      g = 0,
      y = n.continuous || !1,
      E = n.doc_ids,
      S = {
        ok: !0,
        start_time: new Date,
        docs_read: 0,
        docs_written: 0
      };
    fetchCheckpoint(t, h, function(t, o) {
      if (t) return call(n.complete, t);
      if (g = o, !r.cancelled) {
        var a = {
          continuous: y,
          since: g,
          style: "all_docs",
          onChange: c,
          complete: d,
          doc_ids: E
        };
        n.filter && (a.filter = n.filter), n.query_params && (a.query_params = n.query_params);
        var i = e.changes(a);
        n.continuous && (r.cancel = i.cancel)
      }
    })
  }

  function toPouch(e, t) {
    return "string" == typeof e ? new Pouch(e, t) : (t(null, e), void 0)
  }

  function parseUri(e) {
    for (var t = parseUri.options, n = t.parser[t.strictMode ? "strict" : "loose"].exec(e), r = {}, o = 14; o--;) r[t.key[o]] = n[o] || "";
    return r[t.q.name] = {}, r[t.key[12]].replace(t.q.parser, function(e, n, o) {
      n && (r[t.q.name][n] = o)
    }), r
  }

  function getHost(e) {
    if (/http(s?):/.test(e)) {
      var t = parseUri(e);
      t.remote = !0, (t.user || t.password) && (t.auth = {
        username: t.user,
        password: t.password
      });
      var n = t.path.replace(/(^\/|\/$)/g, "").split("/");
      return t.db = n.pop(), t.path = n.join("/"), t
    }
    return {
      host: "",
      path: "/",
      db: e,
      auth: !1
    }
  }

  function genDBUrl(e, t) {
    if (e.remote) {
      var n = e.path ? "/" : "";
      return e.protocol + "://" + e.host + ":" + e.port + "/" + e.path + n + e.db + "/" + t
    }
    return "/" + e.db + "/" + t
  }

  function genUrl(e, t) {
    if (e.remote) {
      var n = e.path ? "/" : "";
      return e.protocol + "://" + e.host + ":" + e.port + "/" + e.path + n + t
    }
    return "/" + t
  }

  function quote(e) {
    return "'" + e + "'"
  }(function() {
    var e = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    Math.uuid = function(t, n) {
      var r = e,
        o = [];
      if (n = n || r.length, t)
        for (var a = 0; t > a; a++) o[a] = r[0 | Math.random() * n];
      else {
        var i;
        o[8] = o[13] = o[18] = o[23] = "-", o[14] = "4";
        for (var a = 0; 36 > a; a++) o[a] || (i = 0 | 16 * Math.random(), o[a] = r[19 == a ? 8 | 3 & i : i])
      }
      return o.join("")
    }
  })();
  var Crypto = {};
  (function() {
    Crypto.MD5 = function(e) {
      function t(e, t) {
        return e << t | e >>> 32 - t
      }

      function n(e, t) {
        var n, r, o, a, i;
        return o = 2147483648 & e, a = 2147483648 & t, n = 1073741824 & e, r = 1073741824 & t, i = (1073741823 & e) + (1073741823 & t), n & r ? 2147483648 ^ i ^ o ^ a : n | r ? 1073741824 & i ? 3221225472 ^ i ^ o ^ a : 1073741824 ^ i ^ o ^ a : i ^ o ^ a
      }

      function r(e, t, n) {
        return e & t | ~e & n
      }

      function o(e, t, n) {
        return e & n | t & ~n
      }

      function a(e, t, n) {
        return e ^ t ^ n
      }

      function i(e, t, n) {
        return t ^ (e | ~n)
      }

      function u(e, o, a, i, u, s, c) {
        return e = n(e, n(n(r(o, a, i), u), c)), n(t(e, s), o)
      }

      function s(e, r, a, i, u, s, c) {
        return e = n(e, n(n(o(r, a, i), u), c)), n(t(e, s), r)
      }

      function c(e, r, o, i, u, s, c) {
        return e = n(e, n(n(a(r, o, i), u), c)), n(t(e, s), r)
      }

      function d(e, r, o, a, u, s, c) {
        return e = n(e, n(n(i(r, o, a), u), c)), n(t(e, s), r)
      }

      function l(e) {
        for (var t, n = e.length, r = n + 8, o = (r - r % 64) / 64, a = 16 * (o + 1), i = Array(a - 1), u = 0, s = 0; n > s;) t = (s - s % 4) / 4, u = 8 * (s % 4), i[t] = i[t] | e.charCodeAt(s) << u, s++;
        return t = (s - s % 4) / 4, u = 8 * (s % 4), i[t] = i[t] | 128 << u, i[a - 2] = n << 3, i[a - 1] = n >>> 29, i
      }

      function f(e) {
        var t, n, r = "",
          o = "";
        for (n = 0; 3 >= n; n++) t = 255 & e >>> 8 * n, o = "0" + t.toString(16), r += o.substr(o.length - 2, 2);
        return r
      }
      var p, h, v, _, m, g, y, E, S, O = [],
        b = 7,
        T = 12,
        R = 17,
        P = 22,
        q = 5,
        D = 9,
        C = 14,
        k = 20,
        I = 4,
        w = 11,
        A = 16,
        x = 23,
        j = 6,
        B = 10,
        N = 15,
        L = 21;
      for (O = l(e), g = 1732584193, y = 4023233417, E = 2562383102, S = 271733878, p = 0; O.length > p; p += 16) h = g, v = y, _ = E, m = S, g = u(g, y, E, S, O[p + 0], b, 3614090360), S = u(S, g, y, E, O[p + 1], T, 3905402710), E = u(E, S, g, y, O[p + 2], R, 606105819), y = u(y, E, S, g, O[p + 3], P, 3250441966), g = u(g, y, E, S, O[p + 4], b, 4118548399), S = u(S, g, y, E, O[p + 5], T, 1200080426), E = u(E, S, g, y, O[p + 6], R, 2821735955), y = u(y, E, S, g, O[p + 7], P, 4249261313), g = u(g, y, E, S, O[p + 8], b, 1770035416), S = u(S, g, y, E, O[p + 9], T, 2336552879), E = u(E, S, g, y, O[p + 10], R, 4294925233), y = u(y, E, S, g, O[p + 11], P, 2304563134), g = u(g, y, E, S, O[p + 12], b, 1804603682), S = u(S, g, y, E, O[p + 13], T, 4254626195), E = u(E, S, g, y, O[p + 14], R, 2792965006), y = u(y, E, S, g, O[p + 15], P, 1236535329), g = s(g, y, E, S, O[p + 1], q, 4129170786), S = s(S, g, y, E, O[p + 6], D, 3225465664), E = s(E, S, g, y, O[p + 11], C, 643717713), y = s(y, E, S, g, O[p + 0], k, 3921069994), g = s(g, y, E, S, O[p + 5], q, 3593408605), S = s(S, g, y, E, O[p + 10], D, 38016083), E = s(E, S, g, y, O[p + 15], C, 3634488961), y = s(y, E, S, g, O[p + 4], k, 3889429448), g = s(g, y, E, S, O[p + 9], q, 568446438), S = s(S, g, y, E, O[p + 14], D, 3275163606), E = s(E, S, g, y, O[p + 3], C, 4107603335), y = s(y, E, S, g, O[p + 8], k, 1163531501), g = s(g, y, E, S, O[p + 13], q, 2850285829), S = s(S, g, y, E, O[p + 2], D, 4243563512), E = s(E, S, g, y, O[p + 7], C, 1735328473), y = s(y, E, S, g, O[p + 12], k, 2368359562), g = c(g, y, E, S, O[p + 5], I, 4294588738), S = c(S, g, y, E, O[p + 8], w, 2272392833), E = c(E, S, g, y, O[p + 11], A, 1839030562), y = c(y, E, S, g, O[p + 14], x, 4259657740), g = c(g, y, E, S, O[p + 1], I, 2763975236), S = c(S, g, y, E, O[p + 4], w, 1272893353), E = c(E, S, g, y, O[p + 7], A, 4139469664), y = c(y, E, S, g, O[p + 10], x, 3200236656), g = c(g, y, E, S, O[p + 13], I, 681279174), S = c(S, g, y, E, O[p + 0], w, 3936430074), E = c(E, S, g, y, O[p + 3], A, 3572445317), y = c(y, E, S, g, O[p + 6], x, 76029189), g = c(g, y, E, S, O[p + 9], I, 3654602809), S = c(S, g, y, E, O[p + 12], w, 3873151461), E = c(E, S, g, y, O[p + 15], A, 530742520), y = c(y, E, S, g, O[p + 2], x, 3299628645), g = d(g, y, E, S, O[p + 0], j, 4096336452), S = d(S, g, y, E, O[p + 7], B, 1126891415), E = d(E, S, g, y, O[p + 14], N, 2878612391), y = d(y, E, S, g, O[p + 5], L, 4237533241), g = d(g, y, E, S, O[p + 12], j, 1700485571), S = d(S, g, y, E, O[p + 3], B, 2399980690), E = d(E, S, g, y, O[p + 10], N, 4293915773), y = d(y, E, S, g, O[p + 1], L, 2240044497), g = d(g, y, E, S, O[p + 8], j, 1873313359), S = d(S, g, y, E, O[p + 15], B, 4264355552), E = d(E, S, g, y, O[p + 6], N, 2734768916), y = d(y, E, S, g, O[p + 13], L, 1309151649), g = d(g, y, E, S, O[p + 4], j, 4149444226), S = d(S, g, y, E, O[p + 11], B, 3174756917), E = d(E, S, g, y, O[p + 2], N, 718787259), y = d(y, E, S, g, O[p + 9], L, 3951481745), g = n(g, h), y = n(y, v), E = n(E, _), S = n(S, m);
      var U = f(g) + f(y) + f(E) + f(S);
      return U.toLowerCase()
    }
  })(),
  function() {
    if (!Object.defineProperty || ! function() {
        try {
          return Object.defineProperty({}, "x", {}), !0
        } catch (e) {
          return !1
        }
      }()) {
      var e = Object.defineProperty;
      Object.defineProperty = function(t, n, r) {
        "use strict";
        if (e) try {
          return e(t, n, r)
        } catch (o) {}
        if (t !== Object(t)) throw new TypeError("Object.defineProperty called on non-object");
        return Object.prototype.__defineGetter__ && "get" in r && Object.prototype.__defineGetter__.call(t, n, r.get), Object.prototype.__defineSetter__ && "set" in r && Object.prototype.__defineSetter__.call(t, n, r.set), "value" in r && (t[n] = r.value), t
      }
    }
  }(), Object.keys || (Object.keys = function(e) {
    if (e !== Object(e)) throw new TypeError("Object.keys called on non-object");
    var t, n = [];
    for (t in e) Object.prototype.hasOwnProperty.call(e, t) && n.push(t);
    return n
  }), Array.prototype.forEach || (Array.prototype.forEach = function(e) {
    "use strict";
    if (void 0 === this || null === this) throw new TypeError;
    var t = Object(this),
      n = t.length >>> 0;
    if ("function" != typeof e) throw new TypeError;
    var r, o = arguments[1];
    for (r = 0; n > r; r++) r in t && e.call(o, t[r], r, t)
  }), Array.prototype.map || (Array.prototype.map = function(e) {
    "use strict";
    if (void 0 === this || null === this) throw new TypeError;
    var t = Object(this),
      n = t.length >>> 0;
    if ("function" != typeof e) throw new TypeError;
    var r = [];
    r.length = n;
    var o, a = arguments[1];
    for (o = 0; n > o; o++) o in t && (r[o] = e.call(a, t[o], o, t));
    return r
  });
  for (var class2type = {}, types = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Object", "Error"], i = 0; types.length > i; i++) {
    var typename = types[i];
    class2type["[object " + typename + "]"] = typename.toLowerCase()
  }
  var core_toString = class2type.toString,
    core_hasOwn = class2type.hasOwnProperty,
    type = function(e) {
      return null === e ? e + "" : "object" == typeof e || "function" == typeof e ? class2type[core_toString.call(e)] || "object" : typeof e
    },
    isWindow = function(e) {
      return null !== e && e === e.window
    },
    isPlainObject = function(e) {
      if (!e || "object" !== type(e) || e.nodeType || isWindow(e)) return !1;
      try {
        if (e.constructor && !core_hasOwn.call(e, "constructor") && !core_hasOwn.call(e.constructor.prototype, "isPrototypeOf")) return !1
      } catch (t) {
        return !1
      }
      var n;
      for (n in e);
      return void 0 === n || core_hasOwn.call(e, n)
    },
    isFunction = function(e) {
      return "function" === type(e)
    },
    isArray = Array.isArray || function(e) {
      return "array" === type(e)
    },
    extend = function() {
      var e, t, n, r, o, a, i = arguments[0] || {},
        u = 1,
        s = arguments.length,
        c = !1;
      for ("boolean" == typeof i && (c = i, i = arguments[1] || {}, u = 2), "object" == typeof i || isFunction(i) || (i = {}), s === u && (i = this, --u); s > u; u++)
        if (null != (e = arguments[u]))
          for (t in e) n = i[t], r = e[t], i !== r && (c && r && (isPlainObject(r) || (o = isArray(r))) ? (o ? (o = !1, a = n && isArray(n) ? n : []) : a = n && isPlainObject(n) ? n : {}, i[t] = extend(c, a, r)) : void 0 !== r && (i[t] = r));
      return i
    };
  "undefined" != typeof module && module.exports && (module.exports = extend);
  var ajax = function ajax(e, t) {
    "function" == typeof e && (t = e, e = {});
    var n = function(e) {
        var t = Array.prototype.slice.call(arguments, 1);
        typeof e == typeof Function && e.apply(this, t)
      },
      r = {
        method: "GET",
        headers: {},
        json: !0,
        processData: !0,
        timeout: 1e4
      };
    if (e = extend(!0, r, e), e.auth) {
      var o = btoa(e.auth.username + ":" + e.auth.password);
      e.headers.Authorization = "Basic " + o
    }
    var a = function(t, r, o) {
        if (e.binary || e.json || !e.processData || "string" == typeof t) {
          if (!e.binary && e.json && "string" == typeof t) try {
            t = JSON.parse(t)
          } catch (a) {
            return n(o, a), void 0
          }
        } else t = JSON.stringify(t);
        n(o, null, t, r)
      },
      i = function(e, t) {
        var r, o = {
          status: e.status
        };
        try {
          r = JSON.parse(e.responseText), o = extend(!0, {}, o, r)
        } catch (a) {}
        n(t, o)
      };
    if ("undefined" != typeof window && window.XMLHttpRequest) {
      var u, s = !1,
        c = new XMLHttpRequest;
      c.open(e.method, e.url), e.json && (e.headers.Accept = "application/json", e.headers["Content-Type"] = e.headers["Content-Type"] || "application/json", e.body && e.processData && "string" != typeof e.body && (e.body = JSON.stringify(e.body))), e.binary && (c.responseType = "arraybuffer");
      for (var d in e.headers) c.setRequestHeader(d, e.headers[d]);
      "body" in e || (e.body = null);
      var l = function() {
        s = !0, c.abort(), n(i, c, t)
      };
      return c.onreadystatechange = function() {
        if (4 === c.readyState && !s)
          if (clearTimeout(u), c.status >= 200 && 300 > c.status) {
            var r;
            r = e.binary ? new Blob([c.response || ""], {
              type: c.getResponseHeader("Content-Type")
            }) : c.responseText, n(a, r, c, t)
          } else n(i, c, t)
      }, e.timeout > 0 && (u = setTimeout(l, e.timeout)), c.send(e.body), {
        abort: l
      }
    }
    return e.json && (e.binary || (e.headers.Accept = "application/json"), e.headers["Content-Type"] = e.headers["Content-Type"] || "application/json"), e.binary && (e.encoding = null, e.json = !1), e.processData || (e.json = !1), request(e, function(r, o, u) {
      if (r) return r.status = o ? o.statusCode : 400, n(i, r, t);
      var s = o.headers["content-type"],
        c = u || "";
      if (e.binary || !e.json && e.processData || "object" == typeof c || !(/json/.test(s) || /^[\s]*\{/.test(c) && /\}[\s]*$/.test(c)) || (c = JSON.parse(c)), o.statusCode >= 200 && 300 > o.statusCode) n(a, c, o, t);
      else {
        if (e.binary) var c = JSON.parse("" + c);
        c.status = o.statusCode, n(t, c)
      }
    })
  };
  "undefined" != typeof module && module.exports && (module.exports = ajax);
  var Pouch = function Pouch(e, t, n) {
    if (!(this instanceof Pouch)) return new Pouch(e, t, n);
    ("function" == typeof t || t === void 0) && (n = t, t = {}), "object" == typeof e && (t = e, e = void 0), n === void 0 && (n = function() {});
    var r = Pouch.parseAdapter(t.name || e);
    if (t.originalName = e, t.name = t.name || r.name, t.adapter = t.adapter || r.adapter, !Pouch.adapters[t.adapter]) throw "Adapter is missing";
    if (!Pouch.adapters[t.adapter].valid()) throw "Invalid Adapter";
    var o = new PouchAdapter(t, function(e, t) {
      if (e) return n && n(e), void 0;
      for (var r in Pouch.plugins) {
        var o = Pouch.plugins[r](t);
        for (var a in o) a in t || (t[a] = o[a])
      }
      t.taskqueue.ready(!0), t.taskqueue.execute(t), n(null, t)
    });
    for (var a in o) this[a] = o[a];
    for (var i in Pouch.plugins) {
      var u = Pouch.plugins[i](this);
      for (var s in u) s in this || (this[s] = u[s])
    }
  };
  if (Pouch.DEBUG = !1, Pouch.openReqList = {}, Pouch.adapters = {}, Pouch.plugins = {}, Pouch.prefix = "_pouch_", Pouch.parseAdapter = function(e) {
      var t, n = e.match(/([a-z\-]*):\/\/(.*)/);
      if (n) {
        if (e = /http(s?)/.test(n[1]) ? n[1] + "://" + n[2] : n[2], t = n[1], !Pouch.adapters[t].valid()) throw "Invalid adapter";
        return {
          name: e,
          adapter: n[1]
        }
      }
      for (var r = ["idb", "leveldb", "websql"], o = 0; r.length > o; ++o)
        if (r[o] in Pouch.adapters) {
          t = Pouch.adapters[r[o]];
          var a = "use_prefix" in t ? t.use_prefix : !0;
          return {
            name: a ? Pouch.prefix + e : e,
            adapter: r[o]
          }
        }
      throw "No valid adapter found"
    }, Pouch.destroy = function(e, t) {
      var n = Pouch.parseAdapter(e),
        r = function(r) {
          if (r) return t(r), void 0;
          for (var o in Pouch.plugins) Pouch.plugins[o]._delete(e);
          Pouch.DEBUG && console.log(e + ": Delete Database"), Pouch.adapters[n.adapter].destroy(n.name, t)
        };
      Pouch.removeFromAllDbs(n, r)
    }, Pouch.removeFromAllDbs = function(e, t) {
      if (!Pouch.enableAllDbs) return t(), void 0;
      var n = e.adapter;
      return "http" === n || "https" === n ? (t(), void 0) : (new Pouch(Pouch.allDBName(e.adapter), function(n, r) {
        if (n) return console.error(n), t(), void 0;
        var o = Pouch.dbName(e.adapter, e.name);
        r.get(o, function(e, n) {
          e ? t() : r.remove(n, function(e) {
            e && console.error(e), t()
          })
        })
      }), void 0)
    }, Pouch.adapter = function(e, t) {
      t.valid() && (Pouch.adapters[e] = t)
    }, Pouch.plugin = function(e, t) {
      Pouch.plugins[e] = t
    }, Pouch.enableAllDbs = !1, Pouch.ALL_DBS = "_allDbs", Pouch.dbName = function(e, t) {
      return [e, "-", t].join("")
    }, Pouch.realDBName = function(e, t) {
      return [e, "://", t].join("")
    }, Pouch.allDBName = function(e) {
      return [e, "://", Pouch.prefix + Pouch.ALL_DBS].join("")
    }, Pouch.open = function(e, t) {
      if (!Pouch.enableAllDbs) return t(), void 0;
      var n = e.adapter;
      return "http" === n || "https" === n ? (t(), void 0) : (new Pouch(Pouch.allDBName(n), function(r, o) {
        if (r) return console.error(r), t(), void 0;
        var a = Pouch.dbName(n, e.name);
        o.get(a, function(n) {
          n && 404 === n.status ? o.put({
            _id: a,
            dbname: e.originalName
          }, function(e) {
            e && console.error(e), t()
          }) : t()
        })
      }), void 0)
    }, Pouch.allDbs = function(e) {
      var t = function(n, r) {
          if (0 === n.length) {
            var o = [];
            return r.forEach(function(e) {
              var t = o.some(function(t) {
                return t.id === e.id
              });
              t || o.push(e)
            }), e(null, o.map(function(e) {
              return e.doc.dbname
            })), void 0
          }
          var a = n.shift();
          return "http" === a || "https" === a ? (t(n, r), void 0) : (new Pouch(Pouch.allDBName(a), function(o, a) {
            return o ? (e(o), void 0) : (a.allDocs({
              include_docs: !0
            }, function(o, a) {
              return o ? (e(o), void 0) : (r.unshift.apply(r, a.rows), t(n, r), void 0)
            }), void 0)
          }), void 0)
        },
        n = Object.keys(Pouch.adapters);
      t(n, [])
    }, Pouch.uuids = function(e, t) {
      "object" != typeof t && (t = {});
      for (var n = t.length, r = t.radix, o = []; e > o.push(Math.uuid(n, r)););
      return o
    }, Pouch.uuid = function(e) {
      return Pouch.uuids(1, e)[0]
    }, Pouch.Errors = {
      MISSING_BULK_DOCS: {
        status: 400,
        error: "bad_request",
        reason: "Missing JSON list of 'docs'"
      },
      MISSING_DOC: {
        status: 404,
        error: "not_found",
        reason: "missing"
      },
      REV_CONFLICT: {
        status: 409,
        error: "conflict",
        reason: "Document update conflict"
      },
      INVALID_ID: {
        status: 400,
        error: "invalid_id",
        reason: "_id field must contain a string"
      },
      MISSING_ID: {
        status: 412,
        error: "missing_id",
        reason: "_id is required for puts"
      },
      RESERVED_ID: {
        status: 400,
        error: "bad_request",
        reason: "Only reserved document ids may start with underscore."
      },
      NOT_OPEN: {
        status: 412,
        error: "precondition_failed",
        reason: "Database not open so cannot close"
      },
      UNKNOWN_ERROR: {
        status: 500,
        error: "unknown_error",
        reason: "Database encountered an unknown error"
      },
      BAD_ARG: {
        status: 500,
        error: "badarg",
        reason: "Some query argument is invalid"
      },
      INVALID_REQUEST: {
        status: 400,
        error: "invalid_request",
        reason: "Request was invalid"
      },
      QUERY_PARSE_ERROR: {
        status: 400,
        error: "query_parse_error",
        reason: "Some query parameter is invalid"
      },
      DOC_VALIDATION: {
        status: 500,
        error: "doc_validation",
        reason: "Bad special document member"
      },
      BAD_REQUEST: {
        status: 400,
        error: "bad_request",
        reason: "Something wrong with the request"
      }
    }, Pouch.error = function(e, t) {
      return extend({}, e, {
        reason: t
      })
    }, "undefined" != typeof module && module.exports) {
    global.Pouch = Pouch, Pouch.merge = require("./pouch.merge.js").merge, Pouch.collate = require("./pouch.collate.js").collate, Pouch.replicate = require("./pouch.replicate.js").replicate, Pouch.utils = require("./pouch.utils.js"), extend = Pouch.utils.extend, module.exports = Pouch;
    var PouchAdapter = require("./pouch.adapter.js"),
      adapters = ["leveldb", "http"];
    adapters.map(function(e) {
      var t = "./adapters/pouch." + e + ".js";
      require(t)
    }), require("./plugins/pouchdb.mapreduce.js"), require("./deps/uuid.js")
  } else window.Pouch = Pouch;
  "undefined" != typeof module && module.exports && (module.exports = Pouch);
  var stringCollate = function(e, t) {
      return e === t ? 0 : e > t ? 1 : -1
    },
    objectCollate = function(e, t) {
      for (var n = Object.keys(e), r = Object.keys(t), o = Math.min(n.length, r.length), a = 0; o > a; a++) {
        var i = Pouch.collate(n[a], r[a]);
        if (0 !== i) return i;
        if (i = Pouch.collate(e[n[a]], t[r[a]]), 0 !== i) return i
      }
      return n.length === r.length ? 0 : n.length > r.length ? 1 : -1
    },
    arrayCollate = function(e, t) {
      for (var n = Math.min(e.length, t.length), r = 0; n > r; r++) {
        var o = Pouch.collate(e[r], t[r]);
        if (0 !== o) return o
      }
      return e.length === t.length ? 0 : e.length > t.length ? 1 : -1
    },
    collationIndex = function(e) {
      var t = ["boolean", "number", "string", "object"];
      return -1 !== t.indexOf(typeof e) ? null === e ? 1 : t.indexOf(typeof e) + 2 : Array.isArray(e) ? 4.5 : void 0
    };
  if (Pouch.collate = function(e, t) {
      var n = collationIndex(e),
        r = collationIndex(t);
      return 0 !== n - r ? n - r : null === e ? 0 : "number" == typeof e ? e - t : "boolean" == typeof e ? t > e ? -1 : 1 : "string" == typeof e ? stringCollate(e, t) : Array.isArray(e) ? arrayCollate(e, t) : "object" == typeof e ? objectCollate(e, t) : void 0
    }, "undefined" != typeof module && module.exports) {
    module.exports = Pouch;
    var utils = require("./pouch.utils.js");
    for (var k in utils) global[k] = utils[k]
  }
  Pouch.merge = function(e, t, n) {
    e = extend(!0, [], e), t = extend(!0, {}, t);
    var r = doMerge(e, t);
    return {
      tree: stem(r.tree, n),
      conflicts: r.conflicts
    }
  }, Pouch.merge.winningRev = function(e) {
    var t = [];
    return Pouch.merge.traverseRevTree(e.rev_tree, function(e, n, r, o, a) {
      e && t.push({
        pos: n,
        id: r,
        deleted: !!a.deleted
      })
    }), t.sort(function(e, t) {
      return e.deleted !== t.deleted ? e.deleted > t.deleted ? 1 : -1 : e.pos !== t.pos ? t.pos - e.pos : e.id < t.id ? 1 : -1
    }), t[0].pos + "-" + t[0].id
  }, Pouch.merge.traverseRevTree = function(e, t) {
    var n = [];
    for (e.forEach(function(e) {
        n.push({
          pos: e.pos,
          ids: e.ids
        })
      }); n.length > 0;) {
      var r = n.pop(),
        o = r.pos,
        a = r.ids,
        i = t(0 === a[2].length, o, a[0], r.ctx, a[1]);
      a[2].forEach(function(e) {
        n.push({
          pos: o + 1,
          ids: e,
          ctx: i
        })
      })
    }
  }, Pouch.merge.collectLeaves = function(e) {
    var t = [];
    return Pouch.merge.traverseRevTree(e, function(e, n, r, o, a) {
      e && t.unshift({
        rev: n + "-" + r,
        pos: n,
        opts: a
      })
    }), t.sort(function(e, t) {
      return t.pos - e.pos
    }), t.map(function(e) {
      delete e.pos
    }), t
  }, Pouch.merge.collectConflicts = function(e) {
    var t = Pouch.merge.winningRev(e),
      n = Pouch.merge.collectLeaves(e.rev_tree),
      r = [];
    return n.forEach(function(e) {
      e.rev === t || e.opts.deleted || r.push(e.rev)
    }), r
  }, "undefined" != typeof module && module.exports && (module.exports = Pouch);
  var Promise = function() {
      this.cancelled = !1, this.cancel = function() {
        this.cancelled = !0
      }
    },
    RequestManager = function() {
      var e = [],
        t = {},
        n = !1;
      return t.enqueue = function(r, o) {
        e.push({
          fun: r,
          args: o
        }), n || t.process()
      }, t.process = function() {
        if (!n && e.length) {
          n = !0;
          var t = e.shift();
          t.fun.apply(null, t.args)
        }
      }, t.notifyRequestComplete = function() {
        n = !1, t.process()
      }, t
    },
    genReplicationId = function(e, t, n) {
      var r = n.filter ? "" + n.filter : "";
      return "_local/" + Crypto.MD5(e.id() + t.id() + r)
    },
    fetchCheckpoint = function(e, t, n) {
      e.get(t, function(e, t) {
        e && 404 === e.status ? n(null, 0) : n(null, t.last_seq)
      })
    },
    writeCheckpoint = function(e, t, n, r) {
      var o = {
        _id: t,
        last_seq: n
      };
      e.get(o._id, function(t, n) {
        n && n._rev && (o._rev = n._rev), e.put(o, function() {
          r()
        })
      })
    };
  Pouch.replicate = function(e, t, n, r) {
    n instanceof Function && (r = n, n = {}), void 0 === n && (n = {}), n.complete = r;
    var o = new Promise;
    return toPouch(e, function(e, a) {
      return e ? call(r, e) : (toPouch(t, function(e, t) {
        return e ? call(r, e) : (replicate(a, t, n, o), void 0)
      }), void 0)
    }), o
  };
  var call = function(e) {
      var t = Array.prototype.slice.call(arguments, 1);
      typeof e == typeof Function && e.apply(this, t)
    },
    yankError = function(e) {
      return function(t, n) {
        t || n[0].error ? call(e, t || n[0]) : call(e, null, n[0])
      }
    },
    isLocalId = function(e) {
      return /^_local/.test(e)
    },
    isAttachmentId = function(e) {
      return /\//.test(e) && !isLocalId(e) && !/^_design/.test(e)
    },
    parseDocId = function(e) {
      var t = "string" != typeof e || /^_(design|local)\//.test(e) ? [e] : e.split("/");
      return {
        docId: t[0],
        attachmentId: t.splice(1).join("/").replace(/^\/+/, "")
      }
    },
    isValidId = function(e) {
      return /^_/.test(e) ? /^_(design|local)/.test(e) : !0
    },
    reservedWords = ["_id", "_rev", "_attachments", "_deleted", "_revisions", "_revs_info", "_conflicts", "_deleted_conflicts", "_local_seq", "_rev_tree"],
    parseDoc = function(e, t) {
      var n = null;
      if (e._id) {
        var r = parseDocId(e._id);
        if ("" !== r.attachmentId) {
          var o = btoa(JSON.stringify(e));
          e = {
            _id: r.docId
          }, e._attachments || (e._attachments = {}), e._attachments[r.attachmentId] = {
            content_type: "application/json",
            data: o
          }
        }
      }
      var a, i, u, s = {
        status: "available"
      };
      if (e._deleted && (s.deleted = !0), t)
        if (e._id || (e._id = Pouch.uuid()), i = Pouch.uuid({
            length: 32,
            radix: 16
          }).toLowerCase(), e._rev) {
          if (u = /^(\d+)-(.+)$/.exec(e._rev), !u) throw "invalid value for property '_rev'";
          e._rev_tree = [{
            pos: parseInt(u[1], 10),
            ids: [u[2], {
                status: "missing"
              },
              [
                [i, s, []]
              ]
            ]
          }], a = parseInt(u[1], 10) + 1
        } else e._rev_tree = [{
          pos: 1,
          ids: [i, s, []]
        }], a = 1;
      else if (e._revisions && (e._rev_tree = [{
          pos: e._revisions.start - e._revisions.ids.length + 1,
          ids: e._revisions.ids.reduce(function(e, t) {
            return null === e ? [t, s, []] : [t, {
                status: "missing"
              },
              [e]
            ]
          }, null)
        }], a = e._revisions.start, i = e._revisions.ids[0]), !e._rev_tree) {
        if (u = /^(\d+)-(.+)$/.exec(e._rev), !u) return Pouch.Errors.BAD_ARG;
        a = parseInt(u[1], 10), i = u[2], e._rev_tree = [{
          pos: parseInt(u[1], 10),
          ids: [u[2], s, []]
        }]
      }
      "string" != typeof e._id ? n = Pouch.Errors.INVALID_ID : isValidId(e._id) || (n = Pouch.Errors.RESERVED_ID);
      for (var c in e) e.hasOwnProperty(c) && "_" === c[0] && -1 === reservedWords.indexOf(c) && (n = extend({}, Pouch.Errors.DOC_VALIDATION), n.reason += ": " + c);
      return e._id = decodeURIComponent(e._id), e._rev = [a, i].join("-"), n ? n : Object.keys(e).reduce(function(t, n) {
        return /^_/.test(n) && "_attachments" !== n ? t.metadata[n.slice(1)] = e[n] : t.data[n] = e[n], t
      }, {
        metadata: {},
        data: {}
      })
    },
    compareRevs = function(e, t) {
      return e.id !== t.id ? e.id < t.id ? -1 : 1 : e.deleted ^ t.deleted ? e.deleted ? -1 : 1 : e.rev_tree[0].pos === t.rev_tree[0].pos ? e.rev_tree[0].ids < t.rev_tree[0].ids ? -1 : 1 : e.rev_tree[0].start < t.rev_tree[0].start ? -1 : 1
    },
    computeHeight = function(e) {
      var t = {},
        n = [];
      return Pouch.merge.traverseRevTree(e, function(e, r, o, a) {
        var i = r + "-" + o;
        return e && (t[i] = 0), void 0 !== a && n.push({
          from: a,
          to: i
        }), i
      }), n.reverse(), n.forEach(function(e) {
        t[e.from] = void 0 === t[e.from] ? 1 + t[e.to] : Math.min(t[e.from], 1 + t[e.to])
      }), t
    },
    arrayFirst = function(e, t) {
      for (var n = 0; e.length > n; n++)
        if (t(e[n], n) === !0) return e[n];
      return !1
    },
    filterChange = function(e) {
      return function(t) {
        var n = {};
        return n.query = e.query_params, e.filter && !e.filter.call(this, t.doc, n) ? !1 : e.doc_ids && -1 !== e.doc_ids.indexOf(t.id) ? !1 : (e.include_docs || delete t.doc, !0)
      }
    },
    processChanges = function(e, t, n) {
      t = t.filter(filterChange(e)), e.limit && e.limit < t.length && (t.length = e.limit), t.forEach(function(t) {
        call(e.onChange, t)
      }), call(e.complete, null, {
        results: t,
        last_seq: n
      })
    },
    rootToLeaf = function(e) {
      var t = [];
      return Pouch.merge.traverseRevTree(e, function(e, n, r, o, a) {
        if (o = o ? o.slice(0) : [], o.push({
            id: r,
            opts: a
          }), e) {
          var i = n + 1 - o.length;
          t.unshift({
            pos: i,
            ids: o
          })
        }
        return o
      }), t
    },
    isDeleted = function(e, t) {
      t || (t = Pouch.merge.winningRev(e)), t.indexOf("-") >= 0 && (t = t.split("-")[1]);
      var n = !1;
      return Pouch.merge.traverseRevTree(e.rev_tree, function(e, r, o, a, i) {
        o === t && (n = !!i.deleted)
      }), n
    },
    isChromeApp = function() {
      return "undefined" != typeof chrome && chrome.storage !== void 0 && chrome.storage.local !== void 0
    },
    isCordova = function() {
      return "undefined" != typeof cordova || "undefined" != typeof PhoneGap || "undefined" != typeof phonegap
    };
  if ("undefined" != typeof module && module.exports) {
    var crypto = require("crypto"),
      Crypto = {
        MD5: function(e) {
          return crypto.createHash("md5").update(e).digest("hex")
        }
      },
      extend = require("./deps/extend"),
      ajax = require("./deps/ajax");
    request = require("request"), _ = require("underscore"), $ = _, module.exports = {
      Crypto: Crypto,
      call: call,
      yankError: yankError,
      isLocalId: isLocalId,
      isAttachmentId: isAttachmentId,
      parseDocId: parseDocId,
      parseDoc: parseDoc,
      isDeleted: isDeleted,
      compareRevs: compareRevs,
      computeHeight: computeHeight,
      arrayFirst: arrayFirst,
      filterChange: filterChange,
      processChanges: processChanges,
      atob: function(e) {
        var t = new Buffer(e, "base64");
        if (t.toString("base64") !== e) throw "Cannot base64 encode full string";
        return t.toString("binary")
      },
      btoa: function(e) {
        return new Buffer(e, "binary").toString("base64")
      },
      extend: extend,
      ajax: ajax,
      rootToLeaf: rootToLeaf,
      isChromeApp: isChromeApp,
      isCordova: isCordova
    }
  }
  var Changes = function() {
      var e = {},
        t = {};
      return isChromeApp() ? chrome.storage.onChanged.addListener(function(t) {
        e.notify(t.db_name.newValue)
      }) : window.addEventListener("storage", function(t) {
        e.notify(t.key)
      }), e.addListener = function(e, n, r, o) {
        t[e] || (t[e] = {}), t[e][n] = {
          db: r,
          opts: o
        }
      }, e.removeListener = function(e, n) {
        delete t[e][n]
      }, e.clearListeners = function(e) {
        delete t[e]
      }, e.notifyLocalWindows = function(e) {
        isChromeApp() ? chrome.storage.local.set({
          db_name: e
        }) : localStorage[e] = "a" === localStorage[e] ? "b" : "a"
      }, e.notify = function(e) {
        t[e] && Object.keys(t[e]).forEach(function(n) {
          var r = t[e][n].opts;
          t[e][n].db.changes({
            include_docs: r.include_docs,
            conflicts: r.conflicts,
            continuous: !1,
            descending: !1,
            filter: r.filter,
            since: r.since,
            query_params: r.query_params,
            onChange: function(e) {
              e.seq > r.since && !r.cancelled && (r.since = e.seq, call(r.onChange, e))
            }
          })
        })
      }, e
    },
    PouchAdapter = function(e, t) {
      var n = {},
        r = Pouch.adapters[e.adapter](e, function(r, o) {
          if (r) return t && t(r), void 0;
          for (var a in n) o.hasOwnProperty(a) || (o[a] = n[a]);
          e.name === Pouch.prefix + Pouch.ALL_DBS ? t(r, o) : Pouch.open(e, function(e) {
            t(e, o)
          })
        }),
        o = e.auto_compaction === !0,
        a = function(e) {
          return o ? function(t, n) {
            if (t) call(e, t);
            else {
              var r = n.length,
                o = function() {
                  r--, r || call(e, null, n)
                };
              n.forEach(function(e) {
                e.ok ? i(e.id, 1, o) : o()
              })
            }
          } : e
        };
      n.post = function(e, t, n) {
        return "function" == typeof t && (n = t, t = {}), r.bulkDocs({
          docs: [e]
        }, t, a(yankError(n)))
      }, n.put = function(e, t, n) {
        return "function" == typeof t && (n = t, t = {}), e && "_id" in e ? r.bulkDocs({
          docs: [e]
        }, t, a(yankError(n))) : call(n, Pouch.Errors.MISSING_ID)
      }, n.putAttachment = function(e, t, r, o, a) {
        function i(t) {
          t._attachments = t._attachments || {}, t._attachments[e.attachmentId] = {
            content_type: o,
            data: r
          }, n.put(t, a)
        }
        "function" == typeof o && (a = o, o = r, r = t, t = null), o === void 0 && (o = r, r = t, t = null), e = parseDocId(e), n.get(e.docId, function(n, r) {
          return n && n.error === Pouch.Errors.MISSING_DOC.error ? (i({
            _id: e.docId
          }), void 0) : n ? (call(a, n), void 0) : r._rev !== t ? (call(a, Pouch.Errors.REV_CONFLICT), void 0) : (i(r), void 0)
        })
      }, n.removeAttachment = function(e, t, r) {
        e = parseDocId(e), n.get(e.docId, function(o, a) {
          return o ? (call(r, o), void 0) : a._rev !== t ? (call(r, Pouch.Errors.REV_CONFLICT), void 0) : (a._attachments = a._attachments || {}, delete a._attachments[e.attachmentId], n.put(a, r), void 0)
        })
      }, n.remove = function(e, t, n) {
        "function" == typeof t && (n = t, t = {}), void 0 === t && (t = {}), t.was_delete = !0;
        var o = {
          _id: e._id,
          _rev: e._rev
        };
        return o._deleted = !0, r.bulkDocs({
          docs: [o]
        }, t, yankError(n))
      }, n.revsDiff = function(e, t, r) {
        function o(t, n, o) {
          return e[o].map(function(e) {
            var t = function(t) {
              return t.rev !== e
            };
            (!n || n._revs_info.every(t)) && (u[o] || (u[o] = {
              missing: []
            }), u[o].missing.push(e))
          }), ++i === a.length ? call(r, null, u) : void 0
        }
        "function" == typeof t && (r = t, t = {});
        var a = Object.keys(e),
          i = 0,
          u = {};
        a.map(function(e) {
          n.get(e, {
            revs_info: !0
          }, function(t, n) {
            o(t, n, e)
          })
        })
      };
      var i = function(e, t, n) {
        r._getRevisionTree(e, function(o, a) {
          if (o) return call(n);
          var i = computeHeight(a),
            u = [],
            s = [];
          Object.keys(i).forEach(function(e) {
            i[e] > t && u.push(e)
          }), Pouch.merge.traverseRevTree(a, function(e, t, n, r, o) {
            var a = t + "-" + n;
            "available" === o.status && -1 !== u.indexOf(a) && (o.status = "missing", s.push(a))
          }), r._doCompaction(e, a, s, n)
        })
      };
      n.compact = function(e) {
        n.changes({
          complete: function(t, n) {
            if (t) return call(e), void 0;
            var r = n.results.length;
            return r ? (n.results.forEach(function(t) {
              i(t.id, 0, function() {
                r--, r || call(e)
              })
            }), void 0) : (call(e), void 0)
          }
        })
      }, n.get = function(e, t, o) {
        function a() {
          var r = [],
            a = i.length;
          return a ? (i.forEach(function(i) {
            n.get(e, {
              rev: i,
              revs: t.revs
            }, function(e, t) {
              e ? r.push({
                missing: i
              }) : r.push({
                ok: t
              }), a--, a || call(o, null, r)
            })
          }), void 0) : call(o, null, r)
        }
        if (!n.taskqueue.ready()) return n.taskqueue.addTask("get", arguments), void 0;
        "function" == typeof t && (o = t, t = {});
        var i = []; {
          if (!t.open_revs) return e = parseDocId(e), "" !== e.attachmentId ? r._get(e, t, function(t, n) {
            return t ? call(o, t) : n.doc._attachments && n.doc._attachments[e.attachmentId] ? (r._getAttachment(n.doc._attachments[e.attachmentId], {
              encode: !1,
              ctx: n.ctx
            }, function(e, t) {
              return call(o, null, t)
            }), void 0) : call(o, Pouch.Errors.MISSING_DOC)
          }) : r._get(e, t, function(e, n) {
            if (e) return call(o, e);
            var a = n.doc,
              i = n.metadata,
              u = n.ctx;
            if (t.conflicts) {
              var s = Pouch.merge.collectConflicts(i);
              s.length && (a._conflicts = s)
            }
            if (t.revs || t.revs_info) {
              var c = rootToLeaf(i.rev_tree),
                d = arrayFirst(c, function(e) {
                  return -1 !== e.ids.map(function(e) {
                    return e.id
                  }).indexOf(a._rev.split("-")[1])
                });
              if (d.ids.splice(d.ids.map(function(e) {
                  return e.id
                }).indexOf(a._rev.split("-")[1]) + 1), d.ids.reverse(), t.revs && (a._revisions = {
                  start: d.pos + d.ids.length - 1,
                  ids: d.ids.map(function(e) {
                    return e.id
                  })
                }), t.revs_info) {
                var l = d.pos + d.ids.length;
                a._revs_info = d.ids.map(function(e) {
                  return l--, {
                    rev: l + "-" + e.id,
                    status: e.opts.status
                  }
                })
              }
            }
            if (t.local_seq && (a._local_seq = n.metadata.seq), t.attachments && a._attachments) {
              var f = a._attachments,
                p = Object.keys(f).length;
              Object.keys(f).forEach(function(e) {
                r._getAttachment(f[e], {
                  encode: !0,
                  ctx: u
                }, function(t, n) {
                  a._attachments[e].data = n, --p || call(o, null, a)
                })
              })
            } else {
              if (a._attachments)
                for (var h in a._attachments) a._attachments[h].stub = !0;
              call(o, null, a)
            }
          });
          if ("all" === t.open_revs) r._getRevisionTree(e, function(e, t) {
            e && (t = []), i = Pouch.merge.collectLeaves(t).map(function(e) {
              return e.rev
            }), a()
          });
          else {
            if (!Array.isArray(t.open_revs)) return call(o, Pouch.error(Pouch.Errors.UNKNOWN_ERROR, "function_clause"));
            i = t.open_revs;
            for (var u = 0; i.length > u; u++) {
              var s = i[u];
              if ("string" != typeof s || !/^\d+-/.test(s)) return call(o, Pouch.error(Pouch.Errors.BAD_REQUEST, "Invalid rev format"))
            }
            a()
          }
        }
      }, n.getAttachment = function(e, t, n) {
        t instanceof Function && (n = t, t = {}), r.get(e, function(e, t) {
          n(e, t)
        })
      }, n.allDocs = function(e, t) {
        if (!n.taskqueue.ready()) return n.taskqueue.addTask("allDocs", arguments), void 0;
        if ("function" == typeof e && (t = e, e = {}), "keys" in e) {
          if ("startkey" in e) return call(t, Pouch.error(Pouch.Errors.QUERY_PARSE_ERROR, "Query parameter `start_key` is not compatible with multi-get")), void 0;
          if ("endkey" in e) return call(t, Pouch.error(Pouch.Errors.QUERY_PARSE_ERROR, "Query parameter `end_key` is not compatible with multi-get")), void 0
        }
        return r._allDocs(e, t)
      }, n.changes = function(e) {
        return n.taskqueue.ready() ? (e = extend(!0, {}, e), e.since || (e.since = 0), "descending" in e || (e.descending = !1), e.limit = 0 === e.limit ? 1 : e.limit, r._changes(e)) : (n.taskqueue.addTask("changes", arguments), void 0)
      }, n.close = function(e) {
        return n.taskqueue.ready() ? r._close(e) : (n.taskqueue.addTask("close", arguments), void 0)
      }, n.info = function(e) {
        return n.taskqueue.ready() ? r._info(e) : (n.taskqueue.addTask("info", arguments), void 0)
      }, n.id = function() {
        return r._id()
      }, n.type = function() {
        return "function" == typeof r._type ? r._type() : e.adapter
      }, n.bulkDocs = function(e, t, o) {
        return n.taskqueue.ready() ? ("function" == typeof t && (o = t, t = {}), t = t ? extend(!0, {}, t) : {}, !e || !e.docs || 1 > e.docs.length ? call(o, Pouch.Errors.MISSING_BULK_DOCS) : Array.isArray(e.docs) ? (e = extend(!0, {}, e), "new_edits" in t || (t.new_edits = !0), r._bulkDocs(e, t, a(o))) : call(o, Pouch.Errors.QUERY_PARSE_ERROR)) : (n.taskqueue.addTask("bulkDocs", arguments), void 0)
      };
      var u = {};
      u.ready = !1, u.queue = [], n.taskqueue = {}, n.taskqueue.execute = function(e) {
        u.ready && u.queue.forEach(function(t) {
          e[t.task].apply(null, t.parameters)
        })
      }, n.taskqueue.ready = function() {
        return 0 === arguments.length ? u.ready : (u.ready = arguments[0], void 0)
      }, n.taskqueue.addTask = function(e, t) {
        u.queue.push({
          task: e,
          parameters: t
        })
      }, n.replicate = {}, n.replicate.from = function(e, t, n) {
        return "function" == typeof t && (n = t, t = {}), Pouch.replicate(e, r, t, n)
      }, n.replicate.to = function(e, t, n) {
        return "function" == typeof t && (n = t, t = {}), Pouch.replicate(r, e, t, n)
      };
      for (var s in n) r.hasOwnProperty(s) || (r[s] = n[s]);
      return e.skipSetup && (n.taskqueue.ready(!0), n.taskqueue.execute(n)), isCordova() && cordova.fireWindowEvent(e.name + "_pouch", {}), r
    };
  "undefined" != typeof module && module.exports && (module.exports = PouchAdapter);
  var HTTP_TIMEOUT = 1e4;
  parseUri.options = {
    strictMode: !1,
    key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
    q: {
      name: "queryKey",
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  };
  var HttpPouch = function(e, t) {
    var n = getHost(e.name);
    e.auth && (n.auth = e.auth);
    var r = genDBUrl(n, ""),
      o = {},
      a = {
        list: [],
        get: function(e, t) {
          "function" == typeof e && (t = e, e = {
            count: 10
          });
          var r = function(e, n) {
              !e && "uuids" in n ? (a.list = a.list.concat(n.uuids), call(t, null, "OK")) : call(t, e || Pouch.Errors.UNKNOWN_ERROR)
            },
            o = "?count=" + e.count;
          ajax({
            auth: n.auth,
            method: "GET",
            url: genUrl(n, "_uuids") + o
          }, r)
        }
      },
      i = function() {
        ajax({
          auth: n.auth,
          method: "PUT",
          url: r
        }, function(e) {
          e && 401 === e.status ? ajax({
            auth: n.auth,
            method: "HEAD",
            url: r
          }, function(e) {
            e ? call(t, e) : call(t, null, o)
          }) : e && 412 !== e.status ? call(t, Pouch.Errors.UNKNOWN_ERROR) : call(t, null, o)
        })
      };
    return e.skipSetup || ajax({
      auth: n.auth,
      method: "GET",
      url: r
    }, function(e) {
      e ? 404 === e.status ? i() : call(t, e) : call(t, null, o)
    }), o.type = function() {
      return "http"
    }, o.id = function() {
      return genDBUrl(n, "")
    }, o.request = function(e, t) {
      return o.taskqueue.ready() ? (e.auth = n.auth, e.url = genDBUrl(n, e.url), ajax(e, t), void 0) : (o.taskqueue.addTask("request", arguments), void 0)
    }, o.compact = function(e, t) {
      return o.taskqueue.ready() ? ("function" == typeof e && (t = e, e = {}), ajax({
        auth: n.auth,
        url: genDBUrl(n, "_compact"),
        method: "POST"
      }, function() {
        function n() {
          o.info(function(r, o) {
            o.compact_running ? setTimeout(n, e.interval || 200) : call(t, null)
          })
        }
        "function" == typeof t && n()
      }), void 0) : (o.taskqueue.addTask("compact", arguments), void 0)
    }, o.info = function(e) {
      return o.taskqueue.ready() ? (ajax({
        auth: n.auth,
        method: "GET",
        url: genDBUrl(n, "")
      }, e), void 0) : (o.taskqueue.addTask("info", arguments), void 0)
    }, o.get = function(e, t, r) {
      if (!o.taskqueue.ready()) return o.taskqueue.addTask("get", arguments), void 0;
      "function" == typeof t && (r = t, t = {});
      var a = [];
      t.revs && a.push("revs=true"), t.revs_info && a.push("revs_info=true"), t.local_seq && a.push("local_seq=true"), t.open_revs && ("all" !== t.open_revs && (t.open_revs = JSON.stringify(t.open_revs)), a.push("open_revs=" + t.open_revs)), t.attachments && a.push("attachments=true"), t.rev && a.push("rev=" + t.rev), t.conflicts && a.push("conflicts=" + t.conflicts), a = a.join("&"), a = "" === a ? "" : "?" + a;
      var i = {
          auth: n.auth,
          method: "GET",
          url: genDBUrl(n, e + a)
        },
        u = e.split("/");
      (u.length > 1 && "_design" !== u[0] && "_local" !== u[0] || u.length > 2 && "_design" === u[0] && "_local" !== u[0]) && (i.binary = !0), ajax(i, function(e, t, n) {
        return e ? call(r, e) : (call(r, null, t, n), void 0)
      })
    }, o.remove = function(e, t, r) {
      return o.taskqueue.ready() ? ("function" == typeof t && (r = t, t = {}), ajax({
        auth: n.auth,
        method: "DELETE",
        url: genDBUrl(n, e._id) + "?rev=" + e._rev
      }, r), void 0) : (o.taskqueue.addTask("remove", arguments), void 0)
    }, o.removeAttachment = function(e, t, r) {
      return o.taskqueue.ready() ? (ajax({
        auth: n.auth,
        method: "DELETE",
        url: genDBUrl(n, e) + "?rev=" + t
      }, r), void 0) : (o.taskqueue.addTask("removeAttachment", arguments), void 0)
    }, o.putAttachment = function(e, t, r, a, i) {
      if (!o.taskqueue.ready()) return o.taskqueue.addTask("putAttachment", arguments), void 0;
      "function" == typeof a && (i = a, a = r, r = t, t = null), a === void 0 && (a = r, r = t, t = null);
      var u = genDBUrl(n, e);
      t && (u += "?rev=" + t), ajax({
        auth: n.auth,
        method: "PUT",
        url: u,
        headers: {
          "Content-Type": a
        },
        processData: !1,
        body: r
      }, i)
    }, o.put = function(e, t, r) {
      if (!o.taskqueue.ready()) return o.taskqueue.addTask("put", arguments), void 0;
      if ("function" == typeof t && (r = t, t = {}), !(e && "_id" in e)) return call(r, Pouch.Errors.MISSING_ID);
      var a = [];
      t && t.new_edits !== void 0 && a.push("new_edits=" + t.new_edits), a = a.join("&"), "" !== a && (a = "?" + a), ajax({
        auth: n.auth,
        method: "PUT",
        url: genDBUrl(n, e._id) + a,
        body: e
      }, r)
    }, o.post = function(e, t, n) {
      return o.taskqueue.ready() ? ("function" == typeof t && (n = t, t = {}), "_id" in e ? o.put(e, t, n) : a.list.length > 0 ? (e._id = a.list.pop(), o.put(e, t, n)) : a.get(function(r) {
        return r ? call(n, Pouch.Errors.UNKNOWN_ERROR) : (e._id = a.list.pop(), o.put(e, t, n), void 0)
      }), void 0) : (o.taskqueue.addTask("post", arguments), void 0)
    }, o.bulkDocs = function(e, t, r) {
      return o.taskqueue.ready() ? ("function" == typeof t && (r = t, t = {}), t || (t = {}), t.new_edits !== void 0 && (e.new_edits = t.new_edits), ajax({
        auth: n.auth,
        method: "POST",
        url: genDBUrl(n, "_bulk_docs"),
        body: e
      }, r), void 0) : (o.taskqueue.addTask("bulkDocs", arguments), void 0)
    }, o.allDocs = function(e, t) {
      if (!o.taskqueue.ready()) return o.taskqueue.addTask("allDocs", arguments), void 0;
      "function" == typeof e && (t = e, e = {});
      var r, a = [],
        i = "GET";
      e.conflicts && a.push("conflicts=true"), e.descending && a.push("descending=true"), e.include_docs && a.push("include_docs=true"), e.startkey && a.push("startkey=" + encodeURIComponent(JSON.stringify(e.startkey))), e.endkey && a.push("endkey=" + encodeURIComponent(JSON.stringify(e.endkey))), e.limit && a.push("limit=" + e.limit), a = a.join("&"), "" !== a && (a = "?" + a), e.keys !== void 0 && (i = "POST", r = JSON.stringify({
        keys: e.keys
      })), ajax({
        auth: n.auth,
        method: i,
        url: genDBUrl(n, "_all_docs" + a),
        body: r
      }, t)
    }, o.changes = function(e) {
      var t = 25;
      if (!o.taskqueue.ready()) return o.taskqueue.addTask("changes", arguments), void 0;
      Pouch.DEBUG && console.log(r + ": Start Changes Feed: continuous=" + e.continuous);
      var a = {},
        i = e.limit !== void 0 ? e.limit : !1;
      0 === i && (i = 1);
      var u = i;
      if (e.style && (a.style = e.style), (e.include_docs || e.filter && "function" == typeof e.filter) && (a.include_docs = !0), e.continuous && (a.feed = "longpoll"), e.conflicts && (a.conflicts = !0), e.descending && (a.descending = !0), e.filter && "string" == typeof e.filter && (a.filter = e.filter), e.query_params && "object" == typeof e.query_params)
        for (var s in e.query_params) e.query_params.hasOwnProperty(s) && (a[s] = e.query_params[s]);
      var c, d, l, f = function(r, o) {
          a.since = r, a.limit = !i || u > t ? t : u;
          var s = "?" + Object.keys(a).map(function(e) {
              return e + "=" + a[e]
            }).join("&"),
            l = {
              auth: n.auth,
              method: "GET",
              url: genDBUrl(n, "_changes" + s),
              timeout: null
            };
          d = r, e.aborted || (c = ajax(l, o))
        },
        p = 10,
        h = 0,
        v = function(t, n) {
          if (n && n.results) {
            var r = e.filter && "function" == typeof e.filter,
              o = {};
            o.query = e.query_params, n.results = n.results.filter(function(t) {
              return u--, e.aborted || r && !e.filter.apply(this, [t.doc, o]) ? !1 : e.doc_ids && -1 !== e.doc_ids.indexOf(t.id) ? !1 : (call(e.onChange, t), !0)
            })
          }
          n && n.last_seq && (d = n.last_seq);
          var a = i && 0 >= u || !i && d === l || e.descending && 0 !== d;
          if (e.continuous || !a) {
            t ? h += 1 : h = 0;
            var s = 1 << h,
              c = p * s,
              _ = e.maximumWait || 3e4;
            c > _ && call(e.complete, t || Pouch.Errors.UNKNOWN_ERROR, null), setTimeout(function() {
              f(d, v)
            }, c)
          } else call(e.complete, null, n)
        };
      return e.continuous ? f(e.since || 0, v) : o.info(function(t, n) {
        l = n.update_seq, f(e.since || 0, v)
      }), {
        cancel: function() {
          Pouch.DEBUG && console.log(r + ": Cancel Changes Feed"), e.aborted = !0, c.abort()
        }
      }
    }, o.revsDiff = function(e, t, r) {
      return o.taskqueue.ready() ? ("function" == typeof t && (r = t, t = {}), ajax({
        auth: n.auth,
        method: "POST",
        url: genDBUrl(n, "_revs_diff"),
        body: e
      }, function(e, t) {
        call(r, e, t)
      }), void 0) : (o.taskqueue.addTask("revsDiff", arguments), void 0)
    }, o.close = function(e) {
      return o.taskqueue.ready() ? (call(e, null), void 0) : (o.taskqueue.addTask("close", arguments), void 0)
    }, o
  };
  if (HttpPouch.destroy = function(e, t) {
      var n = getHost(e);
      ajax({
        auth: n.auth,
        method: "DELETE",
        url: genDBUrl(n, "")
      }, t)
    }, HttpPouch.valid = function() {
      return !0
    }, "undefined" != typeof module && module.exports) {
    var pouchdir = "../";
    Pouch = require(pouchdir + "pouch.js"), ajax = Pouch.utils.ajax
  }
  Pouch.adapter("http", HttpPouch), Pouch.adapter("https", HttpPouch);
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB,
    IDBTransaction = window.IDBTransaction && window.IDBTransaction.READ_WRITE ? window.IDBTransaction : window.webkitIDBTransaction && window.webkitIDBTransaction.READ_WRITE ? window.webkitIDBTransaction : {
      READ_WRITE: "readwrite"
    },
    IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange,
    idbError = function(e) {
      return function(t) {
        call(e, {
          status: 500,
          error: t.type,
          reason: t.target
        })
      }
    },
    IdbPouch = function(opts, callback) {
      function createSchema(e) {
        e.createObjectStore(DOC_STORE, {
          keyPath: "id"
        }).createIndex("seq", "seq", {
          unique: !0
        }), e.createObjectStore(BY_SEQ_STORE, {
          autoIncrement: !0
        }).createIndex("_doc_id_rev", "_doc_id_rev", {
          unique: !0
        }), e.createObjectStore(ATTACH_STORE, {
          keyPath: "digest"
        }), e.createObjectStore(META_STORE, {
          keyPath: "id",
          autoIncrement: !1
        }), e.createObjectStore(DETECT_BLOB_SUPPORT_STORE)
      }

      function fixBinary(e) {
        for (var t = e.length, n = new ArrayBuffer(t), r = new Uint8Array(n), o = 0; t > o; o++) r[o] = e.charCodeAt(o);
        return n
      }

      function sortByBulkSeq(e, t) {
        return e._bulk_seq - t._bulk_seq
      }
      var POUCH_VERSION = 1,
        DOC_STORE = "document-store",
        BY_SEQ_STORE = "by-sequence",
        ATTACH_STORE = "attach-store",
        META_STORE = "meta-store",
        DETECT_BLOB_SUPPORT_STORE = "detect-blob-support",
        name = opts.name,
        req = indexedDB.open(name, POUCH_VERSION);
      Pouch.openReqList && (Pouch.openReqList[name] = req);
      var meta = {
          id: "meta-store",
          updateSeq: 0
        },
        blobSupport = null,
        instanceId = null,
        api = {},
        idb = null;
      return Pouch.DEBUG && console.log(name + ": Open Database"), req.onupgradeneeded = function(e) {
        for (var t = e.target.result, n = e.oldVersion; n !== e.newVersion;) 0 === n && createSchema(t), n++
      }, req.onsuccess = function(e) {
        idb = e.target.result;
        var t = idb.transaction([META_STORE, DETECT_BLOB_SUPPORT_STORE], IDBTransaction.READ_WRITE);
        if (idb.onversionchange = function() {
            idb.close()
          }, idb.setVersion && Number(idb.version) !== POUCH_VERSION) {
          var n = idb.setVersion(POUCH_VERSION);
          return n.onsuccess = function(t) {
            function n() {
              r.onsuccess(e)
            }
            t.target.result.oncomplete = n, r.onupgradeneeded(e)
          }, void 0
        }
        var r = t.objectStore(META_STORE).get("meta-store");
        r.onsuccess = function(e) {
          var n;
          e.target.result && (meta = e.target.result), name + "_id" in meta ? instanceId = meta[name + "_id"] : (instanceId = Pouch.uuid(), meta[name + "_id"] = instanceId, n = t.objectStore(META_STORE).put(meta));
          try {
            t.objectStore(DETECT_BLOB_SUPPORT_STORE).put(new Blob, "key"), blobSupport = !0
          } catch (r) {
            blobSupport = !1
          } finally {
            call(callback, null, api)
          }
        }
      }, req.onerror = idbError(callback), api.type = function() {
        return "idb"
      }, api.id = function idb_id() {
        return instanceId
      }, api._bulkDocs = function idb_bulkDocs(e, t, n) {
        function r() {
          if (h.length) {
            var e = h.shift(),
              t = _.objectStore(DOC_STORE).get(e.metadata.id);
            t.onsuccess = function(t) {
              var n = t.target.result;
              n ? s(n, e) : c(e)
            }
          }
        }

        function o() {
          var e = [];
          m.sort(sortByBulkSeq), m.forEach(function(t) {
            if (delete t._bulk_seq, t.error) return e.push(t), void 0;
            var n = t.metadata,
              r = Pouch.merge.winningRev(n);
            e.push({
              ok: !0,
              id: n.id,
              rev: r
            }), isLocalId(n.id) || (IdbPouch.Changes.notify(name), IdbPouch.Changes.notifyLocalWindows(name))
          }), call(n, null, e)
        }

        function a(e, t) {
          if (e.stub) return t();
          if ("string" == typeof e.data) {
            var r;
            try {
              r = atob(e.data)
            } catch (o) {
              return call(n, Pouch.error(Pouch.Errors.BAD_ARG, "Attachments need to be base64 encoded"))
            }
            if (e.digest = "md5-" + Crypto.MD5(r), blobSupport) {
              var a = e.content_type;
              r = fixBinary(r), e.data = new Blob([r], {
                type: a
              })
            }
            return t()
          }
          var i = new FileReader;
          i.onloadend = function() {
            e.digest = "md5-" + Crypto.MD5(this.result), blobSupport || (e.data = btoa(this.result)), t()
          }, i.readAsBinaryString(e.data)
        }

        function i(e) {
          function t() {
            n++, h.length === n && e()
          }
          if (!h.length) return e();
          var n = 0;
          h.forEach(function(e) {
            function n() {
              o++, o === r.length && t()
            }
            var r = e.data && e.data._attachments ? Object.keys(e.data._attachments) : [];
            if (!r.length) return t();
            var o = 0;
            for (var i in e.data._attachments) a(e.data._attachments[i], n)
          })
        }

        function u(e, t) {
          function n(e) {
            a || (e ? (a = e, call(t, a)) : i === u.length && o())
          }

          function r(e) {
            i++, n(e)
          }

          function o() {
            e.data._doc_id_rev = e.data._id + "::" + e.data._rev;
            var n = _.objectStore(BY_SEQ_STORE).put(e.data);
            n.onsuccess = function(n) {
              Pouch.DEBUG && console.log(name + ": Wrote Document ", e.metadata.id), e.metadata.seq = n.target.result, delete e.metadata.rev;
              var r = _.objectStore(DOC_STORE).put(e.metadata);
              r.onsuccess = function() {
                m.push(e), call(t)
              }
            }
          }
          var a = null,
            i = 0;
          e.data._id = e.metadata.id, e.data._rev = e.metadata.rev, meta.updateSeq++, _.objectStore(META_STORE).put(meta), isDeleted(e.metadata, e.metadata.rev) && (e.data._deleted = !0);
          var u = e.data._attachments ? Object.keys(e.data._attachments) : [];
          for (var s in e.data._attachments)
            if (e.data._attachments[s].stub) i++, n();
            else {
              var c = e.data._attachments[s].data;
              delete e.data._attachments[s].data;
              var d = e.data._attachments[s].digest;
              l(e, d, c, r)
            }
          u.length || o()
        }

        function s(e, t) {
          var n = Pouch.merge(e.rev_tree, t.metadata.rev_tree[0], 1e3),
            o = isDeleted(e),
            a = o && isDeleted(t.metadata) || !o && f && "new_leaf" !== n.conflicts;
          return a ? (m.push(d(Pouch.Errors.REV_CONFLICT, t._bulk_seq)), r()) : (t.metadata.rev_tree = n.tree, u(t, r), void 0)
        }

        function c(e) {
          return "was_delete" in t && isDeleted(e.metadata) ? (m.push(Pouch.Errors.MISSING_DOC), r()) : (u(e, r), void 0)
        }

        function d(e, t) {
          return e._bulk_seq = t, e
        }

        function l(e, t, n, r) {
          var o = _.objectStore(ATTACH_STORE);
          o.get(t).onsuccess = function(a) {
            var i = a.target.result && a.target.result.refs || {},
              u = [e.metadata.id, e.metadata.rev].join("@"),
              s = {
                digest: t,
                body: n,
                refs: i
              };
            s.refs[u] = !0, o.put(s).onsuccess = function() {
              call(r)
            }
          }
        }
        var f = t.new_edits,
          p = e.docs,
          h = p.map(function(e, t) {
            var n = parseDoc(e, f);
            return n._bulk_seq = t, n
          }),
          v = h.filter(function(e) {
            return e.error
          });
        if (v.length) return call(n, v[0]);
        var _, m = [];
        i(function() {
          _ = idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE, META_STORE], IDBTransaction.READ_WRITE), _.onerror = idbError(n), _.ontimeout = idbError(n), _.oncomplete = o, r()
        })
      }, api._get = function idb_get(e, t, n) {
        function r() {
          call(n, i, {
            doc: o,
            metadata: a,
            ctx: u
          })
        }
        var o, a, i, u;
        u = t.ctx ? t.ctx : idb.transaction([DOC_STORE, BY_SEQ_STORE, ATTACH_STORE], "readonly"), u.objectStore(DOC_STORE).get(e.docId).onsuccess = function(e) {
          if (a = e.target.result, !a) return i = Pouch.Errors.MISSING_DOC, r();
          if (isDeleted(a) && !t.rev) return i = Pouch.error(Pouch.Errors.MISSING_DOC, "deleted"), r();
          var n = Pouch.merge.winningRev(a),
            s = a.id + "::" + (t.rev ? t.rev : n),
            c = u.objectStore(BY_SEQ_STORE).index("_doc_id_rev");
          c.get(s).onsuccess = function(e) {
            return o = e.target.result, o && o._doc_id_rev && delete o._doc_id_rev, o ? (r(), void 0) : (i = Pouch.Errors.MISSING_DOC, r())
          }
        }
      }, api._getAttachment = function(e, t, n) {
        var r, o = t.ctx,
          a = e.digest,
          i = e.content_type;
        o.objectStore(ATTACH_STORE).get(a).onsuccess = function(e) {
          var o = e.target.result.body;
          if (t.encode)
            if (blobSupport) {
              var a = new FileReader;
              a.onloadend = function() {
                r = btoa(this.result), call(n, null, r)
              }, a.readAsBinaryString(o)
            } else r = o, call(n, null, r);
          else blobSupport ? r = o : (o = fixBinary(atob(o)), r = new Blob([o], {
            type: i
          })), call(n, null, r)
        }
      }, api._allDocs = function idb_allDocs(e, t) {
        var n = "startkey" in e ? e.startkey : !1,
          r = "endkey" in e ? e.endkey : !1,
          o = "descending" in e ? e.descending : !1;
        o = o ? "prev" : null;
        var a = n && r ? IDBKeyRange.bound(n, r) : n ? IDBKeyRange.lowerBound(n) : r ? IDBKeyRange.upperBound(r) : null,
          i = idb.transaction([DOC_STORE, BY_SEQ_STORE], "readonly");
        i.oncomplete = function() {
          "keys" in e && (e.keys.forEach(function(e) {
            e in d ? c.push(d[e]) : c.push({
              key: e,
              error: "not_found"
            })
          }), e.descending && c.reverse()), call(t, null, {
            total_rows: c.length,
            rows: "limit" in e ? c.slice(0, e.limit) : c
          })
        };
        var u = i.objectStore(DOC_STORE),
          s = o ? u.openCursor(a, o) : u.openCursor(a),
          c = [],
          d = {};
        s.onsuccess = function(t) {
          function n(t, n) {
            if (isLocalId(t.id)) return r["continue"]();
            var o = {
              id: t.id,
              key: t.id,
              value: {
                rev: Pouch.merge.winningRev(t)
              }
            };
            e.include_docs && (o.doc = n, o.doc._rev = Pouch.merge.winningRev(t), o.doc._doc_id_rev && delete o.doc._doc_id_rev, e.conflicts && (o.doc._conflicts = Pouch.merge.collectConflicts(t).map(function(e) {
              return e.id
            }))), "keys" in e ? e.keys.indexOf(t.id) > -1 && (isDeleted(t) && (o.value.deleted = !0, o.doc = null), d[o.id] = o) : isDeleted(t) || c.push(o), r["continue"]()
          }
          if (t.target.result) {
            var r = t.target.result,
              o = r.value;
            if (e.include_docs) {
              var a = i.objectStore(BY_SEQ_STORE).index("_doc_id_rev"),
                u = Pouch.merge.winningRev(o),
                s = o.id + "::" + u;
              a.get(s).onsuccess = function(e) {
                n(r.value, e.target.result)
              }
            } else n(o)
          }
        }
      }, api._info = function idb_info(e) {
        var t, n = 0,
          r = idb.transaction([DOC_STORE], "readonly");
        r.oncomplete = function() {
          e(null, t)
        }, r.objectStore(DOC_STORE).openCursor().onsuccess = function(e) {
          var r = e.target.result;
          return r ? (r.value.deleted !== !0 && n++, r["continue"](), void 0) : (t = {
            db_name: name,
            doc_count: n,
            update_seq: meta.updateSeq
          }, void 0)
        }
      }, api._changes = function idb_changes(opts) {
        function fetchChanges() {
          txn = idb.transaction([DOC_STORE, BY_SEQ_STORE]), txn.oncomplete = onTxnComplete;
          var e;
          e = descending ? txn.objectStore(BY_SEQ_STORE).openCursor(IDBKeyRange.lowerBound(opts.since, !0), descending) : txn.objectStore(BY_SEQ_STORE).openCursor(IDBKeyRange.lowerBound(opts.since, !0)), e.onsuccess = onsuccess, e.onerror = onerror
        }

        function onsuccess(e) {
          if (!e.target.result) {
            for (var t = 0, n = results.length; n > t; t++) {
              var r = results[t];
              r && dedupResults.push(r)
            }
            return !1
          }
          var o = e.target.result,
            a = o.value._id,
            i = resultIndices[a];
          if (void 0 !== i) return results[i].seq = o.key, results.push(results[i]), results[i] = null, resultIndices[a] = results.length - 1, o["continue"]();
          var u = txn.objectStore(DOC_STORE);
          u.get(o.value._id).onsuccess = function(e) {
            var t = e.target.result;
            if (isLocalId(t.id)) return o["continue"]();
            t.seq > last_seq && (last_seq = t.seq);
            var n = Pouch.merge.winningRev(t),
              r = t.id + "::" + n,
              a = txn.objectStore(BY_SEQ_STORE).index("_doc_id_rev");
            a.get(r).onsuccess = function(e) {
              var r = e.target.result,
                a = [{
                  rev: n
                }];
              "all_docs" === opts.style && (a = Pouch.merge.collectLeaves(t.rev_tree).map(function(e) {
                return {
                  rev: e.rev
                }
              }));
              var i = {
                id: t.id,
                seq: o.key,
                changes: a,
                doc: r
              };
              isDeleted(t, n) && (i.deleted = !0), opts.conflicts && (i.doc._conflicts = Pouch.merge.collectConflicts(t).map(function(e) {
                return e.id
              }));
              var u = i.id,
                s = resultIndices[u];
              void 0 !== s && (results[s] = null), results.push(i), resultIndices[u] = results.length - 1, o["continue"]()
            }
          }
        }

        function onTxnComplete() {
          processChanges(opts, dedupResults, last_seq)
        }

        function onerror() {
          call(opts.complete)
        }
        if (Pouch.DEBUG && console.log(name + ": Start Changes Feed: continuous=" + opts.continuous), opts.continuous) {
          var id = name + ":" + Pouch.uuid();
          return opts.cancelled = !1, IdbPouch.Changes.addListener(name, id, api, opts), IdbPouch.Changes.notify(name), {
            cancel: function() {
              Pouch.DEBUG && console.log(name + ": Cancel Changes Feed"), opts.cancelled = !0, IdbPouch.Changes.removeListener(name, id)
            }
          }
        }
        var descending = opts.descending ? "prev" : null,
          last_seq = 0;
        opts.since = opts.since && !descending ? opts.since : 0;
        var results = [],
          resultIndices = {},
          dedupResults = [],
          txn;
        if (opts.filter && "string" == typeof opts.filter) {
          var filterName = opts.filter.split("/");
          api.get("_design/" + filterName[0], function(err, ddoc) {
            var filter = eval("(function() { return " + ddoc.filters[filterName[1]] + " })()");
            opts.filter = filter, fetchChanges()
          })
        } else fetchChanges()
      }, api._close = function(e) {
        return null === idb ? call(e, Pouch.Errors.NOT_OPEN) : (idb.close(), call(e, null), void 0)
      }, api._getRevisionTree = function(e, t) {
        var n = idb.transaction([DOC_STORE], "readonly"),
          r = n.objectStore(DOC_STORE).get(e);
        r.onsuccess = function(e) {
          var n = e.target.result;
          n ? call(t, null, n.rev_tree) : call(t, Pouch.Errors.MISSING_DOC)
        }
      }, api._doCompaction = function(e, t, n, r) {
        var o = idb.transaction([DOC_STORE, BY_SEQ_STORE], IDBTransaction.READ_WRITE),
          a = o.objectStore(DOC_STORE);
        a.get(e).onsuccess = function(r) {
          var a = r.target.result;
          a.rev_tree = t;
          var i = n.length;
          n.forEach(function(t) {
            var n = o.objectStore(BY_SEQ_STORE).index("_doc_id_rev"),
              r = e + "::" + t;
            n.getKey(r).onsuccess = function(e) {
              var t = e.target.result;
              t && (o.objectStore(BY_SEQ_STORE)["delete"](t), i--, i || o.objectStore(DOC_STORE).put(a))
            }
          })
        }, o.oncomplete = function() {
          call(r)
        }
      }, api
    };
  IdbPouch.valid = function idb_valid() {
    return !!indexedDB
  }, IdbPouch.destroy = function idb_destroy(e, t) {
    Pouch.DEBUG && console.log(e + ": Delete Database"), IdbPouch.Changes.clearListeners(e), Pouch.openReqList[e] && Pouch.openReqList[e].result && Pouch.openReqList[e].result.close();
    var n = indexedDB.deleteDatabase(e);
    n.onsuccess = function() {
      Pouch.openReqList[e] && (Pouch.openReqList[e] = null), call(t, null)
    }, n.onerror = idbError(t)
  }, IdbPouch.Changes = new Changes, Pouch.adapter("idb", IdbPouch);
  var POUCH_VERSION = 1,
    POUCH_SIZE = 5242880,
    DOC_STORE = quote("document-store"),
    BY_SEQ_STORE = quote("by-sequence"),
    ATTACH_STORE = quote("attach-store"),
    META_STORE = quote("metadata-store"),
    unknownError = function(e) {
      return function(t) {
        call(e, {
          status: 500,
          error: t.type,
          reason: t.target
        })
      }
    },
    webSqlPouch = function(opts, callback) {
      function dbCreated() {
        callback(null, api)
      }

      function setup() {
        db.transaction(function(e) {
          var t = "CREATE TABLE IF NOT EXISTS " + META_STORE + " (update_seq, dbid)",
            n = "CREATE TABLE IF NOT EXISTS " + ATTACH_STORE + " (digest, json, body BLOB)",
            r = "CREATE TABLE IF NOT EXISTS " + DOC_STORE + " (id unique, seq, json, winningseq)",
            o = "CREATE TABLE IF NOT EXISTS " + BY_SEQ_STORE + " (seq INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, doc_id_rev UNIQUE, json)";
          e.executeSql(n), e.executeSql(r), e.executeSql(o), e.executeSql(t);
          var a = "SELECT update_seq FROM " + META_STORE;
          e.executeSql(a, [], function(e, t) {
            if (!t.rows.length) {
              var n = "INSERT INTO " + META_STORE + " (update_seq) VALUES (?)";
              return Pouch.uuid(), e.executeSql(n, [0]), void 0
            }
            update_seq = t.rows.item(0).update_seq
          });
          var i = "SELECT dbid FROM " + META_STORE + " WHERE dbid IS NOT NULL";
          e.executeSql(i, [], function(e, t) {
            if (!t.rows.length) {
              var n = "UPDATE " + META_STORE + " SET dbid=?";
              return instanceId = Pouch.uuid(), e.executeSql(n, [instanceId]), void 0
            }
            instanceId = t.rows.item(0).dbid
          })
        }, unknownError(callback), dbCreated)
      }

      function makeRevs(e) {
        return e.map(function(e) {
          return {
            rev: e.rev
          }
        })
      }

      function makeIds(e) {
        return e.map(function(e) {
          return e.id
        })
      }
      var api = {},
        update_seq = 0,
        instanceId = null,
        name = opts.name,
        db = openDatabase(name, POUCH_VERSION, name, POUCH_SIZE);
      return db ? (isCordova() ? window.addEventListener(name + "_pouch", setup, !1) : setup(), api.type = function() {
        return "websql"
      }, api.id = function() {
        return instanceId
      }, api._info = function(e) {
        db.transaction(function(t) {
          var n = "SELECT COUNT(id) AS count FROM " + DOC_STORE;
          t.executeSql(n, [], function(t, n) {
            e(null, {
              db_name: name,
              doc_count: n.rows.item(0).count,
              update_seq: update_seq
            })
          })
        })
      }, api._bulkDocs = function idb_bulkDocs(e, t, n) {
        function r(e, t) {
          return e._bulk_seq - t._bulk_seq
        }

        function o() {
          var e = [];
          y.sort(r), y.forEach(function(t) {
            if (delete t._bulk_seq, t.error) return e.push(t), void 0;
            var n = t.metadata,
              r = Pouch.merge.winningRev(n);
            if (e.push({
                ok: !0,
                id: n.id,
                rev: r
              }), !isLocalId(n.id)) {
              update_seq++;
              var o = "UPDATE " + META_STORE + " SET update_seq=?";
              g.executeSql(o, [update_seq], function() {
                webSqlPouch.Changes.notify(name), webSqlPouch.Changes.notifyLocalWindows(name)
              })
            }
          }), call(n, null, e)
        }

        function a(e, t) {
          if (e.stub) return t();
          if ("string" == typeof e.data) {
            try {
              e.data = atob(e.data)
            } catch (r) {
              return call(n, Pouch.error(Pouch.Errors.BAD_ARG, "Attachments need to be base64 encoded"))
            }
            return e.digest = "md5-" + Crypto.MD5(e.data), t()
          }
          var o = new FileReader;
          o.onloadend = function() {
            e.data = this.result, e.digest = "md5-" + Crypto.MD5(this.result), t()
          }, o.readAsBinaryString(e.data)
        }

        function i(e) {
          function t() {
            n++, _.length === n && e()
          }
          if (!_.length) return e();
          var n = 0,
            r = 0;
          _.forEach(function(e) {
            function n() {
              r++, r === o.length && t()
            }
            var o = e.data && e.data._attachments ? Object.keys(e.data._attachments) : [];
            if (!o.length) return t();
            for (var i in e.data._attachments) a(e.data._attachments[i], n)
          })
        }

        function u(e, t, n) {
          function r() {
            var t = e.data,
              n = "INSERT INTO " + BY_SEQ_STORE + " (doc_id_rev, json) VALUES (?, ?);";
            g.executeSql(n, [t._id + "::" + t._rev, JSON.stringify(t)], i)
          }

          function o(e) {
            u || (e ? (u = e, call(t, u)) : s === c.length && r())
          }

          function a(e) {
            s++, o(e)
          }

          function i(r, o) {
            var a = e.metadata.seq = o.insertId;
            delete e.metadata.rev;
            var i = Pouch.merge.winningRev(e.metadata),
              u = n ? "UPDATE " + DOC_STORE + " SET seq=?, json=?, winningseq=(SELECT seq FROM " + BY_SEQ_STORE + " WHERE doc_id_rev=?) WHERE id=?" : "INSERT INTO " + DOC_STORE + " (id, seq, winningseq, json) VALUES (?, ?, ?, ?);",
              s = JSON.stringify(e.metadata),
              c = e.metadata.id + "::" + i,
              d = n ? [a, s, c, e.metadata.id] : [e.metadata.id, a, a, s];
            r.executeSql(u, d, function() {
              y.push(e), call(t, null)
            })
          }
          var u = null,
            s = 0;
          e.data._id = e.metadata.id, e.data._rev = e.metadata.rev, isDeleted(e.metadata, e.metadata.rev) && (e.data._deleted = !0);
          var c = e.data._attachments ? Object.keys(e.data._attachments) : [];
          for (var d in e.data._attachments)
            if (e.data._attachments[d].stub) s++, o();
            else {
              var l = e.data._attachments[d].data;
              delete e.data._attachments[d].data;
              var p = e.data._attachments[d].digest;
              f(e, p, l, a)
            }
          c.length || r()
        }

        function s(e, t) {
          var n = Pouch.merge(e.rev_tree, t.metadata.rev_tree[0], 1e3),
            r = isDeleted(e) && isDeleted(t.metadata) || !isDeleted(e) && h && "new_leaf" !== n.conflicts;
          return r ? (y.push(l(Pouch.Errors.REV_CONFLICT, t._bulk_seq)), d()) : (t.metadata.rev_tree = n.tree, u(t, d, !0), void 0)
        }

        function c(e) {
          return "was_delete" in t && isDeleted(e.metadata) ? (y.push(Pouch.Errors.MISSING_DOC), d()) : (u(e, d, !1), void 0)
        }

        function d() {
          if (!_.length) return o();
          var e = _.shift(),
            t = e.metadata.id;
          t in E ? s(E[t], e) : (E[t] = e.metadata, c(e))
        }

        function l(e, t) {
          return e._bulk_seq = t, e
        }

        function f(e, t, n, r) {
          var o = [e.metadata.id, e.metadata.rev].join("@"),
            a = {
              digest: t
            },
            i = "SELECT digest, json FROM " + ATTACH_STORE + " WHERE digest=?";
          g.executeSql(i, [t], function(e, u) {
            u.rows.length ? (a.refs = JSON.parse(u.rows.item(0).json).refs, i = "UPDATE " + ATTACH_STORE + " SET json=?, body=? WHERE digest=?", e.executeSql(i, [JSON.stringify(a), n, t], function() {
              call(r, null)
            })) : (a.refs = {}, a.refs[o] = !0, i = "INSERT INTO " + ATTACH_STORE + "(digest, json, body) VALUES (?, ?, ?)", e.executeSql(i, [t, JSON.stringify(a), n], function() {
              call(r, null)
            }))
          })
        }

        function p(e, t) {
          for (var n = 0; t.rows.length > n; n++) {
            var r = t.rows.item(n);
            E[r.id] = JSON.parse(r.json)
          }
          d()
        }
        var h = t.new_edits,
          v = e.docs,
          _ = v.map(function(e, t) {
            var n = parseDoc(e, h);
            return n._bulk_seq = t, n
          }),
          m = _.filter(function(e) {
            return e.error
          });
        if (m.length) return call(n, m[0]);
        var g, y = [],
          E = {};
        i(function() {
          db.transaction(function(e) {
            g = e;
            var t = "(" + _.map(function(e) {
                return quote(e.metadata.id)
              }).join(",") + ")",
              n = "SELECT * FROM " + DOC_STORE + " WHERE id IN " + t;
            g.executeSql(n, [], p)
          }, unknownError(n))
        })
      }, api._get = function(e, t, n) {
        function r() {
          call(n, i, {
            doc: o,
            metadata: a,
            ctx: u
          })
        }
        var o, a, i;
        if (!t.ctx) return db.transaction(function(r) {
          t.ctx = r, api._get(e, t, n)
        }), void 0;
        var u = t.ctx,
          s = "SELECT * FROM " + DOC_STORE + " WHERE id=?";
        u.executeSql(s, [e.docId], function(e, n) {
          if (!n.rows.length) return i = Pouch.Errors.MISSING_DOC, r();
          if (a = JSON.parse(n.rows.item(0).json), isDeleted(a) && !t.rev) return i = Pouch.error(Pouch.Errors.MISSING_DOC, "deleted"), r();
          var s = Pouch.merge.winningRev(a),
            c = t.rev ? t.rev : s;
          c = a.id + "::" + c;
          var d = "SELECT * FROM " + BY_SEQ_STORE + " WHERE doc_id_rev=?";
          u.executeSql(d, [c], function(e, t) {
            return t.rows.length ? (o = JSON.parse(t.rows.item(0).json), r(), void 0) : (i = Pouch.Errors.MISSING_DOC, r())
          })
        })
      }, api._allDocs = function(e, t) {
        var n = [],
          r = {},
          o = "startkey" in e ? e.startkey : !1,
          a = "endkey" in e ? e.endkey : !1,
          i = "descending" in e ? e.descending : !1,
          u = "SELECT " + DOC_STORE + ".id, " + BY_SEQ_STORE + ".seq, " + BY_SEQ_STORE + ".json AS data, " + DOC_STORE + ".json AS metadata FROM " + BY_SEQ_STORE + " JOIN " + DOC_STORE + " ON " + BY_SEQ_STORE + ".seq = " + DOC_STORE + ".winningseq";
        "keys" in e ? u += " WHERE " + DOC_STORE + ".id IN (" + e.keys.map(function(e) {
          return quote(e)
        }).join(",") + ")" : (o && (u += " WHERE " + DOC_STORE + '.id >= "' + o + '"'), a && (u += (o ? " AND " : " WHERE ") + DOC_STORE + '.id <= "' + a + '"'), u += " ORDER BY " + DOC_STORE + ".id " + (i ? "DESC" : "ASC")), db.transaction(function(t) {
          t.executeSql(u, [], function(t, o) {
            for (var a = 0, i = o.rows.length; i > a; a++) {
              var u = o.rows.item(a),
                s = JSON.parse(u.metadata),
                c = JSON.parse(u.data);
              isLocalId(s.id) || (u = {
                id: s.id,
                key: s.id,
                value: {
                  rev: Pouch.merge.winningRev(s)
                }
              }, e.include_docs && (u.doc = c, u.doc._rev = Pouch.merge.winningRev(s), e.conflicts && (u.doc._conflicts = makeIds(Pouch.merge.collectConflicts(s)))), "keys" in e ? e.keys.indexOf(s.id) > -1 && (isDeleted(s) && (u.value.deleted = !0, u.doc = null), r[u.id] = u) : isDeleted(s) || n.push(u))
            }
          })
        }, unknownError(t), function() {
          "keys" in e && (e.keys.forEach(function(e) {
            e in r ? n.push(r[e]) : n.push({
              key: e,
              error: "not_found"
            })
          }), e.descending && n.reverse()), call(t, null, {
            total_rows: n.length,
            rows: "limit" in e ? n.slice(0, e.limit) : n
          })
        })
      }, api._changes = function idb_changes(opts) {
        function fetchChanges() {
          var e = "SELECT " + DOC_STORE + ".id, " + BY_SEQ_STORE + ".seq, " + BY_SEQ_STORE + ".json AS data, " + DOC_STORE + ".json AS metadata FROM " + BY_SEQ_STORE + " JOIN " + DOC_STORE + " ON " + BY_SEQ_STORE + ".seq = " + DOC_STORE + ".winningseq WHERE " + DOC_STORE + ".seq > " + opts.since + " ORDER BY " + DOC_STORE + ".seq " + (descending ? "DESC" : "ASC");
          db.transaction(function(t) {
            t.executeSql(e, [], function(e, t) {
              for (var n = 0, r = 0, o = t.rows.length; o > r; r++) {
                var a = t.rows.item(r),
                  i = JSON.parse(a.metadata);
                if (!isLocalId(i.id)) {
                  a.seq > n && (n = a.seq);
                  var u = JSON.parse(a.data),
                    s = u._rev,
                    c = [{
                      rev: s
                    }];
                  "all_docs" === opts.style && (c = makeRevs(Pouch.merge.collectLeaves(i.rev_tree)));
                  var d = {
                    id: i.id,
                    seq: a.seq,
                    changes: c,
                    doc: u
                  };
                  isDeleted(i, s) && (d.deleted = !0), opts.conflicts && (d.doc._conflicts = makeIds(Pouch.merge.collectConflicts(i))), results.push(d)
                }
              }
              processChanges(opts, results, n)
            })
          })
        }
        if (Pouch.DEBUG && console.log(name + ": Start Changes Feed: continuous=" + opts.continuous), opts.continuous) {
          var id = name + ":" + Pouch.uuid();
          return opts.cancelled = !1, webSqlPouch.Changes.addListener(name, id, api, opts), webSqlPouch.Changes.notify(name), {
            cancel: function() {
              Pouch.DEBUG && console.log(name + ": Cancel Changes Feed"), opts.cancelled = !0, webSqlPouch.Changes.removeListener(name, id)
            }
          }
        }
        var descending = opts.descending;
        opts.since = opts.since && !descending ? opts.since : 0;
        var results = [],
          txn;
        if (opts.filter && "string" == typeof opts.filter) {
          var filterName = opts.filter.split("/");
          api.get("_design/" + filterName[0], function(err, ddoc) {
            var filter = eval("(function() { return " + ddoc.filters[filterName[1]] + " })()");
            opts.filter = filter, fetchChanges()
          })
        } else fetchChanges()
      }, api._close = function(e) {
        call(e, null)
      }, api._getAttachment = function(e, t, n) {
        var r, o = t.ctx,
          a = e.digest,
          i = e.content_type,
          u = "SELECT body FROM " + ATTACH_STORE + " WHERE digest=?";
        o.executeSql(u, [a], function(e, o) {
          var a = o.rows.item(0).body;
          r = t.encode ? btoa(a) : new Blob([a], {
            type: i
          }), call(n, null, r)
        })
      }, api._getRevisionTree = function(e, t) {
        db.transaction(function(n) {
          var r = "SELECT json AS metadata FROM " + DOC_STORE + " WHERE id = ?";
          n.executeSql(r, [e], function(e, n) {
            if (n.rows.length) {
              var r = JSON.parse(n.rows.item(0).metadata);
              call(t, null, r.rev_tree)
            } else call(t, Pouch.Errors.MISSING_DOC)
          })
        })
      }, api._doCompaction = function(e, t, n, r) {
        db.transaction(function(o) {
          var a = "SELECT json AS metadata FROM " + DOC_STORE + " WHERE id = ?";
          o.executeSql(a, [e], function(o, a) {
            if (!a.rows.length) return call(r);
            var i = JSON.parse(a.rows.item(0).metadata);
            i.rev_tree = t;
            var u = "DELETE FROM " + BY_SEQ_STORE + " WHERE doc_id_rev IN (" + n.map(function(t) {
              return quote(e + "::" + t)
            }).join(",") + ")";
            o.executeSql(u, [], function(t) {
              var n = "UPDATE " + DOC_STORE + " SET json = ? WHERE id = ?";
              t.executeSql(n, [JSON.stringify(i), e], function() {
                r()
              })
            })
          })
        })
      }, api) : call(callback, Pouch.Errors.UNKNOWN_ERROR)
    };
  webSqlPouch.valid = function() {
    return !!window.openDatabase
  }, webSqlPouch.destroy = function(e, t) {
    var n = openDatabase(e, POUCH_VERSION, e, POUCH_SIZE);
    n.transaction(function(e) {
      e.executeSql("DROP TABLE IF EXISTS " + DOC_STORE, []), e.executeSql("DROP TABLE IF EXISTS " + BY_SEQ_STORE, []), e.executeSql("DROP TABLE IF EXISTS " + ATTACH_STORE, []), e.executeSql("DROP TABLE IF EXISTS " + META_STORE, [])
    }, unknownError(t), function() {
      call(t, null)
    })
  }, webSqlPouch.Changes = new Changes, Pouch.adapter("websql", webSqlPouch);
  var MapReduce = function(db) {
    function viewQuery(fun, options) {
      function sum(e) {
        return e.reduce(function(e, t) {
          return e + t
        }, 0)
      }
      if (options.complete) {
        fun.reduce || (options.reduce = !1);
        var builtInReduce = {
            _sum: function(e, t) {
              return sum(t)
            },
            _count: function(e, t, n) {
              return n ? sum(t) : t.length
            },
            _stats: function(e, t) {
              return {
                sum: sum(t),
                min: Math.min.apply(null, t),
                max: Math.max.apply(null, t),
                count: t.length,
                sumsqr: function() {
                  var e = 0;
                  for (var n in t) e += t[n] * t[n];
                  return e
                }()
              }
            }
          },
          results = [],
          current = null,
          num_started = 0,
          completed = !1,
          emit = function(e, t) {
            var n = {
              id: current.doc._id,
              key: e,
              value: t
            };
            if (!(options.startkey && 0 > Pouch.collate(e, options.startkey) || options.endkey && Pouch.collate(e, options.endkey) > 0 || options.key && 0 !== Pouch.collate(e, options.key))) {
              if (num_started++, options.include_docs) {
                if (t && "object" == typeof t && t._id) return db.get(t._id, function(e, t) {
                  t && (n.doc = t), results.push(n), checkComplete()
                }), void 0;
                n.doc = current.doc
              }
              results.push(n)
            }
          };
        eval("fun.map = " + ("" + fun.map) + ";"), fun.reduce && (builtInReduce[fun.reduce] && (fun.reduce = builtInReduce[fun.reduce]), eval("fun.reduce = " + ("" + fun.reduce) + ";"));
        var checkComplete = function() {
          if (completed && results.length == num_started) {
            if (results.sort(function(e, t) {
                return Pouch.collate(e.key, t.key)
              }), options.descending && results.reverse(), options.reduce === !1) return options.complete(null, {
              rows: "limit" in options ? results.slice(0, options.limit) : results,
              total_rows: results.length
            });
            var e = [];
            results.forEach(function(t) {
              var n = e[e.length - 1] || null;
              return n && 0 === Pouch.collate(n.key[0][0], t.key) ? (n.key.push([t.key, t.id]), n.value.push(t.value), void 0) : (e.push({
                key: [
                  [t.key, t.id]
                ],
                value: [t.value]
              }), void 0)
            }), e.forEach(function(e) {
              e.value = fun.reduce(e.key, e.value) || null, e.key = e.key[0][0]
            }), options.complete(null, {
              rows: "limit" in options ? e.slice(0, options.limit) : e,
              total_rows: e.length
            })
          }
        };
        db.changes({
          conflicts: !0,
          include_docs: !0,
          onChange: function(e) {
            "deleted" in e || (current = {
              doc: e.doc
            }, fun.map.call(this, e.doc))
          },
          complete: function() {
            completed = !0, checkComplete()
          }
        })
      }
    }

    function httpQuery(e, t, n) {
      var r = [],
        o = void 0,
        a = "GET";
      if (t.reduce !== void 0 && r.push("reduce=" + t.reduce), t.include_docs !== void 0 && r.push("include_docs=" + t.include_docs), t.limit !== void 0 && r.push("limit=" + t.limit), t.descending !== void 0 && r.push("descending=" + t.descending), t.startkey !== void 0 && r.push("startkey=" + encodeURIComponent(JSON.stringify(t.startkey))), t.endkey !== void 0 && r.push("endkey=" + encodeURIComponent(JSON.stringify(t.endkey))), t.key !== void 0 && r.push("key=" + encodeURIComponent(JSON.stringify(t.key))), t.group !== void 0 && r.push("group=" + t.group), t.group_level !== void 0 && r.push("group_level=" + t.group_level), t.keys !== void 0 && (a = "POST", o = JSON.stringify({
          keys: t.keys
        })), r = r.join("&"), r = "" === r ? "" : "?" + r, "string" == typeof e) {
        var i = e.split("/");
        return db.request({
          method: a,
          url: "_design/" + i[0] + "/_view/" + i[1] + r,
          body: o
        }, n), void 0
      }
      var u = JSON.parse(JSON.stringify(e, function(e, t) {
        return "function" == typeof t ? t + "" : t
      }));
      db.request({
        method: "POST",
        url: "_temp_view" + r,
        body: u
      }, n)
    }

    function query(e, t, n) {
      if ("function" == typeof t && (n = t, t = {}), n && (t.complete = n), "http" === db.type()) return "function" == typeof e ? httpQuery({
        map: e
      }, t, n) : httpQuery(e, t, n);
      if ("object" == typeof e) return viewQuery(e, t);
      if ("function" == typeof e) return viewQuery({
        map: e
      }, t);
      var r = e.split("/");
      db.get("_design/" + r[0], function(e, o) {
        return e ? (n && n(e), void 0) : o.views[r[1]] ? (viewQuery({
          map: o.views[r[1]].map,
          reduce: o.views[r[1]].reduce
        }, t), void 0) : (n && n({
          error: "not_found",
          reason: "missing_named_view"
        }), void 0)
      })
    }
    return {
      query: query
    }
  };
  MapReduce._delete = function() {}, Pouch.plugin("mapreduce", MapReduce)
})(this);
