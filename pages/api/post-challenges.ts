import { getHandler, updateItemBySessionId } from '../database'
import { Did, Utils, DidResourceUri, DidUri } from '@kiltprotocol/sdk-js'
import { decrypt } from '../../utilities/verifier'

const VERIFIER_DID_URI = process.env.VERIFIER_DID_URI as DidUri

export default async function (request, response) {
  console.log('Returned session values', { body: JSON.parse(request.body) })

  try {
    const { encryptionKeyUri, encryptedChallenge, nonce, sessionId } =
      JSON.parse(request.body)
    console.log('encryptedChallenge', encryptedChallenge)
    console.log('nonce', nonce)
    console.log('sessionId', sessionId)

    const usersEncryptionKey = await Did.resolveKey(encryptionKeyUri)
    console.log('encryptionKey', usersEncryptionKey)

    if (!usersEncryptionKey) {
      throw new Error('No encryption key')
    }

    const backendFullDid = await Did.resolve(VERIFIER_DID_URI)

    if (
      !backendFullDid ||
      !backendFullDid.document ||
      !backendFullDid.document.keyAgreement
    ) {
      throw new Error('Error')
    }
    const dAppEncryptionKeyUri = `${VERIFIER_DID_URI}${backendFullDid.document.keyAgreement[0].id}`

    const { data } = await decrypt({
      data: Utils.Crypto.coToUInt8(encryptedChallenge),
      nonce: Utils.Crypto.coToUInt8(nonce),
      keyUri: dAppEncryptionKeyUri as DidResourceUri,
      peerPublicKey: usersEncryptionKey.publicKey,
    })

    console.log('data', data.toString())

    const decoded = Utils.Crypto.u8aToHex(data)

    console.log('decoded', decoded)

    const table = await getHandler(sessionId).catch()
    console.log('didChallenge', { item: table.Item })
    const didChallenge = table.Item?.DIDChallenge.S

    console.log('OUR didChallenge', { didChallenge })
    console.log('OUR decoded', { decoded })

    if (didChallenge !== decoded) {
      throw new Error('The challenge does not match')
    }

    const session = {
      didChallenge,
      sessionId,
      encryptionKeyUri,
      didConfirmed: false,
      did: usersEncryptionKey.controller,
    }
    await updateItemBySessionId(session)

    return response.send(200)
  } catch (error) {
    console.log(error)
  }
}
