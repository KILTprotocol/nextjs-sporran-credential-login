import { useState, useEffect } from 'react'
import useSporran from './sporran'

let _user
export default function useUser() {
  const [user, setUser] = useState(_user)
  const { sporran, sessionObject, startSession, presentCredential } =
    useSporran()

  useEffect(() => {
    ;(async () => {
      if (!!user) return
      const result = await (await fetch('/api/user')).text()

      _user = !!result ? result : null
      setUser(_user)
    })()
  }, [sessionObject])

  async function logout() {
    const loggedOut = (await fetch('/api/logout')).ok
    if (!loggedOut) return
    _user = null
    setUser(null)
  }

  async function login() {
    if (!sporran) return
    if (!sessionObject) return await startSession()

    await presentCredential()

    const result = await (await fetch('/api/user')).text()

    _user = !!result ? result : null
    setUser(_user)
  }

  return {
    user,
    connected: !!user || !!sessionObject,
    login,
    logout,
  }
}
