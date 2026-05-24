import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  const validLocales = routing.locales as readonly string[]
  if (!locale || !validLocales.includes(locale)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../dictionaries/${locale}.json`)).default,
  }
})