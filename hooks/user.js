import { useState, useEffect } from 'react';
import useSporran from './sporran';

let _user
export default function useUser() {
  const [ user, setUser ] = useState(_user);
  const { sporran, session, startSession, presentCredential } = useSporran();
  const [ connected, setConnected ] = useState(!!user || !!session);
  
  useEffect(() => {
    (async () => {
      if (!!user) return
      const result = await (await fetch('/api/user')).text()
      _user = !!result ? result : null
      setUser(_user)
      setConnected(!!_user || !!session)
    })()
  }, []);

  async function logout() {
    const loggedOut = (await fetch('/api/logout')).ok
    if (!loggedOut) return
    _user = null
     setUser(null)
     setConnected(!!_user || !!session)
  }

  async function login() {
    if (!sporran) return
    if (!session) return await startSession()
    await presentCredential()
    const result = await (await fetch('/api/user')).text()
    _user = !!result ? result : null
    setUser(_user)
    setConnected(!!_user || !!session)
  }

  return {
    user, 
    connected,
    login, 
    logout,
  }
}