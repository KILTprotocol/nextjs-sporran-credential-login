import { useRouter } from 'next/router'
import Button from '../../components/Button'
import Logo from '../../components/Logo'
import Page from '../../components/Page'
import Card from '../../components/Card'
import { useEffect, useState } from 'react'

export default function Secret() {
  const [itemList, setItemList] = useState()
  const [selection, setSelection] = useState()

  const router = useRouter()

  useEffect(() => {
    const getter = async () => {
      const data = await fetch('/api/claim', { credentials: 'include' })
      const response = await data.text()
      console.log(response)
      if (JSON.parse(response).length === 0) {
        console.log('no data')
      } else {
        setItemList(JSON.parse(response))
      }
    }
    getter()
  }, [])

  const handleAttestData = async () => {
    if (!itemList) return
    if (!selection) return

    const result = await fetch(`/api/attestation`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        ContentType: 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(itemList[selection]),
    })

    console.log('value', result)
  }
  return (
    <Page>
      <Page.Header>
        <Logo />
      </Page.Header>
      <Page.Content>
        <Card>
          <h1>Claimer Page</h1>

          {itemList &&
            itemList.map((val, index) => {
              return (
                <div key={index}>
                  <input
                    value={index}
                    type={'checkbox'}
                    onChange={(e) => setSelection(e.target.value)}
                  />
                  <p>
                    entry: {val.rootHash}
                    <br />
                    {val.claim.contents.firstName} <span />
                    {val.claim.contents.secondName}
                  </p>
                </div>
              )
            })}

          <br />
          <Button onClick={handleAttestData}>Send data</Button>

          <Button onClick={() => router.push('/')}>BACK HOME</Button>
        </Card>
      </Page.Content>
    </Page>
  )
}
