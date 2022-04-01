import { verify } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { init, disconnect, Did, KeyRelationship } from '@kiltprotocol/sdk-js';
import { cryptoWaitReady, randomAsHex, signatureVerify } from '@polkadot/util-crypto';
import ms from 'ms'

export const cTypes = [
  {
    name: 'peregrine email',
    cTypeHash:
      '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
  },
  {
    name: 'peregrine github',
    cTypeHash:
      '0xad52bd7a8bd8a52e03181a99d2743e00d0a5e96fdc0182626655fcf0c0a776d0',
  },
  {
    name: 'peregrine twitch',
    cTypeHash:
      '0x568ec5ffd7771c4677a5470771adcdea1ea4d6b566f060dc419ff133a0089d80',
  },
  {
    name: 'peregrine twitter',
    cTypeHash:
      '0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420',
  },
  {
    name: 'peregrine discord',
    cTypeHash:
      '0xd8c61a235204cb9e3c6acb1898d78880488846a7247d325b833243b46d923abe',
  },
]

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
  const didDocument = await Did.DidResolver.resolveDoc(didUri);
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