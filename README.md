# Remix Params Helper

This package makes it simple to use [Zod](https://github.com/colinhacks/zod) with
standard [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) and [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
which are typically used in [Remix](https://remix.run) apps.

## 🚧 Work in progress

This package is still work in progress. I'll be refining the API and fixing the TypeScript types.

## 🛠 Installation

```sh
npm install remix-params-helper zod
```

Zod is a peer dependency

## 📦 Zod

Zod is used to validate untyped data and either return a valid object or a list of errors encounted.

To use the helper, first define your Zod schema and generate a TypeScript type using `z.infer`.

```ts
const ParamsSchema = z.object({
  a: z.number(),
  b: z.string(),
  c: z.boolean(),
  d: z.string().optional(),
  e: z.array(z.number()),
})
type ParamsType = z.infer<typeof ParamsSchema>
```

## 📝 API Reference

### `getParams<T>(params, schema)`

This function is used to parse and validate data from `URLSearchParams`, `FormData`, or Remix `params` object.

It returns an object that has `success` property. If `result.success` is `true` then `result.data` will be a valid object of type `T`.

Otherwise, `result.errors` will be an object with keys for each property that failed validation. The key value will be the validation error message.

Unlike `Object.fromEntries()`, this function also supports multi-value keys and will convert them to an array. So `e=1&e=2&e=3` will convert it to `e: [1,2,3]`

```ts
  const url = new URL(request.url)
  const result = getParams<ParamsType>(url.searchParams, ParamsSchema)
  if (!result.success) {
    throw new Response(result.errors), { status: 400 })
  }
  // these variable will be typed and valid
  const { a, b, c, d, e } = result.data
```

### `useFormInputProps(schema)`

This helper allows you to set the props on your form `<input/>` based on your Zod schema.

The function returns another function that you use to spread the properties on your input. It currently sets the `name`, `type`, and `required` props based on the key value you specify. If you need to override any of the props, just add it after you spread.

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

## 🌎 Example App

There is an example app at https://remix-params-helper.herokuapp.com/

Click on the _Actions_ demo and the _URL Params_ demo to see the helper in action.
