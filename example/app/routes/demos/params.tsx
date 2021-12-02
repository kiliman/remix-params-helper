import { useCatch, Link, json, useLoaderData, Outlet } from 'remix'

export function meta() {
  return { title: 'Boundaries Demo' }
}

export default function Boundaries() {
  return (
    <div className="remix__page">
      <main>
        <Outlet />
      </main>

      <aside>
        <h2>Click these Links</h2>
        <ul>
          <li>
            <Link to=".">Start over</Link>
          </li>
          <li>
            <Link to="123">
              Param: <i>123</i>
            </Link>
          </li>
          <li>
            <Link to="456">
              Param: <i>456</i>
            </Link>
          </li>
          <li>
            <Link to="789">
              Param: <i>789</i> this will be a 404
            </Link>
          </li>
          <li>
            <Link to="999">
              Param: <i>999</i> and this will be 401 Unauthorized
            </Link>
          </li>
          <li>
            <Link to="invalid">
              Param: <i>invalid</i> and this will be 400 Bad Request because
              it's not a number
            </Link>
          </li>
          <li>
            <Link to="1337">
              Param: <i>1337</i> this will throw an error
            </Link>
          </li>
        </ul>
        <ul>
          <li>
            <Link to="query?a=1&b=x&c=true&e=123&e=456">
              Query: <i>a=1&b=x&c=true&e=123&e=456</i>
            </Link>
          </li>
          <li>
            <Link to="query?a=z&b=x&e=123&e=xyz">
              Query: <i>a=z&b=x&e=123&e=xyz</i>
            </Link>
          </li>
        </ul>
      </aside>
    </div>
  )
}
