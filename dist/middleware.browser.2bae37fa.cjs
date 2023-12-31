'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var debugIt = require('debug');
var defaultOptionsValidator = require('./_chunks/defaultOptionsValidator-41aa9136.cjs');
var isPlainObject = require('is-plain-object');
function _interopDefaultCompat(e) {
  return e && typeof e === 'object' && 'default' in e ? e : {
    default: e
  };
}
var debugIt__default = /*#__PURE__*/_interopDefaultCompat(debugIt);
function agent(opts) {
  return {};
}
const leadingSlash = /^\//;
const trailingSlash = /\/$/;
function base(baseUrl) {
  const baseUri = baseUrl.replace(trailingSlash, "");
  return {
    processOptions: options => {
      if (/^https?:\/\//i.test(options.url)) {
        return options;
      }
      const url = [baseUri, options.url.replace(leadingSlash, "")].join("/");
      return Object.assign({}, options, {
        url
      });
    }
  };
}
const SENSITIVE_HEADERS = ["cookie", "authorization"];
const hasOwn = Object.prototype.hasOwnProperty;
const redactKeys = (source, redacted) => {
  const target = {};
  for (const key in source) {
    if (hasOwn.call(source, key)) {
      target[key] = redacted.indexOf(key.toLowerCase()) > -1 ? "<redacted>" : source[key];
    }
  }
  return target;
};
function debug() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const verbose = opts.verbose;
  const namespace = opts.namespace || "get-it";
  const defaultLogger = debugIt__default.default(namespace);
  const log = opts.log || defaultLogger;
  const shortCircuit = log === defaultLogger && !debugIt__default.default.enabled(namespace);
  let requestId = 0;
  return {
    processOptions: options => {
      options.debug = log;
      options.requestId = options.requestId || ++requestId;
      return options;
    },
    onRequest: event => {
      if (shortCircuit || !event) {
        return event;
      }
      const options = event.options;
      log("[%s] HTTP %s %s", options.requestId, options.method, options.url);
      if (verbose && options.body && typeof options.body === "string") {
        log("[%s] Request body: %s", options.requestId, options.body);
      }
      if (verbose && options.headers) {
        const headers = opts.redactSensitiveHeaders === false ? options.headers : redactKeys(options.headers, SENSITIVE_HEADERS);
        log("[%s] Request headers: %s", options.requestId, JSON.stringify(headers, null, 2));
      }
      return event;
    },
    onResponse: (res, context) => {
      if (shortCircuit || !res) {
        return res;
      }
      const reqId = context.options.requestId;
      log("[%s] Response code: %s %s", reqId, res.statusCode, res.statusMessage);
      if (verbose && res.body) {
        log("[%s] Response body: %s", reqId, stringifyBody(res));
      }
      return res;
    },
    onError: (err, context) => {
      const reqId = context.options.requestId;
      if (!err) {
        log("[%s] Error encountered, but handled by an earlier middleware", reqId);
        return err;
      }
      log("[%s] ERROR: %s", reqId, err.message);
      return err;
    }
  };
}
function stringifyBody(res) {
  const contentType = (res.headers["content-type"] || "").toLowerCase();
  const isJson = contentType.indexOf("application/json") !== -1;
  return isJson ? tryFormat(res.body) : res.body;
}
function tryFormat(body) {
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    return JSON.stringify(parsed, null, 2);
  } catch (err) {
    return body;
  }
}
function headers(_headers) {
  let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return {
    processOptions: options => {
      const existing = options.headers || {};
      options.headers = opts.override ? Object.assign({}, existing, _headers) : Object.assign({}, _headers, existing);
      return options;
    }
  };
}
var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, {
  enumerable: true,
  configurable: true,
  writable: true,
  value
}) : obj[key] = value;
var __publicField$1 = (obj, key, value) => {
  __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class HttpError extends Error {
  constructor(res, ctx) {
    super();
    __publicField$1(this, "response");
    __publicField$1(this, "request");
    const truncatedUrl = res.url.length > 400 ? "".concat(res.url.slice(0, 399), "\u2026") : res.url;
    let msg = "".concat(res.method, "-request to ").concat(truncatedUrl, " resulted in ");
    msg += "HTTP ".concat(res.statusCode, " ").concat(res.statusMessage);
    this.message = msg.trim();
    this.response = res;
    this.request = ctx.options;
  }
}
function httpErrors() {
  return {
    onResponse: (res, ctx) => {
      const isHttpError = res.statusCode >= 400;
      if (!isHttpError) {
        return res;
      }
      throw new HttpError(res, ctx);
    }
  };
}
function injectResponse() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (typeof opts.inject !== "function") {
    throw new Error("`injectResponse` middleware requires a `inject` function");
  }
  const inject = function inject2(prevValue, event) {
    const response = opts.inject(event, prevValue);
    if (!response) {
      return prevValue;
    }
    const options = event.context.options;
    return {
      body: "",
      url: options.url,
      method: options.method,
      headers: {},
      statusCode: 200,
      statusMessage: "OK",
      ...response
    };
  };
  return {
    interceptRequest: inject
  };
}
const isBuffer = typeof Buffer === "undefined" ? () => false : obj => Buffer.isBuffer(obj);
const serializeTypes = ["boolean", "string", "number"];
function jsonRequest() {
  return {
    processOptions: options => {
      const body = options.body;
      if (!body) {
        return options;
      }
      const isStream = typeof body.pipe === "function";
      const shouldSerialize = !isStream && !isBuffer(body) && (serializeTypes.indexOf(typeof body) !== -1 || Array.isArray(body) || isPlainObject.isPlainObject(body));
      if (!shouldSerialize) {
        return options;
      }
      return Object.assign({}, options, {
        body: JSON.stringify(options.body),
        headers: Object.assign({}, options.headers, {
          "Content-Type": "application/json"
        })
      });
    }
  };
}
function jsonResponse(opts) {
  return {
    onResponse: response => {
      const contentType = response.headers["content-type"] || "";
      const shouldDecode = opts && opts.force || contentType.indexOf("application/json") !== -1;
      if (!response.body || !contentType || !shouldDecode) {
        return response;
      }
      return Object.assign({}, response, {
        body: tryParse(response.body)
      });
    },
    processOptions: options => Object.assign({}, options, {
      headers: Object.assign({
        Accept: "application/json"
      }, options.headers)
    })
  };
  function tryParse(body) {
    try {
      return JSON.parse(body);
    } catch (err) {
      err.message = "Failed to parsed response body as JSON: ".concat(err.message);
      throw err;
    }
  }
}
function isBrowserOptions(options) {
  return typeof options === "object" && options !== null && !("protocol" in options);
}
function mtls() {
  let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (!config.ca) {
    throw new Error('Required mtls option "ca" is missing');
  }
  if (!config.cert) {
    throw new Error('Required mtls option "cert" is missing');
  }
  if (!config.key) {
    throw new Error('Required mtls option "key" is missing');
  }
  return {
    finalizeOptions: options => {
      if (isBrowserOptions(options)) {
        return options;
      }
      const mtlsOpts = {
        cert: config.cert,
        key: config.key,
        ca: config.ca
      };
      return Object.assign({}, options, mtlsOpts);
    }
  };
}
let actualGlobal = {};
if (typeof globalThis !== "undefined") {
  actualGlobal = globalThis;
} else if (typeof window !== "undefined") {
  actualGlobal = window;
} else if (typeof global !== "undefined") {
  actualGlobal = global;
} else if (typeof self !== "undefined") {
  actualGlobal = self;
}
var global$1 = actualGlobal;
function observable() {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const Observable =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- @TODO consider dropping checking for a global Observable since it's not on a standards track
  opts.implementation || global$1.Observable;
  if (!Observable) {
    throw new Error("`Observable` is not available in global scope, and no implementation was passed");
  }
  return {
    onReturn: (channels, context) => new Observable(observer => {
      channels.error.subscribe(err => observer.error(err));
      channels.progress.subscribe(event => observer.next(Object.assign({
        type: "progress"
      }, event)));
      channels.response.subscribe(response => {
        observer.next(Object.assign({
          type: "response"
        }, response));
        observer.complete();
      });
      channels.request.publish(context);
      return () => channels.abort.publish();
    })
  };
}
function progress() {
  return {
    onRequest: evt => {
      if (evt.adapter !== "xhr") {
        return;
      }
      const xhr = evt.request;
      const context = evt.context;
      if ("upload" in xhr && "onprogress" in xhr.upload) {
        xhr.upload.onprogress = handleProgress("upload");
      }
      if ("onprogress" in xhr) {
        xhr.onprogress = handleProgress("download");
      }
      function handleProgress(stage) {
        return event => {
          const percent = event.lengthComputable ? event.loaded / event.total * 100 : -1;
          context.channels.progress.publish({
            stage,
            percent,
            total: event.total,
            loaded: event.loaded,
            lengthComputable: event.lengthComputable
          });
        };
      }
    }
  };
}
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
  enumerable: true,
  configurable: true,
  writable: true,
  value
}) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const promise = function () {
  let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const PromiseImplementation = options.implementation || Promise;
  if (!PromiseImplementation) {
    throw new Error("`Promise` is not available in global scope, and no implementation was passed");
  }
  return {
    onReturn: (channels, context) => new PromiseImplementation((resolve, reject) => {
      const cancel = context.options.cancelToken;
      if (cancel) {
        cancel.promise.then(reason => {
          channels.abort.publish(reason);
          reject(reason);
        });
      }
      channels.error.subscribe(reject);
      channels.response.subscribe(response => {
        resolve(options.onlyBody ? response.body : response);
      });
      setTimeout(() => {
        try {
          channels.request.publish(context);
        } catch (err) {
          reject(err);
        }
      }, 0);
    })
  };
};
class Cancel {
  constructor(message) {
    __publicField(this, "__CANCEL__", true);
    __publicField(this, "message");
    this.message = message;
  }
  toString() {
    return "Cancel".concat(this.message ? ": ".concat(this.message) : "");
  }
}
const _CancelToken = class _CancelToken {
  constructor(executor) {
    __publicField(this, "promise");
    __publicField(this, "reason");
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise = null;
    this.promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    executor(message => {
      if (this.reason) {
        return;
      }
      this.reason = new Cancel(message);
      resolvePromise(this.reason);
    });
  }
};
__publicField(_CancelToken, "source", () => {
  let cancel;
  const token = new _CancelToken(can => {
    cancel = can;
  });
  return {
    token,
    cancel
  };
});
let CancelToken = _CancelToken;
const isCancel = value => !!(value && (value == null ? void 0 : value.__CANCEL__));
promise.Cancel = Cancel;
promise.CancelToken = CancelToken;
promise.isCancel = isCancel;
function proxy(_proxy) {
  if (_proxy !== false && (!_proxy || !_proxy.host)) {
    throw new Error("Proxy middleware takes an object of host, port and auth properties");
  }
  return {
    processOptions: options => Object.assign({
      proxy: _proxy
    }, options)
  };
}
var defaultShouldRetry = (err, attempt, options) => {
  if (options.method !== "GET" && options.method !== "HEAD") {
    return false;
  }
  return err.isNetworkError || false;
};
const isStream = stream => stream !== null && typeof stream === "object" && typeof stream.pipe === "function";
var sharedRetry = opts => {
  const maxRetries = opts.maxRetries || 5;
  const retryDelay = opts.retryDelay || getRetryDelay;
  const allowRetry = opts.shouldRetry;
  return {
    onError: (err, context) => {
      const options = context.options;
      const max = options.maxRetries || maxRetries;
      const shouldRetry = options.shouldRetry || allowRetry;
      const attemptNumber = options.attemptNumber || 0;
      if (isStream(options.body)) {
        return err;
      }
      if (!shouldRetry(err, attemptNumber, options) || attemptNumber >= max) {
        return err;
      }
      const newContext = Object.assign({}, context, {
        options: Object.assign({}, options, {
          attemptNumber: attemptNumber + 1
        })
      });
      setTimeout(() => context.channels.request.publish(newContext), retryDelay(attemptNumber));
      return null;
    }
  };
};
function getRetryDelay(attemptNum) {
  return 100 * Math.pow(2, attemptNum) + Math.random() * 100;
}
const retry = function () {
  let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return sharedRetry({
    shouldRetry: defaultShouldRetry,
    ...opts
  });
};
retry.shouldRetry = defaultShouldRetry;
function encode(data) {
  const query = new URLSearchParams();
  const nest = (name, _value) => {
    const value = _value instanceof Set ? Array.from(_value) : _value;
    if (Array.isArray(value)) {
      if (value.length) {
        for (const index in value) {
          nest("".concat(name, "[").concat(index, "]"), value[index]);
        }
      } else {
        query.append("".concat(name, "[]"), "");
      }
    } else if (typeof value === "object" && value !== null) {
      for (const [key, obj] of Object.entries(value)) {
        nest("".concat(name, "[").concat(key, "]"), obj);
      }
    } else {
      query.append(name, value);
    }
  };
  for (const [key, value] of Object.entries(data)) {
    nest(key, value);
  }
  return query.toString();
}
function urlEncoded() {
  return {
    processOptions: options => {
      const body = options.body;
      if (!body) {
        return options;
      }
      const isStream = typeof body.pipe === "function";
      const shouldSerialize = !isStream && !isBuffer(body) && isPlainObject.isPlainObject(body);
      if (!shouldSerialize) {
        return options;
      }
      return {
        ...options,
        body: encode(options.body),
        headers: {
          ...options.headers,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      };
    }
  };
}
function buildKeepAlive(agent) {
  return function keepAlive() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const ms = config.ms || 1e3;
    const maxFree = config.maxFree || 256;
    const agentOptions = {
      keepAlive: true,
      keepAliveMsecs: ms,
      maxFreeSockets: maxFree
    };
    return agent(agentOptions);
  };
}
const keepAlive = buildKeepAlive(agent);
exports.processOptions = defaultOptionsValidator.processOptions;
exports.validateOptions = defaultOptionsValidator.validateOptions;
exports.Cancel = Cancel;
exports.CancelToken = CancelToken;
exports.agent = agent;
exports.base = base;
exports.debug = debug;
exports.headers = headers;
exports.httpErrors = httpErrors;
exports.injectResponse = injectResponse;
exports.jsonRequest = jsonRequest;
exports.jsonResponse = jsonResponse;
exports.keepAlive = keepAlive;
exports.mtls = mtls;
exports.observable = observable;
exports.progress = progress;
exports.promise = promise;
exports.proxy = proxy;
exports.retry = retry;
exports.urlEncoded = urlEncoded;
//# sourceMappingURL=middleware.browser.cjs.map
