'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _acceptLanguage = require('accept-language');

var _acceptLanguage2 = _interopRequireDefault(_acceptLanguage);

var _bcp = require('bcp47');

var _bcp2 = _interopRequireDefault(_bcp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var changeLanguageURL = void 0;

var setProps = function setProps(props, ctx, language) {
  ctx.state = ctx.state || {};
  language = language || _acceptLanguage2.default.get(ctx.headers['accept-language']);
  ctx.state['language'] = language;

  if (typeof props.localizations === 'function') {
    ctx.state['localizations'] = props.localizations(language);
  }
};

var requestLanguage = function requestLanguage(props) {
  if (typeof props.languages === 'undefined' || Object.prototype.toString.call(props.languages) !== '[object Array]') {
    throw new TypeError('You must define your languages in an array of strings.');
  }

  props.languages.forEach(function (languageTag) {
    var language = _bcp2.default.parse(languageTag);
    if (language === null) {
      throw new TypeError('Your language tag \'' + languageTag + '\' is not BCP47 compliant. For more info https://tools.ietf.org/html/bcp47.');
    }
  });

  if (props.cookie) {
    if (typeof props.cookie.name !== 'string' || props.cookie.name.length === 0) {
      throw new TypeError('cookie.name setting must be of type string have a length bigger than zero.');
    }

    if (props.cookie.url) {
      if (!/\{language\}/.test(props.cookie.url)) {
        throw new TypeError('You haven\'t defined the markup `{language}` in your cookie.url settings.');
      }

      if (props.cookie.url.charAt(0) !== '/') {
        props.cookie.url = '/' + props.cookie.url;
      }

      props.cookie.url = '^' + props.cookie.url;

      changeLanguageURL = new RegExp(props.cookie.url.replace('/', '\\/').replace('{language}', '(.*)'));
    }
  }

  if (typeof props.localizations !== 'undefined' && typeof props.localizations !== 'function') {
    throw new TypeError('Your \'localizations\' setting is not of type function.');
  }

  _acceptLanguage2.default.languages(props.languages);

  return function () {
    var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(ctx, next) {
      var language, queryName, queryLanguage, match;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              language = void 0;
              queryName = props.queryName || 'language';
              queryLanguage = ctx.query[queryName];

              if (!(typeof queryLanguage === 'string' && queryLanguage.length > 1 && props.languages.indexOf(queryLanguage) !== -1)) {
                _context.next = 7;
                break;
              }

              setProps(props, ctx, queryLanguage);
              if (typeof props.cookie !== 'undefined') {
                ctx.cookies.set(props.cookie.name, queryLanguage, props.cookie.options);
              }
              return _context.abrupt('return', next());

            case 7:

              if (queryLanguage === 'default') {
                ctx.cookies.set(props.cookie.name, undefined);
              }

              if (!(typeof props.cookie !== 'undefined')) {
                _context.next = 27;
                break;
              }

              if (!(typeof props.cookie.url === 'string')) {
                _context.next = 20;
                break;
              }

              changeLanguageURL.index = 0;
              match = changeLanguageURL.exec(ctx.url);

              if (!(match !== null)) {
                _context.next = 20;
                break;
              }

              if (!(props.languages.indexOf(match[1]) !== -1)) {
                _context.next = 18;
                break;
              }

              ctx.cookies.set(props.cookie.name, match[1], props.cookie.options);
              return _context.abrupt('return', ctx.redirect('back'));

            case 18:
              ctx.status = 404;
              ctx.body = 'The language ' + match[1] + ' is not supported.';

            case 20:

              language = ctx.cookies.get(props.cookie.name);

              if (!(typeof language === 'string')) {
                _context.next = 25;
                break;
              }

              if (!(props.languages.indexOf(language) !== -1)) {
                _context.next = 25;
                break;
              }

              setProps(props, ctx, language);
              return _context.abrupt('return', next());

            case 25:

              language = _acceptLanguage2.default.get(ctx.headers['accept-language']);
              ctx.cookies.set(props.cookie.name, language, props.cookie.options);

            case 27:

              setProps(props, ctx, language);
              next();

            case 29:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, undefined);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();
};

exports.default = requestLanguage;