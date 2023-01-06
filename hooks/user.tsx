import { useState, useEffect } from 'react'
import useSporran from './sporran'

let _user
export default function useUser() {
  const [user, setUser] = useState(_user)
  const { sporran, sessionObject, startSession, presentCredential } =
    useSporran()
  console.log(user)
  useEffect(() => {
    ;(async () => {
      if (!!user) return
      const result = await (
        await fetch('/api/user', {
          credentials: 'include',
        })
      ).text()

      _user = !!result ? result : null
      setUser(_user)
    })()
  }, [sessionObject, user])

  async function logout() {
    const loggedOut = (await fetch('/api/logout', { credentials: 'include' }))
      .ok
    if (!loggedOut) return
    _user = null
    setUser(null)
  }

  async function login() {
    if (!sporran) return
    if (!sessionObject) return await startSession()

    await presentCredential()

    setTimeout(async () => {
      const result = await (
        await fetch('/api/user', { credentials: 'include' })
      ).text()
      _user = !!result ? result : null
      setUser(_user)
    }, 500)
  }

  return {
    user,
    connected: !!user || !!sessionObject,
    login,
    logout,
  }
}
