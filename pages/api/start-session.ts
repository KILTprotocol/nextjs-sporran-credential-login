import { randomAsHex } from '@polkadot/util-crypto'
import { Keypair } from '@polkadot/util-crypto/types'
import { Did, DidResourceUri, connect, DidUri } from '@kiltprotocol/sdk-js'
import type { KiltKeyringPair, NewDidEncryptionKey } from '@kiltprotocol/sdk-js'
import { addItem } from '../database'

export interface Keypairs {
  authentication: KiltKeyringPair
  assertion: KiltKeyringPair
  keyAgreement: NewDidEncryptionKey & Keypair
}

const VERIFIER_DID_URI = process.env.VERIFIER_DID_URI as DidUri

export default async function (request, response) {
  await connect('wss://peregrine.kilt.io')
  try {
    const backendFullDid = await Did.resolve(VERIFIER_DID_URI)

    if (
      !backendFullDid ||
      !backendFullDid.document ||
      !backendFullDid.document.keyAgreement
    ) {
      throw new Error('No full DID key')
    }

    // dApp: decentralised application.
    // The dAppEncryptionKey is a Key held by Axel Springers backend, it is used to encrypt and decrypt message between various parties
    // The KeyAgreement is the Encryption Key. The public key of the KeyAgreement is shared between the backend to the users extenison
    const dAppEncryptionKeyUri: DidResourceUri = `${backendFullDid.document.uri}${backendFullDid.document.keyAgreement[0].id}`

    const session = {
      sessionId: randomAsHex(),
      didChallenge: randomAsHex(),
      did: ' ', // Shall we find a better solution
      encryptionKeyUri: ' ', // Shall we find a better solution
      didConfirmed: false,
    }

    const dappName = 'Axel Springer App' // This would need changing to the accurate app name
    // store in dynamodb

    addItem({ ...session })
    return response
      .status(200)
      .json({ session, dappName, dAppEncryptionKeyUri })
  } catch (error) {
    console.log(error)
  }
}
