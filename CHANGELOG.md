# CHANGELOG

## v0.4.8

- 🐛 Use correct property names: maxlength vs maxLength [#17](https://github.com/kiliman/remix-params-helper/pull/17)

## v0.4.7

- ✨ Add inputProps support for date, url, and email types
- ✨ Add inputProps support for min/max
- ✨ Add inputProps support for regex -> pattern

## v0.4.6

- 🧹 Remove inadvertent console.log() statements

## v0.4.5

- ✨ Add support for handling `.date()` in Zod schema

## v0.4.4

- 🐛 Fix parsing of params when there schema contains `.refine()` [#16](https://github.com/kiliman/remix-params-helper/issues/16)

## v0.4.3

- ✨ Add support for handling `.refine()` in Zod schema [#15](https://github.com/kiliman/remix-params-helper/issues/15)

## v0.4.2

- ✨ Add `getParamsOrFail`, `getSearchParamsOrFail`, and `getFormDataOrFail` helpers

## v0.4.1

- 🐛 Remove `console.log` from parseParams

## v0.4.0

- ✨ Add support for nested objects and arrays
- 🐛 Fix handling of Remix `params` object

## v0.3.1

- 🐛 Fix use of internal function

## v0.3.0

- 🚨 Add getParams, getSearchParams, getFormData helpers

## v0.2.2

- 😍 Add contributor @zolrath
- ✨ Add enum support

## v0.2.1

- 🔨 Update boolean handling to support `true|false|undefined`

## v0.2.0

- 🔨 Use Zod error messages directly which can be customized in schema

## v0.1.5

- 🔨 Add support for `.default()`
- 😍 Add contributor @kettui
