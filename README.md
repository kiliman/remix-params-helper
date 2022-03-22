# Remix Params Helper

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

This package makes it simple to use [Zod](https://github.com/colinhacks/zod) with
standard [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) and [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
which are typically used in [Remix](https://remix.run) apps.

## 🚨 Breaking Change v0.3.0

Helper no longer requires explicit types on helper. Thanks @zolrath. This will
definitely cut down on the boilerplate.

## 🚧 Work in progress

This package is still work in progress. I'll be refining the API and fixing the TypeScript types.

## 🛠 Installation

```sh
npm install remix-params-helper zod
```

Zod is a peer dependency

## 📦 Zod

Zod is used to validate untyped data and either return a valid object or a list of errors encounted.

To use the helper, first define your Zod schema. It also supports nested objects and
arrays.

```ts
const ParamsSchema = z.object({
  a: z.number(),
  b: z.string(),
  c: z.boolean(),
  d: z.string().optional(),
  e: z.array(z.number()),
})
```

## 📝 API Reference

### `getParams(params, schema)`

This function is used to parse and validate data from `URLSearchParams`, `FormData`, or Remix `params` object.

It returns an object that has `success` property. If `result.success` is `true` then `result.data` will be a valid object of type `T`, inferred from your Zod schema.

Otherwise, `result.errors` will be an object with keys for each property that failed validation. The key value will be the validation error message.

> NOTE: Error messages will now return the message from directly Zod. You can customize the error message
> in your Zod schema [Zod Custom Error Messages](https://github.com/colinhacks/zod#custom-error-messages)

> If the validation returns multiple errors for the same key, it will return an array, otherwise it will be a string.

```ts
errors[key] = 'message'
errors[key] = ['message 1', 'message 2']
```

Unlike `Object.fromEntries()`, this function also supports multi-value keys and will convert them to an array. So `e=1&e=2&e=3` will convert it to `e: [1,2,3]`

```ts
const url = new URL(request.url)
const result = getParams(url.searchParams, ParamsSchema)
if (!result.success) {
  throw new Response(result.errors, { status: 400 })
}
// these variables will be typed and valid
const { a, b, c, d, e } = result.data
```

### `getSearchParams(request, schema)`

This helper function is used to parse and validate `URLSearchParams` data from the `Request` found in the Remix action/loader, it returns the same result values as `getParams`.

```ts
const result = getSearchParams(request, ParamsSchema)
if (!result.success) {
  return json(result.errors, { status: 400 })
}
// these variable will be typed and valid
const { a, b, c, d, e } = result.data
```

### `getFormData(request, schema)`

This helper function is used to parse and validate `FormData` data from the `Request` found in the Remix action/loader, it returns the same result values as `getParams`.

```ts
const result = await getFormData(request, ParamsSchema)
if (!result.success) {
  return json(result.errors, { status: 400 })
}
// these variables will be typed and valid
const { a, b, c, d, e } = result.data
```

### ✨ New in v0.4.2 Added `*OrFail()` versions of the helpers

The functions `getParamsOrFail()`, `getFormDataOrFail()`, `getSearchParamsOrFail()`
will throw an `Error` when parsing fails. Since the helper can only
return a valid result, the return value is always the data.

```ts
// returns valid data that can be destructured or Error is thrown
const { a, b, c, d, e } = await getFormDataOrFail(request, ParamsSchema)
```

> NOTE: Although we provide these helpers, it is recommended that you
> return errors instead of throwing. Form validation is typically an
> **_expected_** error. Throwing `Error` should be reserved for **_unexpected_** errors.

### ✨ New in v0.4.0 Support for nested objects and arrays

Input names should be dot-separated (e.g, `address.street`). Array names can include
the square brackets (e.g., `favoriteFoods[]`). These are optional. The helper will
correctly determine if the value is an array.

```ts
describe('test nested objects and arrays', () => {
  it('should validate nested object', () => {
    const mySchema = z.object({
      name: z.string(),
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
      }),
    })
    const formData = new FormData()
    formData.set('name', 'abcdef')
    formData.set('address.street', '123 Main St')
    formData.set('address.city', 'Anytown')
    formData.set('address.state', 'US')
    formData.set('address.zip', '12345')
    const result = getParams(formData, mySchema)
    expect(result.success).toBe(true)
    expect(result.data.address.street).toBe('123 Main St')
  })
  it('should validate arrays with [] syntax', () => {
    const mySchema = z.object({
      name: z.string(),
      favoriteFoods: z.array(z.string()),
    })
    const formData = new FormData()
    formData.set('name', 'abcdef')
    formData.append('favoriteFoods[]', 'Pizza')
    formData.append('favoriteFoods[]', 'Tacos')
    formData.append('favoriteFoods[]', 'Hamburgers')
    formData.append('favoriteFoods[]', 'Sushi')
    const result = getParams(formData, mySchema)
    expect(result.success).toBe(true)
    expect(result.data.favoriteFoods?.length).toBe(4)
  })
})
```

### `useFormInputProps(schema)`

This helper allows you to set the props on your form `<input/>` based on your Zod schema.

The function returns another function that you use to spread the properties on your input. It currently sets the following props based on the key value you specify. If you need to override any of the props, just add it after you spread.

- name
- type: text, number, checkbox, date, email, url
- required: not .optional()
- min/max: number
- minlength/maxlength: text
- pattern: regex

If the key doesn't exist in the schema, it will throw an error. This way if you rename any properties, it will force you to use the correct key.

This currently uses the native browser validation like `required`. I plan on adding enhanced client-side validation that will utilize the same Zod schema.

```ts
function Component() {
  const inputProps = useFormInputProps(schema)

  return (
    <Form>
      <input ...{inputProps('a')} />
      <input ...{inputProps('b')} />
      <input ...{inputProps('c')} />
      {/* This will throw an error since 'x' is not in schema*/}
      <input ...{inputProps('x')} />
    </Form>
  )
}
```

### `useInputValidation(schema, actionErrors)`

> Not dependent about Remix

This hook allows you to client-side validate your form `<input/>` based on your Zod schema.

It returns `validation`, `validate`, `reValidate` and `formRef`

- `validation` : form validation state
  ```json
  {
    "success": boolean, // is form validation success ?
    "field": {
      "cardNumber": { // generated by your Zod schema
        "success": boolean, // satisfies Zod schema rules ?
        "touched": boolean, // have user focused this field
        "error": string | null, // Zod validation error
        "required": boolean, // Zod optional ?
        "key": "cardNumber", // generated name from your Zod schema
        "value": fieldValue | null // what's in the input (valid or not)
      }
      // other form fields
    }
  }
  ```
- `validate` : function to pass to `onBlur` or `onChange`.

  > Triggers validation on every input value update

- `reValidate`: same as `validate` but triggers validation only if input was previously false
- `formRef` ref to pass to the form (needed for magic thing)

`useInputValidation` takes schema and `actionErrors` (optional) if you want to sync your form state with action error.

`actionErrors` comes from `getFormData()` return value

```ts
type ActionData = {
  data: Record<string, any>
  errors?: ActionValidationErrors<typeof ActionSchema>
}

export let action: ActionFunction = async ({ request }) => {
  const result = await getFormData(request, Schema)
  return json({ errors: result.errors }, { status: 400 })
}

function Component() {
  let { data, errors } = (useActionData() || {}) as ActionData
  const { validation, validate, reValidate, formRef } = useInputValidation(
    ActionSchema,
    errors,
  )

  return (
    <Form ref={formRef}>
      <input
        type="text"
        name={field.name.key}
        id="name"
        autoComplete="off"
        onBlur={validate}
        onChange={reValidate}
      />
      <button disabled={!validation.success}>Submit</button>
    </Form>
  )
}
```

## 🌎 Example App

There is an example app at https://remix-params-helper.herokuapp.com/

Click on the _Actions_ demo and the _URL Params_ demo to see the helper in action.

## 😍 Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/kiliman"><img src="https://avatars.githubusercontent.com/u/47168?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kiliman</b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=kiliman" title="Code">💻</a> <a href="https://github.com/Kiliman/remix-params-helper/commits?author=kiliman" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/kettui"><img src="https://avatars.githubusercontent.com/u/12547765?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Antti</b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=kettui" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/zolrath"><img src="https://avatars.githubusercontent.com/u/454563?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Matt Furden</b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=zolrath" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/raulrpearson"><img src="https://avatars.githubusercontent.com/u/23662058?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Raúl R Pearson</b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=raulrpearson" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/cliffordfajardo"><img src="https://avatars.githubusercontent.com/u/6743796?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Clifford Fajardo </b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=cliffordfajardo" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/binajmen"><img src="https://avatars.githubusercontent.com/u/15611419?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Benjamin</b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=binajmen" title="Tests">⚠️</a> <a href="https://github.com/Kiliman/remix-params-helper/issues?q=author%3Abinajmen" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/dusty"><img src="https://avatars.githubusercontent.com/u/792?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dusty Doris</b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=dusty" title="Code">💻</a> <a href="https://github.com/Kiliman/remix-params-helper/issues?q=author%3Adusty" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/rphlmr"><img src="https://avatars.githubusercontent.com/u/20722140?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Raphaël Moreau</b></sub></a><br /><a href="https://github.com/Kiliman/remix-params-helper/commits?author=rphlmr" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
