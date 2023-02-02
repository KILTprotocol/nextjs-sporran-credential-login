import { Did, DidUri } from '@kiltprotocol/sdk-js'
import { useEffect, useState } from 'react'

// const URL = `https://kilt-authenticator.prod.ps.spring-media.de/api`
let session
export default function useSporran() {
  const [waiting, setWaiting] = useState(false)
  const [message, setMessage] = useState()
  const [owner, setOwner] = useState<DidUri | string>('')

  async function getUserData(sessionObject) {
    setWaiting(true)
    if (!sessionObject) throw Error('startSession first')
    const accountAddress = '4sVF16RHiSr9v6cV1DBePnpxwgt5Mu3bo15PFks8TjH9LcHo'
    console.log('session data:', sessionObject)
    const { createDidExtrinsic, credential } =
      // @ts-ignore
      await window.kilt.sporran.getASUserData(accountAddress)
    console.log('credential', credential)
    const result = await fetch(`/api/post-registration`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        ContentType: 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        createDidExtrinsic,
        credential,
        sessionId: sessionObject.sessionId,
      }),
    })
    session = sessionObject.session

    setOwner(credential.claim.owner)
    setMessage(await result.json())
    setWaiting(false)
  }
  useEffect(() => {
    const doHandle = async () => {
      if (message) {
        await session.send(message)
      }
    }
    doHandle()
  }, [message])

  async function presentCredential(sessionObject) {
    setWaiting(true)
    if (!sessionObject) {
      throw Error('startSession first')
    }
    const { sessionId } = sessionObject
    const result = await fetch(`/api/get-credentials?sessionId=${sessionId}`, {
      method: 'GET',
    })
    const message = await result.json()
    try {
      await sessionObject.session.send(message)
    } catch (e) {
      console.log(e)
    }
    sessionObject.session.listen(async (msg) => {
      await fetch(`/api/post-credentials`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          ContentType: 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ sessionId, msg }),
      })
      await sessionObject.session.send(msg)
      setWaiting(false)
    })
  }

  async function startSession() {
    const values = await fetch(`/api/start-session`)
    console.log(values)
    if (!values) {
      console.log(values)
    }
    const {
      session: { sessionId, didChallenge },
      dappName,
      dAppEncryptionKeyUri,
    } = await values.json()
    // @ts-ignore
    const { sporran } = await window.kilt
    if (!sporran) {
      console.log('errror')
      return
    }
    const session = await sporran.startSession(
      dappName,
      dAppEncryptionKeyUri,
      didChallenge
    )
    console.log(session)
    const validChallenge = await fetch(`/api/post-challenges`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        ContentType: 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ ...session, sessionId }),
    })

    console.log(validChallenge)
    if (!validChallenge.ok) {
      console.log('bad')
    }
    setWaiting(false)
    console.log(sessionId)
    return { sessionId, session }
  }

  return {
    waiting,
    presentCredential,
    getUserData,
    startSession,
  }
}
