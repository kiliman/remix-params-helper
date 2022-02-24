import { z } from 'zod'
import {
  getFormData,
  getParams,
  getParamsOrFail,
  getSearchParams,
  useFormInputProps,
} from '../src/helper'

enum TestEnum {
  A = 'A',
  B = 'B',
}

const mySchema = z.object({
  a: z
    .string({
      required_error: 'a is required',
      invalid_type_error: 'a must be a string',
    })
    .min(5, { message: 'a must be at least 5 characters' })
    .max(10, { message: 'a must be at most 10 characters' }),
  b: z.array(z.number()),
  c: z.boolean({ required_error: 'c is required' }),
  d: z.string().optional(),
  e: z.number(),
  f: z.string().optional(),
  g: z.string().default('z'),
  h: z.string().default('z'),
  zodEnum: z.enum(['A', 'B']),
  nativeEnum: z.nativeEnum(TestEnum).optional(),
  email: z
    .string()
    .email({ message: 'Invalid email' })
    .min(5, { message: 'Email must be at least 5 characters' })
    .optional(),
})

describe('test getParams', () => {
  it('should return data from params', () => {
    const params = { a: 'a value' }
    const schema = z.object({ a: z.string() })

    const { success, data, errors } = getParams(params, schema)

    expect(success).toBe(true)
    expect(errors).toBeUndefined()
    expect(data).toEqual({
      a: 'a value',
    })
  })

  it('should return data from URLSearchParams', () => {
    const params = new URLSearchParams()
    params.set('a', 'abcdef')
    params.append('b', '1')
    params.append('b', '2')
    params.set('c', 'true')
    params.set('e', '10')
    params.set('f', 'y')
    params.set('g', '') // empty params should use the default value when provided one
    params.set('h', 'something')
    params.set('zodEnum', 'A')
    params.set('nativeEnum', 'B')

    const { success, data, errors } = getParams(params, mySchema)

    expect(success).toBe(true)
    expect(errors).toBeUndefined()
    expect(data).toEqual({
      a: 'abcdef',
      b: [1, 2],
      c: true,
      e: 10,
      f: 'y',
      g: 'z',
      h: 'something',
      zodEnum: 'A',
      nativeEnum: TestEnum.B,
    })
  })

  it('should return error', () => {
    const params = new URLSearchParams()
    params.set('a', '') // empty param should be inferred as if it was undefined
    params.append('b', '1')
    params.append('b', 'x') // invalid number
    //params.set('c', 'true') missing required param
    params.set('e', 'xyz') // invalid number
    params.set('email', 'abc')
    params.set('zodEnum', 'C')
    params.set('nativeEnum', 'D')

    const { success, errors } = getParams(params, mySchema)

    expect(success).toBe(false)
    expect(errors?.['a']).toEqual(`a is required`)
    expect(errors?.['b']).toEqual('Expected number, received string')
    expect(errors?.['c']).toEqual(`c is required`)
    expect(errors?.['e']).toEqual('Expected number, received string')
    expect(errors?.['zodEnum']).toEqual(
      "Invalid enum value. Expected 'A' | 'B', received 'C'",
    )
    expect(errors?.['nativeEnum']).toEqual(
      "Invalid enum value. Expected 'A' | 'B', received 'D'",
    )
    expect(errors?.['email']).toEqual([
      'Invalid email',
      'Email must be at least 5 characters',
    ])
  })
})

