import { useRouter } from 'next/router'
import Button from '../../components/Button'
import Logo from '../../components/Logo'
import Page from '../../components/Page'
import Card from '../../components/Card'
import User from '../../components/User'
import useUser from '../../hooks/user'
import { useEffect, useState } from 'react'
import { CType, Claim, Credential } from '@kiltprotocol/sdk-js'

const ctype = CType.fromProperties('name', {
  firstName: { type: 'string' },
  secondName: { type: 'string' },
})

export default function Secret() {
  const [firstName, setFirstName] = useState('')
  const [secondName, setSecondName] = useState('')

  const { user, connected, login, logout } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.push('/')
  }, [user, router])

  const handleClaimerData = async () => {
    if (!firstName || !secondName) {
      alert('Please fill out all fields')
      throw new Error('Data is missing')
    }
    if (!user) {
      throw new Error('no User')
    }
    const claim = Claim.fromCTypeAndClaimContents(
      ctype,
      { firstName, secondName },
      user
    )
    const credential = Credential.fromClaim(claim)

    const result = await fetch(`/api/claim`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        ContentType: 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(credential),
    })

    console.log('value', result)
  }
  return (
    <Page>
      <Page.Header>
        <Logo />
        <User
          user={user}
          connected={connected}
          onClick={user ? logout : login}
        />
      </Page.Header>
      <Page.Content>
        <Card>
          <h1>Claimer Page</h1>
          <p>Claimer first name</p>
          <input
            value={firstName}
            type="text"
            onChange={(e) => setFirstName(e.target.value)}
          />
          <p>Claimer second name</p>
          <input
            value={secondName}
            type="text"
            onChange={(e) => setSecondName(e.target.value)}
          />

          <br />
          <Button onClick={handleClaimerData}>Send data</Button>
          <Button onClick={() => router.push('/')}>BACK HOME</Button>
        </Card>
      </Page.Content>
    </Page>
  )
}
