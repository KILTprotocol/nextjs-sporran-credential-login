import { useRouter } from "next/router"
import Button from "../components/Button"
import Logo from "../components/Logo"
import Page from "../components/Page"
import Card from "../components/Card"
import User from "../components/User"
import useUser from "../hooks/user"

export default function Home() {
  const { user, connected, login, logout } = useUser()
  const router = useRouter() 

  async function testSecretApi() {
    const result = await fetch('/api/secret', { credentials: 'include' })
    const message = await result.text()
    alert(message)
  }

  async function testSecretPage() {
    router.push('/member/secret')
  }

  return (
    <Page>
      <Page.Header>
        <Logo />
        <User user={user} connected={connected} onClick={user ? logout : login} />
      </Page.Header>
      <Page.Content>
        <Card>
          <h1>Home Page</h1>
          <Button onClick={testSecretPage}>GO TO SECRET PAGE</Button>
          <Button onClick={testSecretApi}>GET SECRET MESSAGE</Button>
        </Card>
      </Page.Content>
    </Page>
  )
}
