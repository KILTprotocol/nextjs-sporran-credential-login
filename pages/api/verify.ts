import {
  Utils,
  Message,
  Credential,
  IRequestCredential,
  Did,
  IEncryptedMessage,
  DidResourceUri,
} from '@kiltprotocol/sdk-js'
import storage from 'memory-cache'
import { exit, methodNotFound } from '../../utilities/helpers'
import { decrypt, DID_URI, encrypt } from '../../utilities/verifier'
import {
  requestCredentialContent,
  clearCookie,
  createJWT,
  setCookie,
} from '../../utilities/auth'

/** verifyRequest
 * verifies credential presentation, returns 200
 * if credential is attested and meets
 */
async function verifyRequest(req, res) {
  // the payload from client
  const { sessionId, message } = JSON.parse(req.body)

  const encryptedMessage = message

  // load the session, fail if null or missing challenge request
  const session = storage.get(sessionId)
  if (!session) return exit(res, 500, 'invalid session')

  const { challenge } = session
  if (!challenge) return exit(res, 500, 'invalid challenge request')

  const correctMessage: IEncryptedMessage = {
    ciphertext: encryptedMessage.ciphertext,
    receiverKeyUri: encryptedMessage.receiverKeyId as DidResourceUri,
    senderKeyUri: encryptedMessage.senderKeyId as DidResourceUri,
    nonce: encryptedMessage.nonce,
  }

  // get decrypted message
  const decryptedMessage = await Message.decrypt(correctMessage, decrypt)

  const messageBody = decryptedMessage.body

  const { type, content } = messageBody

  // fail if incorrect message type
  // if (type !== 'submit-credential') {
  //   res.statusMessage = 'unexpected message type'
  //   return res.status(500).end()
  // }

  // load the credential, check attestation and ownership
  const credential = Credential.fromClaim(content[0].request.claim)

  // fail if not attested or owner

  await Credential.verifyCredential(credential, { challenge })

  const { owner } = credential.claim

  const did = owner.includes(':light:')
    ? `did:kilt:${owner.split(':')[3]}`
    : owner

  // credential valid, business logic here...
  // set JWT session token, issue privelaged response etc..
  // here we just set verified to true for other hypothetical calls
  storage.put(sessionId, { ...session, verified: true })
  if (!did) {
    // if invalid clear httpOnly cookie & send 401
    clearCookie(res, { name: 'token' })
    return res.status(401).send('')
  }

  // if valid create JWT from DID, set httpOnly cookie, return 200 with DID
  const token = createJWT(did)
  setCookie(res, { name: 'token', data: token })

  res.status(200).send(did)

  // return success
  return res.status(200).end()
}

/** getRequest
 * creates and returns an encrypted message for
 * Sporran session to prompt credential sharing
 */
async function getRequest(req, res) {
  const { sessionId } = req.query

  // load the session
  const session = storage.get(sessionId)
  if (!session) return exit(res, 500, 'invalid session')

  // load encryptionKeyUri and the did, making sure it's confirmed
  const { did, didConfirmed, encryptionKeyId, nonce } = session

  const encryptionKey = Did.parse(encryptionKeyId)

  if (!encryptionKey) {
    return exit(res, 500, `failed resolving ${encryptionKeyId}`)
  }

  if (!did || !didConfirmed) return exit(res, 500, 'unconfirmed did')

  if (!encryptionKeyId) return exit(res, 500, 'missing encryptionKeyId')

  // set the challenge
  const challenge = Utils.UUID.generate()
  storage.put(sessionId, { ...session, challenge })

  const messageBody: IRequestCredential = {
    type: 'request-credential',
    content: { ...requestCredentialContent, challenge },
  }

  const message = Message.fromBody(messageBody, DID_URI, encryptionKey.did)

  if (!message) return exit(res, 500, 'failed to construct message')

  // encrypt the message
  const output = await Message.encrypt(
    message,
    encrypt,
    `${encryptionKey.did}${encryptionKey.fragment}` as DidResourceUri
  )

  if (!output) return exit(res, 500, `failed to encrypt message`)

  res.status(200).send(output)
}

// expose GET and POST routes
export default async function handler(req, res) {
  const { method = '404' } = req
  const actions = {
    GET: getRequest,
    POST: verifyRequest,
    404: methodNotFound,
  }

  await actions[method](req, res)
}
