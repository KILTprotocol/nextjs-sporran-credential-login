import { useRouter } from "next/router"
import Button from "../../components/Button"
import Logo from "../../components/Logo"
import Page from "../../components/Page"
import Card from "../../components/Card"
import User from "../../components/User"
import useUser from "../../hooks/user"
import { useEffect } from "react"

export default function Secret() {
  const { user, connected, login, logout } = useUser()
  const router = useRouter() 

  useEffect(() => {
    if (!user) router.push('/')
  }, [ user, router ])

  return (
    <Page>
      <Page.Header>
        <Logo />
        <User user={user} connected={connected} onClick={user ? logout : login} />
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
