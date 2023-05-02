import { useCatch, Link, json, useLoaderData } from 'remix'
import type { LoaderFunction, MetaFunction } from 'remix'
import { z } from 'zod'
import { getParams } from '~/utils/helper'

const ParamsSchema = z.object({
  a: z.number(),
  b: z.string(),
  c: z.boolean(),
  d: z.string().optional(),
  e: z.array(z.number()),
})
type ParamsType = z.infer<typeof ParamsSchema>

// The `$` in route filenames becomes a pattern that's parsed from the URL and
// passed to your loaders so you can look up data.
// - https://remix.run/api/conventions#loader-params

export let loader: LoaderFunction = async ({ request }) => {
  // verify params are valid (in this case id is a number)
  const url = new URL(request.url)
  const result = getParams(url.searchParams, ParamsSchema)
  if (!result.success) {
    // Sometimes your code just blows up and you never anticipated it. Remix will
    // automatically catch it and send the UI to the error boundary.
    throw new Response(JSON.stringify(result.errors, null, 2), {
      status: 400,
    })
  }
  return json(result.data)
}

export default function ParamDemo() {
  let data = useLoaderData<ParamsType>()
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}

// https://remix.run/api/conventions#catchboundary
// https://remix.run/api/remix#usecatch
// https://remix.run/api/guides/not-found
export function CatchBoundary() {
  let caught = useCatch()

  let message: React.ReactNode
  let icon: string
  let title: string
  switch (caught.status) {
    case 401:
      icon = '⛔️'
      title = 'Unauthorized'
      message = (
        <p>
          Looks like you tried to visit a page that you do not have access to.
          Maybe ask the webmaster ({caught.data.webmasterEmail}) for access.
        </p>
      )
      break
    case 404:
      icon = '🔎'
      title = 'Not Found'
      message = <p>Looks like you tried to visit a page that does not exist.</p>
      break
    default:
      icon = '💥'
      title = 'Oops!'
      message = (
        <>
          <p>There was a problem with your request!</p>
          <h3>
            {caught.status} {caught.statusText}
          </h3>
          <pre>{caught.data}</pre>
        </>
      )
      break
  }

  return (
    <>
      <h2>
        {icon} {title}
      </h2>
      {message}
      <p>
        (Isn't it cool that the user gets to stay in context and try a different
        link in the parts of the UI that didn't blow up?)
      </p>
    </>
  )
}

// https://remix.run/api/conventions#errorboundary
// https://remix.run/api/guides/not-found
export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error)
  return (
    <>
      <h2>💣 Error!</h2>
      <p>{error.message}</p>
      <p>
        (Isn't it cool that the user gets to stay in context and try a different
        link in the parts of the UI that didn't blow up?)
      </p>
    </>
  )
}

export let meta: MetaFunction = ({ data }) => {
  return {
    title: data ? `Param: ${data.param}` : 'Oops...',
  }
}
