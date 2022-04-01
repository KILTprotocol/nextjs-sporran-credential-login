import { useRouter } from "next/router"
import Button from "../../components/Button"
import Logo from "../../components/Logo"
import Page from "../../components/Page"
import Card from "../../components/Card"
import User from "../../components/User"
import useUser from "../../hooks/user"

export default function Secret() {
  const { user, login, logout } = useUser()
  const router = useRouter() 

  return (
    <Page>
      <Page.Header>
        <Logo />
        <User user={user} onClick={user ? logout : login} />
      </Page.Header>
      <Page.Content>
        <Card>
          <h1>Top Secret Page</h1>
          <Button onClick={() => router.push('/')}>BACK HOME</Button>
        </Card>
      </Page.Content>
    </Page>
  )
}