describe('test getSearchParamsFromRequest', () => {
  it('should return data from Request', () => {
    const url = new URL('http://localhost')
    url.searchParams.set('a', 'abcdef')
    url.searchParams.append('b', '1')
    url.searchParams.append('b', '2')
    url.searchParams.set('c', 'true')
    url.searchParams.set('e', '10')
    url.searchParams.set('f', 'y')
    url.searchParams.set('g', '') // empty url.searchParams should use the default value when provided one
    url.searchParams.set('h', 'something')
    url.searchParams.set('zodEnum', 'A')
    url.searchParams.set('nativeEnum', 'B')

    const { success, data, errors } = getSearchParams(
      { url: url.toString() },
      mySchema,
    )

    expect(success).toBe(true)
    expect(errors).toBeUndefined()
    expect(data).toEqual({
      a: 'abcdef',
      b: [1, 2],
      c: true,
      e: 10,
      f: 'y',
      g: 'z',
      h: 'something',
      zodEnum: 'A',
      nativeEnum: TestEnum.B,
    })
  })

  it('should return error', () => {
    const url = new URL('http://localhost')
    url.searchParams.set('a', '') // empty param should be inferred as if it was undefined
    url.searchParams.append('b', '1')
    url.searchParams.append('b', 'x') // invalid number
    //url.searchParams.set('c', 'true') missing required param
    url.searchParams.set('e', 'xyz') // invalid number
    url.searchParams.set('email', 'abc')
    url.searchParams.set('zodEnum', 'C')
    url.searchParams.set('nativeEnum', 'D')

    const { success, data, errors } = getSearchParams(
      { url: url.toString() },
      mySchema,
    )
    expect(success).toBe(false)
    expect(data).toBeUndefined()
    expect(errors?.['a']).toEqual(`a is required`)
    expect(errors?.['b']).toEqual('Expected number, received string')
    expect(errors?.['c']).toEqual(`c is required`)
    expect(errors?.['e']).toEqual('Expected number, received string')
    expect(errors?.['zodEnum']).toEqual(
      "Invalid enum value. Expected 'A' | 'B', received 'C'",
    )
    expect(errors?.['nativeEnum']).toEqual(
      "Invalid enum value. Expected 'A' | 'B', received 'D'",
    )
    expect(errors?.['email']).toEqual([
      'Invalid email',
      'Email must be at least 5 characters',
    ])
  })
})

describe('test getFormDataFromRequest', () => {
  it('should return data from Request', async () => {
    let formData = new FormData()
    formData.set('a', 'abcdef')
    formData.append('b', '1')
    formData.append('b', '2')
    formData.set('c', 'true')
    formData.set('e', '10')
    formData.set('f', 'y')
    formData.set('g', '') // empty formData should use the default value when provided one
    formData.set('h', 'something')
    formData.set('zodEnum', 'A')
    formData.set('nativeEnum', 'B')

    const { success, data, errors } = await getFormData(
      { formData: async () => formData },
      mySchema,
    )

    expect(success).toBe(true)
    expect(errors).toBeUndefined()
    expect(data).toEqual({
      a: 'abcdef',
      b: [1, 2],
      c: true,
      e: 10,
      f: 'y',
      g: 'z',
      h: 'something',
      zodEnum: 'A',
      nativeEnum: TestEnum.B,
    })
  })

  it('should return error', async () => {
    let formData = new FormData()
    formData.set('a', '') // empty param should be inferred as if it was undefined
    formData.append('b', '1')
    formData.append('b', 'x') // invalid number
    //formData.set('c', 'true') missing required param
    formData.set('e', 'xyz') // invalid number
    formData.set('email', 'abc')
    formData.set('zodEnum', 'C')
    formData.set('nativeEnum', 'D')

    const { success, data, errors } = await getFormData(
      { formData: async () => formData },
      mySchema,
    )

    expect(success).toBe(false)
    expect(data).toBeUndefined()
    expect(errors?.['a']).toEqual(`a is required`)
    expect(errors?.['b']).toEqual('Expected number, received string')
    expect(errors?.['c']).toEqual(`c is required`)
    expect(errors?.['e']).toEqual('Expected number, received string')
    expect(errors?.['zodEnum']).toEqual(
      "Invalid enum value. Expected 'A' | 'B', received 'C'",
    )
    expect(errors?.['nativeEnum']).toEqual(
      "Invalid enum value. Expected 'A' | 'B', received 'D'",
    )
    expect(errors?.['email']).toEqual([
      'Invalid email',
      'Email must be at least 5 characters',
    ])
  })
})

it('should throw error', async () => {
  let formData = new FormData()
  formData.set('a', '') // empty param should be inferred as if it was undefined
  formData.append('b', '1')
  formData.append('b', 'x') // invalid number
  //formData.set('c', 'true') missing required param
  formData.set('e', 'xyz') // invalid number
  formData.set('email', 'abc')
  formData.set('zodEnum', 'C')
  formData.set('nativeEnum', 'D')

  await expect(async () =>
    getParamsOrFail(formData, mySchema),
  ).rejects.toThrowError()
})

