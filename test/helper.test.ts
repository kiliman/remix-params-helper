import { z } from 'zod'
import { getParams, useFormInputProps } from '../src/helper'

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
  email: z
    .string()
    .email({ message: 'Invalid email' })
    .min(5, { message: 'Email must be at least 5 characters' })
    .optional(),
})
type MyParams = z.infer<typeof mySchema>

describe('test getParams', () => {
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

    const { success, data } = getParams<MyParams>(params, mySchema)

    expect(success).toBe(true)
    expect(data).toEqual({
      a: 'abcdef',
      b: [1, 2],
      c: true,
      e: 10,
      f: 'y',
      g: 'z',
      h: 'something',
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
    const { success, errors } = getParams<MyParams>(params, mySchema)
    expect(success).toBe(false)
    expect(errors?.['a']).toEqual(`a is required`)
    expect(errors?.['b']).toEqual('Expected number, received string')
    expect(errors?.['c']).toEqual(`c is required`)
    expect(errors?.['e']).toEqual('Expected number, received string')
    expect(errors?.['email']).toEqual([
      'Invalid email',
      'Email must be at least 5 characters',
    ])
  })
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
