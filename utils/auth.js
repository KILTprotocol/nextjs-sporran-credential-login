import { verify } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { init, disconnect, Did, KeyRelationship } from '@kiltprotocol/sdk-js';
import { cryptoWaitReady, randomAsHex, signatureVerify } from '@polkadot/util-crypto';
import ms from 'ms'

export function protectRoute(req, res) {
  return new Promise((resolve, reject) => {
    // format the token for the parser
    const cookie = `token=${req.cookies.token}`
    // get user and throw if doesn't exist
    const user = getCookieData({ name: 'token', cookie })
    if (!!user) return resolve()
    else return reject()
  })
}

export function setCookie(res, { name, data }) {
  // set httpOnly token cookie for future auth
  res.setHeader('Set-Cookie', serialize(name, data, { 
    httpOnly: true, 
    path: '/',
    secure: true,
    domain: 'localhost',
    expires: new Date((new Date().getTime() + ms(process.env.JWT_EXPIRY))) 
  }));
}

export function createJWT(subject) {
  // generate JWT auth token
  const secret = process.env.JWT_SECRET
  const expiresIn = ms(process.env.JWT_EXPIRY)
  const token = jwt.sign({ sub: subject }, secret, { expiresIn })
  return token
}

export function clearCookie(res, { name }) {
  // override the httpOnly auth token and expire it
  res.setHeader('Set-Cookie', serialize(name, 'deleted', { 
    httpOnly: true, 
    path: '/',
    secure: true,
    domain: 'localhost', 
    expires: new Date(0) 
  }));
}

export function getCookieData({ name, cookie }) {
  let data = null
  try {
    // decode the httpOnly token and set the data
    const token = parse(cookie)[name]
    const secret = process.env.JWT_SECRET
    const decoded = verify(token, secret)
    data = decoded.sub
  } catch(e) {
    data = null
  }
  return data
}

export function randomChallenge() {
  return randomAsHex(16)
}

export async function getDidFromValidSignature({ input, output }) {
  // configure KILT address from .env and connect
  await cryptoWaitReady()
  await init({ address: process.env.WSS_ADDRESS })

  // resolve the client's did document
  const didUri = output.didKeyUri.split('#').shift()
  const didDocument = await Did.DefaultResolver.resolveDoc(didUri);
  if (!didDocument) {
    throw new Error('Could not resolve DID');
  }

  // get the public auth key from did doc
  const { details } = didDocument;
  const publicKey = details.getKeys(KeyRelationship.authentication).pop();
  if (!publicKey) {
    throw new Error('Could not find the key');
  }

  // verify the signature
  const isValid =
    signatureVerify(input, output.signature, publicKey.publicKeyHex)
      .isValid === true;

  // disconnect 
  await disconnect()

  return isValid ? didUri : null
}