describe('test useFormInputProps', () => {
  it('should return correct form input props', () => {
    const inputProps = useFormInputProps(mySchema)
    expect(inputProps('a')).toEqual({ type: 'text', name: 'a', required: true })
    expect(inputProps('b')).toEqual({
      type: 'number',
      name: 'b',
    })
    expect(inputProps('c')).toEqual({
      type: 'checkbox',
      name: 'c',
      required: true,
    })
    expect(inputProps('d')).toEqual({ type: 'text', name: 'd' })
    expect(inputProps('e')).toEqual({
      type: 'number',
      name: 'e',
      required: true,
    })
  })
  it('should throw with invalid key', () => {
    const inputProps = useFormInputProps(mySchema)
    expect(() => inputProps('x')).toThrowError()
  })
})

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
    if (result.success) {
      expect(result.data.address.street).toBe('123 Main St')
    }
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
    if (result.success) {
      expect(result.data.favoriteFoods?.length).toBe(4)
    }
  })
})
describe('test refine schema', () => {
  it('should ignore refine() method in schema', () => {
    const schema = z.object({
      name: z.string().refine(val => {
        const values = Object.values(JSON.parse(val))
        return (
          values.length > 0 &&
          values.some(v => typeof v === 'string' && v.length > 0)
        )
      }, 'You must fill in at least one language'),
    })
    const resultGood = getParams({ name: '{"en":"Game"}' }, schema)
    expect(resultGood.success).toBe(true)

    const resultBad = getParams({ name: '{"en":"","fr":""}' }, schema)
    expect(resultBad.success).toBe(false)
    expect(resultBad?.errors?.['name']).toBe(
      'You must fill in at least one language',
    )
  })
  it('should support number min/max in schema', () => {
    const schema = z.object({
      num: z.number().min(1).max(10),
    })
    const formData = new FormData()
    formData.set('num', '1')
    const resultGood = getParams(formData, schema)
    expect(resultGood.success).toBe(true)
    expect(resultGood.data?.num).toBe(1)
    expect(typeof resultGood.data?.num).toBe('number')

    formData.set('num', '20')
    let resultBad = getParams(formData, schema)
    expect(resultBad.success).toBe(false)
    expect(resultBad.errors?.['num']).toBe(
      'Value should be less than or equal to 10',
    )

    formData.set('num', 'abc')
    resultBad = getParams(formData, schema)
    expect(resultBad.success).toBe(false)
    expect(resultBad.errors?.['num']).toBe('Expected number, received string')
  })
  it('should support number schema with refine', () => {
    const schema = z
      .object({
        min: z.number(),
        max: z.number(),
      })
      .refine(data => data.min < data.max, {
        message: 'Min must be less than Max',
        path: ['min'],
      })
    const formData = new FormData()
    formData.set('min', '1')
    formData.set('max', '2')
    const resultGood = getParams(formData, schema)
    expect(resultGood.success).toBe(true)
    expect(resultGood.data?.min).toBe(1)
    expect(resultGood.data?.max).toBe(2)
    expect(typeof resultGood.data?.min).toBe('number')
    expect(typeof resultGood.data?.max).toBe('number')

    formData.set('min', '2')
    formData.set('max', '1')
    let resultBad = getParams(formData, schema)
    console.log(resultBad)
    expect(resultBad.success).toBe(false)
    expect(resultBad.errors?.['min']).toBe('Min must be less than Max')

    formData.set('min', 'abc')
    formData.set('max', 'xyz')
    resultBad = getParams(formData, schema)
    expect(resultBad.success).toBe(false)
    expect(resultBad.errors?.['min']).toBe('Expected number, received string')
    expect(resultBad.errors?.['max']).toBe('Expected number, received string')
  })
})
describe('test dates', () => {
  it('should parse valid dates', () => {
    const schema = z.object({
      date: z.date(),
    })
    const formData = new FormData()
    formData.set('date', '2020-01-01')

    const result = getParams(formData, schema)
    expect(result.success).toBe(true)
    const { date } = result.data!
    expect(date instanceof Date).toBe(true)
    expect(date.toISOString()).toBe('2020-01-01T00:00:00.000Z')
  })
  it('should fail invalid dates', () => {
    const schema = z.object({
      date: z.date(),
    })
    const formData = new FormData()
    formData.set('date', 'abc')

    const result = getParams(formData, schema)
    expect(result.success).toBe(false)
    expect(result.errors?.['date']).toBe('Expected date, received string')
  })
})
