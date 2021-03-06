# CHANGELOG

## v0.4.10

- ๐ Always create array if key contains `[]` even for single values. Fixes [#24](https://github.com/kiliman/remix-params-helper/issues/24)

## v0.4.9

- ๐ Support ZodLiteral type. Fixes [#20](https://github.com/kiliman/remix-params-helper/issues/20)

## v0.4.8

- ๐ Use correct property names: maxlength vs maxLength [#17](https://github.com/kiliman/remix-params-helper/pull/17)

## v0.4.7

- โจ Add inputProps support for date, url, and email types
- โจ Add inputProps support for min/max
- โจ Add inputProps support for regex -> pattern

## v0.4.6

- ๐งน Remove inadvertent console.log() statements

## v0.4.5

- โจ Add support for handling `.date()` in Zod schema

## v0.4.4

- ๐ Fix parsing of params when there schema contains `.refine()` [#16](https://github.com/kiliman/remix-params-helper/issues/16)

## v0.4.3

- โจ Add support for handling `.refine()` in Zod schema [#15](https://github.com/kiliman/remix-params-helper/issues/15)

## v0.4.2

- โจ Add `getParamsOrFail`, `getSearchParamsOrFail`, and `getFormDataOrFail` helpers

## v0.4.1

- ๐ Remove `console.log` from parseParams

## v0.4.0

- โจ Add support for nested objects and arrays
- ๐ Fix handling of Remix `params` object

## v0.3.1

- ๐ Fix use of internal function

## v0.3.0

- ๐จ Add getParams, getSearchParams, getFormData helpers

## v0.2.2

- ๐ Add contributor @zolrath
- โจ Add enum support

## v0.2.1

- ๐จ Update boolean handling to support `true|false|undefined`

## v0.2.0

- ๐จ Use Zod error messages directly which can be customized in schema

## v0.1.5

- ๐จ Add support for `.default()`
- ๐ Add contributor @kettui
