import {
  SomeZodObject,
  z,
  ZodArray,
  ZodBoolean,
  ZodDate,
  ZodDefault,
  ZodEffects,
  ZodEnum,
  ZodNativeEnum,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodType,
  ZodTypeAny,
} from 'zod'
import React from 'react'

function isIterable(
  maybeIterable: unknown,
): maybeIterable is Iterable<unknown> {
  return (
    Symbol.iterator in Object(maybeIterable) &&
    typeof maybeIterable !== 'string'
  )
}

function isObject(maybeObject: unknown): maybeObject is Object {
  return typeof maybeObject === 'object'
}

function parseParams(o: any, schema: any, key: string, value: any) {
  // find actual shape definition for this key
  let shape = schema
  while (shape instanceof ZodObject || shape instanceof ZodEffects) {
    shape =
      shape instanceof ZodObject
        ? shape.shape
        : shape instanceof ZodEffects
        ? shape._def.schema
        : null
    if (shape === null) {
      throw new Error(`Could not find shape for key ${key}`)
    }
  }

  if (key.includes('.')) {
    let [parentProp, ...rest] = key.split('.')
    o[parentProp] = o[parentProp] ?? {}
    parseParams(o[parentProp], shape[parentProp], rest.join('.'), value)
    return
  }

  const def = shape[key]
  if (def) {
    processDef(def, o, key, value as string)
  } else {
    if (o.hasOwnProperty(key)) {
      if (!Array.isArray(o[key])) {
        o[key] = [o[key]]
      }
      o[key].push(value)
    } else {
      o[key] = value
    }
  }
}

function getParamsInternal<T>(
  params: URLSearchParams | FormData | Record<string, string | undefined>,
  schema: any,
  fieldName?: string,
):
  | { success: true; data: T; errors: undefined; error: undefined }
  | {
      success: false
      data: undefined
      errors: { [key: string]: string }
      error: undefined
    }
  | { success: false; data: undefined; errors: undefined; error: string } {
  console.log('params', params)
  // @ts-ignore
  let o: any = {}
  let entries: [string, unknown][] = []
  if (isIterable(params)) {
    console.log('iterable')
    entries = Array.from(params)
  } else if (isObject(params)) {
    console.log('else')
    entries = Object.entries(params)
  } else {
    o = processDef(schema, o, fieldName!, params)
    console.log('ooo', o, typeof schema)
  }

  for (let [key, value] of entries) {
    // infer an empty param as if it wasn't defined in the first place
    if (value === '') {
      continue
    }
    // remove [] from key since we already handle multi-value params
    key = key.replace(/\[\]/g, '')
    parseParams(o, schema, key, value)
  }

  const result = schema.safeParse(o)
  if (result.success) {
    return {
      success: true,
      data: result.data as T,
      errors: undefined,
      error: undefined,
    }
  } else {
    let errors: any = {}
    let error: any = undefined
    const addError = (key: string | undefined, message: string) => {
      if (!key) {
        error = message
        return
      }
      if (!errors.hasOwnProperty(key)) {
        errors[key] = message
      } else {
        if (!Array.isArray(errors[key])) {
          errors[key] = [errors[key]]
        }
        errors[key].push(message)
      }
    }
    for (let issue of result.error.issues) {
      console.log('issue', issue)
      const { message, path, code, expected, received } = issue
      const [key, index] = path
      let value = o[key]
      let prop = key
      if (index !== undefined) {
        value = value[index]
        prop = `${key}[${index}]`
      }
      addError(key, message)
    }
    return { success: false, data: undefined, errors, error }
  }
}

export function getParams<T extends ZodType<any, any, any>>(
  params: URLSearchParams | FormData | Record<string, string | undefined>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  return getParamsInternal<ParamsType>(params, schema)
}

export function getSearchParams<T extends ZodType<any, any, any>>(
  request: Pick<Request, 'url'>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  let url = new URL(request.url)
  return getParamsInternal<ParamsType>(url.searchParams, schema)
}

export async function getFormData<T extends ZodType<any, any, any>>(
  request: Pick<Request, 'formData'>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  let data = await request.formData()
  return getParamsInternal<ParamsType>(data, schema)
}

export async function getField<T extends SomeZodObject>(
  name: string,
  value: any,
  schema: T,
) {
  const fieldSchema = schema.shape[name]
  type ParamsType = z.infer<typeof fieldSchema>
  console.log('get', value, 'fieldSchema', fieldSchema, 'schema', schema)
  return getParamsInternal<ParamsType>(value, fieldSchema, name)
}

export function getParamsOrFail<T extends ZodType<any, any, any>>(
  params: URLSearchParams | FormData | Record<string, string | undefined>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  const result = getParamsInternal<ParamsType>(params, schema)
  if (!result.success) {
    throw new Error(JSON.stringify(result.errors))
  }
  return result.data
}

export function getSearchParamsOrFail<T extends ZodType<any, any, any>>(
  request: Pick<Request, 'url'>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  let url = new URL(request.url)
  const result = getParamsInternal<ParamsType>(url.searchParams, schema)
  if (!result.success) {
    throw new Error(JSON.stringify(result.errors))
  }
  return result.data
}

