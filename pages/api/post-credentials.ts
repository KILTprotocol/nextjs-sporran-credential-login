import { Message, Credential } from '@kiltprotocol/sdk-js'
import { createJWT, setCookie } from '../../utilities/auth'
import { decrypt } from '../../utilities/verifier'
import { getHandler, updateItemBySessionId } from '../database'

export default async function (request, response) {
  console.log('Credentials received', { body: JSON.parse(request.body) })
  try {
    // the payload from client
    const { sessionId, message } = JSON.parse(request.body)

    const { Item } = await getHandler(sessionId)

    if (!Item) {
      console.log(`Wrong session id ${sessionId}`)
      throw new Error('Invalid session')
    }

    const usersEncryptionKeyUri = Item.EncryptionKeyUri.S
    const didChallenge = Item.DIDChallenge.S

    // get decrypted message
    const decryptedMessage = await Message.decrypt(message, decrypt)

    Message.verifyMessageBody(decryptedMessage.body)

    const { type, content } = decryptedMessage.body

    if (type !== 'submit-credential') {
      console.log('Not the correct message ')
      throw new Error('not correct message')
    }

    const credential = content[0]
    await Credential.verifyPresentation(credential)
    // load the credential, check attestation and ownership

    console.log('Not the correct message ', { credential })

    // fail if not attested or owner

    await Credential.verifyCredential(credential, {
      challenge: didChallenge,
    })

    const { owner } = credential.claim

    const did = owner.includes(':light:')
      ? `did:kilt:${owner.split(':')[3]}`
      : owner

    // credential valid, business logic here...
    // set JWT session token, issue privelaged response etc..
    // here we just set verified to true for other hypothetical calls
    const session = {
      didChallenge,
      sessionId,
      encryptionKeyUri: usersEncryptionKeyUri,
      didConfirmed: true,
      did,
    }

    await updateItemBySessionId(session)

    const token = createJWT(did)
    setCookie(response, { name: 'token', data: token })

    return response.status(200).send(did)
  } catch (error) {
    console.log(error)
  }
}
