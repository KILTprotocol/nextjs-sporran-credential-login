import { getHandler } from '../database'
import {
  Did,
  IRequestCredential,
  Message,
  DidResourceUri,
  DidUri,
} from '@kiltprotocol/sdk-js'
import { encrypt } from '../../utilities/verifier'
import { requestCredentialContent } from '../../utilities/auth'

const VERIFIER_DID_URI = process.env.VERIFIER_DID_URI as DidUri

export default async function (request, response) {
  console.log('Requested Credentials', { body: request.body })
  try {
    const { sessionId } = request.query

    if (!sessionId) {
      console.log('Wrong session ID')
      throw new Error('No session ID found in query')
    }

    // load the session
    const ddb = await getHandler(sessionId)
    console.log('Hello', ddb)
    if (!ddb.Item) {
      console.log(`Wrong session id ${sessionId}`)
      throw new Error('Invalid session')
    }

    console.log(`ddb`, ddb.Item)

    const did = ddb.Item?.DID.S

    if (!did) {
      console.log('Unconfirmed Did')
      throw new Error('Invalid Unconfirmed Did')
    }

    const didChallenge = ddb.Item?.DIDChallenge.S
    if (!didChallenge) {
      console.log('Unconfirmed DID Challenge')
      throw new Error('Invalid Unconfirmed Did')
    }

    const usersEncryptionKeyUri = ddb.Item?.EncryptionKeyUri.S

    if (!usersEncryptionKeyUri) {
      throw new Error('Invalid encryptionKey')
    }

    console.log(
      `all items`,
      `${usersEncryptionKeyUri}, ${didChallenge}, ${did}`
    )

    const usersEncryptionKey = Did.parse(
      usersEncryptionKeyUri as DidResourceUri
    )

    if (!usersEncryptionKey) {
      console.log('encryptionKey')
      throw new Error('Invalid encryptionKey')
    }

    const messageBody: IRequestCredential = {
      type: 'request-credential',
      content: { ...requestCredentialContent, challenge: didChallenge },
    }

    const message = Message.fromBody(
      messageBody,
      VERIFIER_DID_URI,
      usersEncryptionKey.did
    )

    if (!message) {
      console.log('message', message)
      throw new Error('Invalid message')
    }

    // encrypt the message
    const encryptedMessage = await Message.encrypt(
      message,
      encrypt,
      `${usersEncryptionKey.did}${usersEncryptionKey.fragment}` as DidResourceUri
    )

    response.status(200).send(JSON.stringify(encryptedMessage))
  } catch (error) {
    console.log(error)
  }
}
