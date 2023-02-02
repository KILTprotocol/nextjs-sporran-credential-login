import { verify } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import { serialize, parse } from 'cookie'
import {
  init,
  Did,
  IRequestCredentialContent,
  connect,
} from '@kiltprotocol/sdk-js'
import { randomAsHex, signatureVerify } from '@polkadot/util-crypto'
import ms from 'ms'
import { u8aToHex } from '@polkadot/util'
import {
  createCredential,
  getDomainLinkagePresentation,
} from './wellKnownDidConfiguration'
import { DID_URI, getFullDid, getKeypairs } from './verifier'
import { assertionSigner } from './helpers'

const domain = process.env.DOMAIN

export const requestCredentialContent: IRequestCredentialContent = {
  cTypes: [
    {
      cTypeHash:
        '0xbeb9b880abb9b1288b798642c6476023c5a0495a6402802e5d687383d7b0c1c4',
    },
  ],
}

export function setCookie(res, { name, data }) {
  // set httpOnly token cookie for future auth

  res.setHeader(
    'Set-Cookie',
    serialize(name, data, {
      httpOnly: true,

      path: '/',
      secure: true,
      domain,
      expires: new Date(new Date().getTime() + ms(process.env.JWT_EXPIRY)),
    })
  )
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
  res.setHeader(
    'Set-Cookie',
    serialize(name, 'deleted', {
      httpOnly: true,

      path: '/',
      secure: true,
      domain,
      expires: new Date(0),
    })
  )
}

export function getCookieData({ name, cookie }) {
  let data = null
  try {
    // decode the httpOnly token and set the data
    const token = parse(cookie)[name]

    const secret = process.env.JWT_SECRET

    const decoded = verify(token, secret)

    data = decoded.sub
  } catch (e) {
    data = null
  }
  return data
}

export function randomChallenge() {
  return randomAsHex(16)
}

export async function getDidFromValidSignature({ input, output }) {
  // configure KILT address from .env and connect
  await init({ address: process.env.WSS_ADDRESS })

  // resolve the client's did document
  const didUri = output.didKeyUri.split('#').shift()
  const didDocument = await Did.resolve(didUri)
  if (!didDocument) {
    throw new Error('Could not resolve DID')
  }

  // get the public auth key from did doc
  const { document } = didDocument
  const { publicKey } = document.assertionMethod[0]
  if (!publicKey) {
    throw new Error('Could not find the key')
  }

  // verify the signature
  const isValid =
    signatureVerify(input, output.signature, u8aToHex(publicKey)).isValid ===
    true

  // disconnect

  return isValid ? didUri : null
}

export async function setDomainLinkage() {
  await connect(process.env.WSS_ADDRESS)
  const { assertion } = await getKeypairs()

  const fullDid = await getFullDid()

  const domainLinkageCredential = await createCredential(
    await assertionSigner({ assertion, didDocument: fullDid.document }),
    process.env.ORIGIN,
    DID_URI
  )

  return getDomainLinkagePresentation(domainLinkageCredential)
}
