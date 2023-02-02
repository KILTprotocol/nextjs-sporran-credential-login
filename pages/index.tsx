import { useRouter } from 'next/router'
import Button from '../components/Button'
import Logo from '../components/Logo'
import Page from '../components/Page'
import Card from '../components/Card'
import User from '../components/User'
import useSporran from '../hooks/sporran'
// import useUser from '../hooks/user'
import { useEffect } from 'react'

function getExtension() {
  ;(window as any).kilt = {}
  Object.defineProperty((window as any).kilt, 'meta', {
    value: { versions: { credentials: '3.0' } },
    enumerable: false,
  })

  window.dispatchEvent(new CustomEvent('kilt-extension#initialized'))
}

export default function Home() {
  const { getUserData, startSession, presentCredential } = useSporran()
  const router = useRouter()

  // async function testSecretApi() {
  //   const result = await fetch('/api/secret', { credentials: 'include' })
  //   const message = await result.text()
  //   alert(message)
  // }

  // async function testSecretPage() {
  //   router.push('/secret/secret')
  // }

  useEffect(() => {
    getExtension()
  })

  async function register() {
    const sessionObject = await startSession()

    const data = await getUserData(sessionObject)

    console.log(data)
  }
  async function login() {
    const sessionObject = await startSession()

    if (!sessionObject) return

    await presentCredential(sessionObject)
  }

  return (
    <Page>
      <Page.Header>
        <Logo />
        {/* <User
          user={user}
          connected={connected}
          onClick={user ? logout : login}
        /> */}
      </Page.Header>
      <Page.Content>
        <Card>
          {/* <h1>Under Maintenance</h1> */}
          <Button onClick={register}>REGISTER</Button>
          <Button onClick={login}>LOGIN</Button>
          {/* <Button onClick={logout}>CLEAR COOKIES</Button> */}
        </Card>
      </Page.Content>
    </Page>
  )
}
