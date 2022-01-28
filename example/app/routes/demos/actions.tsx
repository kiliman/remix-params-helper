import { useEffect, useRef } from 'react'
import type { ActionFunction } from 'remix'
import { Form, json, useActionData, redirect } from 'remix'
import { z } from 'zod'
import { getParams, useFormInputProps } from '~/utils/helper'

export function meta() {
  return { title: 'Actions Demo' }
}

const ActionSchema = z.object({
  name: z.string(),
  age: z.number(),
  number: z.number(),
  favorites: z.array(z.string()),
  accept: z.boolean(),
  remember: z.boolean().optional(),
  answer: z.boolean().optional(),
})

type ActionType = z.infer<typeof ActionSchema>

// When your form sends a POST, the action is called on the server.
// - https://remix.run/api/conventions#action
// - https://remix.run/guides/data-updates
export let action: ActionFunction = async ({ request }) => {
  let formData = await request.formData()
  const result = getParams<ActionType>(formData, ActionSchema)
  // Typical action workflows start with validating the form data that just came
  // over the network. Clientside validation is fine, but you definitely need it
  // server side.  If there's a problem, return the the data and the component
  // can render it.
  if (!result.success) {
    return json(result.errors, { status: 400 })
  }
  // result.data is typed, so dereferrence it to get the actual typed properties
  const { name, age, number, favorites } = result.data
  // return the data to render as json
  return json(result.data)
}

export default function ActionsDemo() {
  // https://remix.run/api/remix#useactiondata
  let actionMessage = JSON.stringify(useActionData(), null, 2)
  let focusRef = useRef<HTMLInputElement>(null)
  const inputProps = useFormInputProps(ActionSchema)
  // This form works without JavaScript, but when we have JavaScript we can make
  // the experience better by selecting the input on wrong answers! Go ahead, disable
  // JavaScript in your browser and see what happens.
  useEffect(() => {
    if (actionMessage && focusRef.current) {
      focusRef.current.select()
    }
  }, [actionMessage])

  return (
    <div className="remix__page">
      <main>
        <h2>Actions!</h2>
        <p>
          This form submission will send a post request that we handle in our
          `action` export. Any route can export an action to handle data
          mutations.
        </p>
        <Form method="post" className="remix__form">
          <h3>Post an Action</h3>
          <label>
            <div>Name:</div>
            <input ref={focusRef} {...inputProps('name')} />
          </label>
          <label>
            <div>Age:</div>
            <input {...inputProps('age')} />
          </label>
          <label>
            <div>Should be a number:</div>
            {/* override type and required to test server validation */}
            <input {...inputProps('number')} type="text" required={false} />
          </label>
          <label>
            <div>Favorites:</div>
            <div>
              {['Remix', 'Next.js', 'React', 'Prisma', 'GraphQL', 'Fly.io'].map(
                favorite => (
                  <label className="block" key={favorite}>
                    <input
                      {...inputProps('favorites')}
                      type="checkbox" // override type from inputProps
                      required={false} // override required from inputProps
                      defaultValue={favorite}
                    />{' '}
                    {favorite}
                  </label>
                ),
              )}
            </div>
          </label>
          <label>
            <div>Accept (must be checked):</div>
            <input {...inputProps('accept')} />
          </label>
          <label>
            <div>Remember Password:</div>
            <input {...inputProps('remember')} />
          </label>
          <label>
            <div>Question:</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label>
                <input {...inputProps('answer')} type="radio" value="true" />{' '}
                Yes
              </label>
              <label>
                <input {...inputProps('answer')} type="radio" value="false" />{' '}
                No
              </label>
              <label>
                <input {...inputProps('answer')} type="radio" value="" /> Not
                answered
              </label>
            </div>
          </label>

          <div>
            <button>Submit</button>
          </div>
          {actionMessage ? <pre>{actionMessage}</pre> : null}
        </Form>
      </main>

      <aside>
        <h3>Additional Resources</h3>
        <ul>
          <li>
            Guide:{' '}
            <a href="https://remix.run/guides/data-writes">Data Writes</a>
          </li>
          <li>
            API:{' '}
            <a href="https://remix.run/api/conventions#action">
              Route Action Export
            </a>
          </li>
          <li>
            API:{' '}
            <a href="https://remix.run/api/remix#useactiondata">
              <code>useActionData</code>
            </a>
          </li>
        </ul>
      </aside>
    </div>
  )
}
