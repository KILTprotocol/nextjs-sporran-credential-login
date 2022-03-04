import { useState, useEffect } from 'react';

export default function useSporran () {
  const [ sporran, setSporran ] = useState(null);
  const [ session, setSession ] = useState(null);
  const [ waiting, setWaiting ] = useState(false);

  async function presentCredential() {
    setWaiting(true);
    if (!session) throw Error('startSession first');

    const { sessionId } = session;
    const result = await fetch(`/api/verify?sessionId=${sessionId}`);
    const message = await result.json();

    session.listen(async message => {
      const result = await fetch('/api/verify', {
        method: 'POST',
        headers: { ContentType: 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });

      setWaiting(false);
    });
  
    await session.send(message);
  }

  async function startSession() {
    setWaiting(true);

    const values = await fetch('/api/session');
    if (!values.ok) throw Error(values.statusText);

    const {
      sessionId,
      challenge,
      dappName,
      dAppEncryptionKeyId,
    } = await values.json();

    const session = await sporran.startSession(dappName, dAppEncryptionKeyId, challenge);
    
    const valid = await fetch('/api/session', { 
      method: 'POST', 
      headers: { ContentType: 'application/json' },
      body: JSON.stringify({ ...session, sessionId }),
    });

    if (!valid.ok) throw Error(valid.statusText);

    setWaiting(false);
    setSession({ sessionId, ...session });
  }

  useEffect(() => {
    const inState = !!sporran;
    const inWindow = window.kilt && window.kilt.sporran;
    if (!inState && inWindow) {
      setSporran(window.kilt.sporran);
    }
    
    if (!inState) {
      window.kilt = new Proxy({}, { 
        set(target, prop, value) {
          if (prop === 'sporran') {
            setSporran(value);
          }
          return !!(target[prop] = value);
        } 
      })
    }
  });

  return { 
    sporran, 
    session, 
    waiting, 
    startSession, 
    presentCredential,
  }
}