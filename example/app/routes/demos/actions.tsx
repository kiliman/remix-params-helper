import { MutableRefObject, useEffect, useRef } from 'react'
import type { ActionFunction } from 'remix'
import { Form, json, useActionData, redirect } from 'remix'
import { z } from 'zod'
import {
  ActionValidationErrors,
  FormFieldState,
  getFormData,
  useFormValidation,
} from '~/utils/helper'

export function meta() {
  return { title: 'Actions Demo' }
}

const ActionSchema = z.object({
  name: z.string().min(2, 'Too short'),
  cardNumber: z.number().optional(),
  age: z.number(),
  number: z.number(),
  favorites: z.array(z.string()),
  accept: z.boolean(),
  remember: z.boolean().optional(),
  answer: z.boolean().optional(),
})

type ActionType = z.infer<typeof ActionSchema>

type ActionData = {
  data: Record<string, any>
  errors?: ActionValidationErrors<typeof ActionSchema>
}

// When your form sends a POST, the action is called on the server.
// - https://remix.run/api/conventions#action
// - https://remix.run/guides/data-updates
export let action: ActionFunction = async ({ request }) => {
  const result = await getFormData(request, ActionSchema)

  // Typical action workflows start with validating the form data that just came
  // over the network. Clientside validation is fine, but you definitely need it
  // server side.  If there's a problem, return the the data and the component
  // can render it.
  if (!result.success) {
    return json({ errors: result.errors }, { status: 400 })
  }
  // result.data is typed, so dereferrence it to get the actual typed properties
  const { name, age, number, favorites } = result.data
  // return the data to render as json
  return json({ data: result.data })
}

const getFieldStyle = (state: FormFieldState, custom?: string | null) => {
  if (custom) {
    return custom
  }
  if (state.touched && state.required) {
    if (state.error) {
      return 'remix__form__error'
    }
    return 'remix__form__success'
  }
  if (state.touched) {
    if (state.error) {
      return 'remix__form__error'
    } else if (state.success) {
      return 'remix__form__success'
    }
  }

  return 'remix__form__untouched'
}

export default function ActionsDemo() {
  let focusRef = useRef<HTMLInputElement>(null)
  let { data, errors } = (useActionData() || {}) as ActionData

  const { validation, validate, reValidate, formRef } = useFormValidation(
    ActionSchema,
    errors,
  )
  const { field } = validation

  useEffect(() => {
    if (errors?.name && focusRef.current) {
      focusRef.current.select()
    }
  }, [errors])

  console.log(validation)

  return (
    <div className="remix__page">
      <main>
        <p>
          This form submission will send a post request that we handle in our
          `action` export. But before that, client side validation based on the
          same Zod schema ✌️
        </p>
        <Form method="post" className="remix__form" ref={formRef}>
          <h3>Post an Action</h3>
          <label>
            <div>
              <span className={getFieldStyle(field.name)}>
                Name{field.name.required ? '*' : ''}:
              </span>
              <span className="remix__form__error">
                {validation.field.name.error}
              </span>
            </div>
            <input
              ref={focusRef}
              type="text"
              name={field.name.key}
              id="name"
              autoComplete="off"
              onBlur={validate}
              onChange={reValidate}
            />
          </label>
          <label>
            <div>
              <span
                className={getFieldStyle(
                  field.cardNumber,
                  typeof field.cardNumber.value === 'string' &&
                    field.cardNumber.value.length === 0 &&
                    field.cardNumber.success
                    ? 'remix__form__untouched'
                    : null,
                )}
              >
                Card number 👮‍♀️{field.cardNumber.required ? '*' : ''}:
              </span>
              <span className="remix__form__error">
                {validation.field.cardNumber.error}
              </span>
            </div>
            <input
              type="text"
              name={field.cardNumber.key}
              id="cardNumber"
              autoComplete="off"
              onBlur={validate}
              onChange={reValidate}
            />
          </label>
          <label>
            <div>
              <span className={getFieldStyle(field.age)}>
                Age{field.age.required ? '*' : ''}:
              </span>
              <span className="remix__form__error">
                {validation.field.age.error}
              </span>
            </div>
            <input
              name={field.age.key}
              id="age"
              type="number"
              onBlur={validate}
              onChange={reValidate}
            />
          </label>
          <label>
            <div>
              <span className={getFieldStyle(field.number)}>
                Should be a number{field.number.required ? '*' : ''}:
              </span>
              <span className="remix__form__error">
                {validation.field.number.error}
              </span>
            </div>
            <input
              name={field.number.key}
              type="text"
              id="number"
              autoComplete="off"
              required={false}
              onChange={reValidate}
              onBlur={validate}
            />
          </label>
          <label>
            <div>
              <span className={getFieldStyle(field.favorites)}>
                Favorites{field.favorites.required ? '*' : ''}:
              </span>
              <span className="remix__form__error">
                {validation.field.favorites.error}
              </span>
            </div>
            <div>
              {['Remix', 'Next.js', 'React', 'Prisma', 'GraphQL', 'Fly.io'].map(
                favorite => (
                  <label className="block" key={favorite}>
                    <input
                      name={field.favorites.key}
                      id={favorite}
                      onChange={validate}
                      type="checkbox"
                      defaultValue={favorite}
                    />{' '}
                    {favorite}
                  </label>
                ),
              )}
            </div>
          </label>
          <label>
            <div>
              <span className={getFieldStyle(field.accept)}>
                Accept{field.accept.required ? '*' : ''}{' '}
                {field.accept.success ? '✓' : '(must be checked)'}:
              </span>
              <span className="remix__form__error">
                {validation.field.accept.error}
              </span>
            </div>
            <input
              name={field.accept.key}
              id="accept"
              type="checkbox"
              onChange={validate}
            />
          </label>
          <label>
            <div>
              <span className={getFieldStyle(field.remember)}>
                Remember Password{field.remember.required ? '*' : ''}{' '}
                {field.remember.success ? '✓' : ''}:
              </span>
              <span className="remix__form__error">
                {validation.field.remember.error}
              </span>
            </div>
            <input
              name={field.remember.key}
              id="remember"
              type="checkbox"
              onChange={validate}
            />
          </label>
          <label>
            <div>
              <span className={getFieldStyle(field.answer)}>
                Question{field.answer.required ? '*' : ''} :
              </span>
              <span className="remix__form__error">
                {validation.field.answer.error}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label>
                <input
                  name={field.answer.key}
                  onChange={validate}
                  id="answer"
                  type="radio"
                  value="true"
                />{' '}
                Yes
              </label>
              <label>
                <input
                  name={field.answer.key}
                  onChange={validate}
                  id="answer"
                  type="radio"
                  value="false"
                />{' '}
                No
              </label>
              <label>
                <input
                  name={field.answer.key}
                  onChange={validate}
                  id="answer"
                  type="radio"
                  value=""
                />{' '}
                Not answered
              </label>
            </div>
          </label>

          <div>
            <button disabled={!validation.success}>Submit</button>
            {!validation.success ? (
              <p className="remix__form__warning">Don't miss any fields 👮‍♀️</p>
            ) : (
              <p className="remix__form__success">All good, let's go 🚀</p>
            )}
          </div>
          {data || errors ? (
            <pre>{JSON.stringify({ data, errors }, null, 2)}</pre>
          ) : null}
        </Form>
      </main>
    </div>
  )
}