export async function getFormDataOrFail<T extends ZodType<any, any, any>>(
  request: Pick<Request, 'formData'>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  let data = await request.formData()
  const result = getParamsInternal<ParamsType>(data, schema)
  if (!result.success) {
    throw new Error(JSON.stringify(result.errors))
  }
  return result.data
}

export type InputPropType = {
  name: string
  type: string
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
}

export function useFormInputProps(schema: any, options: any = {}) {
  const shape = schema.shape
  const defaultOptions = options
  return function props(key: string, options: any = {}) {
    options = { ...defaultOptions, ...options }
    const def = shape[key]
    if (!def) {
      throw new Error(`no such key: ${key}`)
    }
    return getInputProps(key, def)
  }
}

function processDef(def: ZodTypeAny, o: any, key: string, value: string) {
  let parsedValue: any
  if (def instanceof ZodString) {
    parsedValue = value
  } else if (def instanceof ZodNumber) {
    const num = Number(value)
    parsedValue = isNaN(num) ? value : num
  } else if (def instanceof ZodDate) {
    const date = Date.parse(value)
    parsedValue = isNaN(date) ? value : new Date(date)
  } else if (def instanceof ZodBoolean) {
    parsedValue =
      value === 'true' ? true : value === 'false' ? false : Boolean(value)
  } else if (def instanceof ZodNativeEnum || def instanceof ZodEnum) {
    parsedValue = value
  } else if (def instanceof ZodOptional || def instanceof ZodDefault) {
    // def._def.innerType is the same as ZodOptional's .unwrap(), which unfortunately doesn't exist on ZodDefault
    processDef(def._def.innerType, o, key, value)
    // return here to prevent overwriting the result of the recursive call
    return
  } else if (def instanceof ZodArray) {
    if (o[key] === undefined) {
      o[key] = []
    }
    processDef(def.element, o, key, value)
    // return here since recursive call will add to array
    return
  } else if (def instanceof ZodEffects) {
    processDef(def._def.schema, o, key, value)
    return
  } else {
    throw new Error(`Unexpected type ${def._def.typeName} for key ${key}`)
  }
  if (Array.isArray(o[key])) {
    o[key].push(parsedValue)
  } else {
    console.log('end here')
    o[key] = parsedValue
    return parsedValue
  }
}

function getInputProps(name: string, def: ZodTypeAny): InputPropType {
  let type = 'text'
  let min, max, minlength, maxlength, pattern
  if (def instanceof ZodString) {
    if (def.isEmail) {
      type = 'email'
    } else if (def.isURL) {
      type = 'url'
    }
    minlength = def.minLength ?? undefined
    maxlength = def.maxLength ?? undefined
    const check: any = def._def.checks.find(c => c.kind === 'regex')
    pattern = check ? check.regex.source : undefined
  } else if (def instanceof ZodNumber) {
    type = 'number'
    min = def.minValue ?? undefined
    max = def.maxValue ?? undefined
  } else if (def instanceof ZodBoolean) {
    type = 'checkbox'
  } else if (def instanceof ZodDate) {
    type = 'date'
  } else if (def instanceof ZodArray) {
    return getInputProps(name, def.element)
  } else if (def instanceof ZodOptional) {
    return getInputProps(name, def.unwrap())
  }

  let inputProps: InputPropType = {
    name,
    type,
  }
  if (!def.isOptional()) inputProps.required = true
  if (min) inputProps.min = min
  if (max) inputProps.max = max
  if (minlength && Number.isFinite(minlength)) inputProps.minLength = minlength
  if (maxlength && Number.isFinite(maxlength)) inputProps.maxLength = maxlength
  if (pattern) inputProps.pattern = pattern
  return inputProps
}

type FieldState =
  | { success: true; touched: true; error: undefined }
  | {
      success: false
      touched: true
      error: string
    }
  | { success: false; touched: false; error: undefined }

type ValidationState<T extends SomeZodObject> = {
  success: boolean
  field: Record<keyof z.infer<T>, FieldState>
}

export function useZodValidation<T extends SomeZodObject>(schema: T) {
  const [validation, setValidation] = React.useState(() => {
    const state = { success: false, field: {} } as ValidationState<T>
    for (const fieldName in schema.shape) {
      state.field[fieldName as keyof z.infer<T>] = {
        success: false,
        touched: false,
        error: undefined,
      }
    }
    return state
  })

  // validField - on blur
  const validateField = async (e: React.FocusEvent<HTMLInputElement>) => {
    const fieldName = e.target.name
    const value = e.target.value
    // const validationResult = await schema.shape[fieldName].safeParseAsync(value)
    const validationResult = await getField(fieldName, value, schema)

    setValidation(prevValidation => {
      if (validationResult.success) {
        console.log(validationResult.data)
        const successState: FieldState = {
          success: true,
          touched: true,
          error: undefined,
        }

        return {
          ...prevValidation,
          field: {
            ...prevValidation.field,
            [fieldName]: successState,
          },
        }
      }

      console.log(fieldName)
      console.log(validationResult.error)
      const errorState: FieldState = {
        success: false,
        touched: true,
        error: validationResult.error!,
      }

      return {
        ...prevValidation,
        field: {
          ...prevValidation.field,
          [fieldName]: errorState,
        },
      }
    })
  }

  return { validation, validateField }
}
