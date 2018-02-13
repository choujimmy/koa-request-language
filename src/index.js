import acceptLanguage from 'accept-language'
import bcp47 from 'bcp47'
let changeLanguageURL

const setProps = (props, ctx, language) => {
  ctx.state = ctx.state || {}
  language = language || acceptLanguage.get(ctx.headers['accept-language'])
  ctx.state['language'] = language

  if (typeof props.localizations === 'function') {
    ctx.state['localizations'] = props.localizations(language)
  }
}

const requestLanguage = (props) => {
  if (typeof props.languages === 'undefined' || Object.prototype.toString.call(props.languages) !== '[object Array]') {
    throw new TypeError('You must define your languages in an array of strings.')
  }

  props.languages.forEach((languageTag) => {
    const language = bcp47.parse(languageTag)
    if (language === null) {
      throw new TypeError('Your language tag \'' + languageTag + '\' is not BCP47 compliant. For more info https://tools.ietf.org/html/bcp47.')
    }
  })

  if (props.cookie) {
    if (typeof props.cookie.name !== 'string' || props.cookie.name.length === 0) {
      throw new TypeError('cookie.name setting must be of type string have a length bigger than zero.')
    }

    if (props.cookie.url) {
      if (!/\{language\}/.test(props.cookie.url)) {
        throw new TypeError('You haven\'t defined the markup `{language}` in your cookie.url settings.')
      }

      if (props.cookie.url.charAt(0) !== '/') {
        props.cookie.url = '/' + props.cookie.url
      }

      props.cookie.url = '^' + props.cookie.url

      changeLanguageURL = new RegExp(props.cookie.url
        .replace('/', '\\/')
        .replace('{language}', '(.*)'))
    }
  }

  if (typeof props.localizations !== 'undefined' && typeof props.localizations !== 'function') {
    throw new TypeError('Your \'localizations\' setting is not of type function.')
  }

  acceptLanguage.languages(props.languages)

  return async (ctx, next) => {
    let language
    const queryName = props.queryName || 'language'
    const queryLanguage = ctx.query[queryName]
    if (typeof queryLanguage === 'string' && queryLanguage.length > 1 && props.languages.indexOf(queryLanguage) !== -1) {
      setProps(props, ctx, queryLanguage)
      if (typeof props.cookie !== 'undefined') {
        ctx.cookies.set(props.cookie.name, queryLanguage, props.cookie.options)
      }
      return next()
    }

    if (queryLanguage === 'default') {
      ctx.cookies.set(props.cookie.name, undefined)
    }

    if (typeof props.cookie !== 'undefined') {
      if (typeof props.cookie.url === 'string') {
        changeLanguageURL.index = 0
        const match = changeLanguageURL.exec(ctx.url)
        if (match !== null) {
          if (props.languages.indexOf(match[1]) !== -1) {
            ctx.cookies.set(props.cookie.name, match[1], props.cookie.options)
            return ctx.redirect('back')
          } else {
            ctx.status = 404
            ctx.body = `The language ${match[1]} is not supported.`
          }
        }
      }

      language = ctx.cookies.get(props.cookie.name)
      if (typeof language === 'string') {
        if (props.languages.indexOf(language) !== -1) {
          setProps(props, ctx, language)
          return next()
        }
      }

      language = acceptLanguage.get(ctx.headers['accept-language'])
      ctx.cookies.set(props.cookie.name, language, props.cookie.options)
    }

    setProps(props, ctx, language)
    await next()
  }
}

export default requestLanguage
