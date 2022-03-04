import { useRouter } from "next/router"
import { useEffect } from "react"
import Page from "../../components/Page"
import useUser from '../../hooks/user'

export default function Secret() {
  const { user, logout } = useUser()
  const router = useRouter()

  useEffect(() => {
    // you can also redirect here
    if (user === null) router.push('/')
  }, [ user ])

  return (
    <Page>
      {user ? (
        <>
          <h1>Top Secret</h1>
          <h3>Hi: {user}</h3>
          <button onClick={() => router.push('/')}>Home</button>
          <button onClick={logout}>Logout</button>
        </>
      ) : null }
    </Page>
  )
}
