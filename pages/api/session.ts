import { randomAsHex } from '@polkadot/util-crypto'
import storage from 'memory-cache'
import { decryptChallenge, DID_URI, getFullDid } from '../../utilities/verifier'
import { exit, methodNotFound } from '../../utilities/helpers'
import { Did, DidResourceUri, connect } from '@kiltprotocol/sdk-js'
/** validateSession
 * checks that an established session is valid
 */
async function validateSession(req, res) {
  // the payload from client
  const { encryptionKeyId, encryptedChallenge, nonce, sessionId } = JSON.parse(
    req.body
  )

  // load the session, fail if null
  const session = storage.get(sessionId)

  if (!session) return exit(res, 500, 'invalid session')

  // load the encryption key
  const encryptionKey = await Did.resolveKey(encryptionKeyId)

  if (!encryptionKey) {
    return exit(res, 500, `failed resolving ${encryptionKeyId}`)
  }

  // decrypt the message
  const decrypted = await decryptChallenge(
    encryptedChallenge,
    encryptionKey,
    nonce
  )

  if (decrypted !== session.challenge)
    return exit(res, 500, 'challenge mismatch')

  // update the session
  storage.put(sessionId, {
    ...session,
    did: encryptionKey.controller,
    encryptionKeyId,
    didConfirmed: true,
  })

  // return success
  res.status(200).end()
}

/** returnSessionValues
 * provides client with data needed to start session
 */
async function returnSessionValues(req, res) {
  await connect(process.env.WSS_ADDRESS)
  // create session data
  const fullDid = await getFullDid()

  const dAppEncryptionKeyId: DidResourceUri = `${DID_URI}${fullDid.document.keyAgreement[0].id}`

  const session = {
    sessionId: randomAsHex(),
    challenge: randomAsHex(),
    dappName: process.env.DAPP_NAME,
    dAppEncryptionKeyId,
  }

  // store it in session
  storage.put(session.sessionId, session)

  // return session data
  res.status(200).json(session)
}

// expose GET and POST routes
export default async function handler(req, res) {
  const { method = '404' } = req
  const actions = {
    GET: returnSessionValues,
    POST: validateSession,
    404: methodNotFound,
  }

  await actions[method](req, res)
}
