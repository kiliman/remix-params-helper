import {
  boolean,
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
  return Symbol.iterator in Object(maybeIterable)
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

async function getParamsInternal<T>(
  params: URLSearchParams | FormData | Record<string, string | undefined>,
  schema: any,
): Promise<
  | { success: true; data: T; errors: undefined }
  | { success: false; data: undefined; errors: { [key: string]: string } }
> {
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

  const result = await schema.safeParseAsync(o)
  if (result.success) {
    return {
      success: true,
      data: result.data as T,
      errors: undefined,
    }
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

export async function getField<T extends ZodObject<any, any, any>>(
  name: string,
  formData: any,
  schema: T,
) {
  type ParamsType = z.infer<T>

  return getParamsInternal<ParamsType>(formData, schema.pick({ [name]: true }))
}

export async function getParamsOrFail<T extends ZodType<any, any, any>>(
  params: URLSearchParams | FormData | Record<string, string | undefined>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  const result = await getParamsInternal<ParamsType>(params, schema)
  if (!result.success) {
    throw new Error(JSON.stringify(result.errors))
  }
  return result.data
}

export async function getSearchParamsOrFail<T extends ZodType<any, any, any>>(
  request: Pick<Request, 'url'>,
  schema: T,
) {
  type ParamsType = z.infer<T>
  let url = new URL(request.url)
  const result = await getParamsInternal<ParamsType>(url.searchParams, schema)
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
  const result = await getParamsInternal<ParamsType>(data, schema)
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

export type FormFieldState = {
  success: boolean
  touched: boolean
  error: string | null
  key: string
  required: boolean
  value?: any | null
}

export type ActionValidationErrors<T extends SomeZodObject> = Record<
  keyof z.infer<T>,
  string
>

type Field<T extends SomeZodObject> = Record<keyof z.infer<T>, FormFieldState>

type ValidationState<T extends SomeZodObject> = {
  success: boolean
  field: Field<T>
}

export function useInputValidation<T extends SomeZodObject>(
  schema: T,
  actionErrors?: ActionValidationErrors<T>,
) {
  type StateType = ValidationState<T>

  const formRef = React.useRef<HTMLFormElement>(null)

  const [validation, setValidation] = React.useState(() => {
    const state = { success: false, field: {} } as StateType
    for (const key in schema.shape) {
      const required = !schema.shape[key].isOptional()
      state.field[key as keyof z.infer<T>] = {
        success: !required,
        touched: false,
        error: null,
        required,
        key,
        value: null,
      }
    }
    return state
  })

  //listen to errors sent back by action
  React.useEffect(() => {
    if (!actionErrors) return

    setValidation(prevValidation => {
      // we don't want to use 'validation' state directly because its create an infinite loop
      let serverState = { success: false, field: {} } as StateType
      for (const key in schema.shape) {
        const prevFieldState = prevValidation.field[key]
        serverState.field[key as keyof z.infer<T>] = {
          success: !Boolean(actionErrors[key]),
          touched: Boolean(actionErrors[key]),
          error: actionErrors[key],
          required: prevFieldState.required,
          key,
          value: prevFieldState.value,
        }
      }
      return serverState
    })
  }, [actionErrors])

  const getSuccess = (field: Field<T>) => {
    let success = true
    for (const key in field) {
      // required and success
      if (field[key].required && !field[key].success) {
        success = false
      }
      // not required but error
      if (!field[key].success) {
        success = false
      }
    }
    return success
  }

  const validate = React.useCallback(
    async (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.FocusEvent<HTMLInputElement>,
    ) => {
      const key = e.target.name
      const value = e.target.value

      if (!formRef.current) return

      const formData = new FormData(formRef.current)

      const validationResult = await getField(key, formData, schema).catch(
        e => {
          console.error(
            `Maybe useInputValidation could not find shape for field "${key}"`,
          )
          throw e
        },
      )

      setValidation((prevValidation): StateType => {
        if (validationResult.success) {
          const required = prevValidation.field[key].required
          const incomingSuccessState: StateType = {
            ...prevValidation,
            field: {
              ...prevValidation.field,
              [key]: {
                error: null,
                success: true,
                touched: true,
                required,
                key: key,
                value,
              },
            },
          }
          return {
            ...incomingSuccessState,
            success: getSuccess(incomingSuccessState.field),
          }
        }

        return {
          ...prevValidation,
          success: false,
          field: {
            ...prevValidation.field,
            [key]: {
              error: validationResult.errors[key],
              success: false,
              touched: true,
              required: prevValidation.field[key].required,
              key: key,
              value,
            },
          },
        }
      })
    },
    [schema],
  )

  const reValidate = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const key = e.target.name
      const value = e.target.value

      if (validation.field[key].error || !value) {
        return validate(e)
      }
    },
    [validate, validation],
  )

  return { validation, validate, reValidate, formRef }
}
