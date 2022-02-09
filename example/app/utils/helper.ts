import {
  z,
  ZodArray,
  ZodBoolean,
  ZodDefault,
  ZodEnum,
  ZodNativeEnum,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodString,
  ZodType,
  ZodTypeAny,
} from 'zod'

function isIterable(
  maybeIterable: unknown,
): maybeIterable is Iterable<unknown> {
  return Symbol.iterator in Object(maybeIterable)
}

function parseParams(o: any, schema: any, key: string, value: any) {
  const shape = schema instanceof ZodObject ? schema.shape : schema
  console.log(`parseParams`, { o, shape, key, value })
  if (key.includes('.')) {
    let [parentProp, ...rest] = key.split('.')
    o[parentProp] = o[parentProp] ?? {}
    parseParams(o[parentProp], shape[parentProp], rest.join('.'), value)
    return
  }

  const def = shape[key]
  console.log(def)
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
):
  | { success: true; data: T; errors: undefined }
  | { success: false; data: undefined; errors: { [key: string]: string } } {
  // @ts-ignore
  let o: any = {}
  let entries: [string, unknown][] = []
  if (isIterable(params)) {
    entries = Array.from(params)
  } else {
    entries = Object.entries(params)
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
    return { success: true, data: result.data as T, errors: undefined }
  } else {
    let errors: any = {}
    const addError = (key: string, message: string) => {
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
    return { success: false, data: undefined, errors }
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

export type InputPropType = {
  name: string
  type: string
  required?: boolean
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
    let type = defInputType(def)
    const required = !(def instanceof ZodOptional || def instanceof ZodArray)
    let p: InputPropType = {
      name: key,
      type,
    }
    if (required) p.required = true
    return p
  }
}

function processDef(def: ZodTypeAny, o: any, key: string, value: string) {
  let parsedValue: any
  if (def instanceof ZodString) {
    parsedValue = value
  } else if (def instanceof ZodNumber) {
    const num = Number(value)
    parsedValue = isNaN(num) ? value : num
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
  } else {
    throw new Error(`Unexpected type ${def._def.typeName} for key ${key}`)
  }
  if (Array.isArray(o[key])) {
    o[key].push(parsedValue)
  } else {
    o[key] = parsedValue
  }
}

function defInputType(def: ZodTypeAny) {
  let type = 'text'
  if (def instanceof ZodNumber) {
    type = 'number'
  } else if (def instanceof ZodBoolean) {
    type = 'checkbox'
  } else if (def instanceof ZodArray) {
    type = defInputType(def.element)
  } else if (def instanceof ZodOptional) {
    type = defInputType(def.unwrap())
  }
  return type
}
