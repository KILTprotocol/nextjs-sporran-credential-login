import { useRouter } from "next/router"
import { useEffect } from "react"
import Page from "../components/Page"
import useUser from '../hooks/user'

export default function Home() {
  const { user, connected, login, logout } = useUser()
  const router = useRouter() 

  useEffect(() => {
    fetch('/api/secret', { credentials: 'include' })
    .then(console.log)
    .catch(console.log)
  }, [ user ])

  return (
    <Page>
      <h1>Home</h1>
      {user === undefined ? (
        <h3>...loading</h3>
      ) : (
        <>  
          <h3>Hi {user || 'guest'}</h3>
          <button onClick={() => router.push('/member/secret')}>Secret Page</button>
          <button onClick={() => router.push('/api/secret')}>Secret API</button>
          <button onClick={user ? logout : login}>{ user ? 'Logout' : connected ? 'Login' : 'Connect'}</button>
        </>
      )}
    </Page>
  )
}

export const getServerSideProps = (ctx) => {
  return { props: {} }
}

