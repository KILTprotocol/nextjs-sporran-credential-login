import { DidResourceUri, IEncryptedMessage } from '@kiltprotocol/sdk-js'
import { useState, useEffect } from 'react'
import {
  ApiWindow,
  InjectedWindowProvider,
  PubSubSessionV1,
  PubSubSessionV2,
} from '../types/types'

export function getExtensions(): void {
  type This = typeof globalThis

  //@ts-ignore
  const apiWindow = window as Window & ApiWindow
  apiWindow.kilt = apiWindow.kilt || {}

  Object.assign(apiWindow.kilt, {
    meta: { versions: { credentials: '3.0' } },
    enumerable: false,
  })
  apiWindow.addEventListener('kilt-dapp#initialized', getExtensions)
}

export default function useSporran() {
  const [sporran, setSporran] =
    useState<InjectedWindowProvider<PubSubSessionV1 | PubSubSessionV2>>(null)
  const [sessionObject, setSessionObject] = useState<{
    sessionId: string
    session: PubSubSessionV1 | PubSubSessionV2
  }>(null)
  const [waiting, setWaiting] = useState(false)

  async function presentCredential() {
    setWaiting(true)
    if (!sessionObject) throw Error('startSession first')

    const { sessionId } = sessionObject
    const result = await fetch(`/api/verify?sessionId=${sessionId}`, {
      method: 'GET',
    })

    const message = await result.json()

    await sessionObject.session.send(message)

    await sessionObject.session.listen(async (message) => {
      await fetch('/api/verify', {
        credentials: 'include',
        method: 'POST',
        headers: {
          ContentType: 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ sessionId, message }),
      })
      await sessionObject.session.send(message)
      setWaiting(false)
    })
  }

  async function startSession() {
    setWaiting(true)
    const values = await fetch('/api/session')

    if (!values.ok) throw Error(values.statusText)

    const { sessionId, challenge, dappName, dAppEncryptionKeyUri } =
      await values.json()

    const session = await sporran.startSession(
      dappName,
      dAppEncryptionKeyUri,
      challenge
    )

    const valid = await fetch('/api/session', {
      credentials: 'include',
      method: 'POST',
      headers: {
        ContentType: 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ ...session, sessionId }),
    })

    if (!valid.ok) throw Error(valid.statusText)

    setWaiting(false)
    setSessionObject({ sessionId, session })
  }

  useEffect(() => {
    getExtensions()
    const apiWindow = window as Window & ApiWindow

    setSporran(apiWindow.kilt.sporran)
  })

  return {
    sporran,
    sessionObject,
    waiting,
    startSession,
    presentCredential,
  }
}
