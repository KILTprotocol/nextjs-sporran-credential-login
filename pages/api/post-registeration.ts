import {
  Blockchain,
  Did,
  connect,
  Attestation,
  Credential,
  ConfigService,
  DidDocument,
  DidUri,
  Message,
  ISubmitAttestation,
  DidResourceUri,
  ICType,
} from '@kiltprotocol/sdk-js'
import { getHandler } from '../database'
import { encrypt, getAccount, getKeypairs } from '../../utilities/verifier'
import { assertionSigner } from '../../utilities/helpers'

const VERIFIER_DID_URI = process.env.VERIFIER_DID_URI as DidUri

const axelSpringerCType: ICType = {
  $id: 'kilt:ctype:0x62b0c9651c6eed6f38230d5e98e8fbd5d37d276e473c183af8c88933f09b3081',
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  properties: {
    Email: {
      type: 'string',
    },
    'First Name': {
      type: 'string',
    },
    'Last Name': {
      type: 'string',
    },
  },
  title: 'Axel Springer Login',
  type: 'object',
}

export default async function (request, response) {
  await connect('wss://peregrine.kilt.io')
  try {
    // the payload from client
    const api = ConfigService.get('api')
    const { createDidExtrinsic, credential, sessionId } = JSON.parse(
      request.body
    )

    const account = await getAccount()

    console.log('Happening Now 1', createDidExtrinsic, credential, sessionId)
    const decoded = api.createType('Call', createDidExtrinsic)
    console.log('Happening Now 0', { decoded })

    const newAccountDidCreation = api.tx(decoded)
    console.log('Happening Now 2', { newAccountDidCreation })

    const { assertion } = await getKeypairs()

    const backendDid = await Did.resolve(VERIFIER_DID_URI)
    console.log('Happening Now 3', { backendDid })

    await Credential.verifyCredential(credential)
    console.log('Happening Now 4')

    const attestedClaim = Attestation.fromCredentialAndDid(
      credential,
      backendDid?.document?.uri as DidUri
    )
    console.log('Happening Now 5', { attestedClaim })

    const tx = api.tx.attestation.add(
      attestedClaim.claimHash,
      axelSpringerCType.$id,
      null
    )

    const authorizedAttestationTx = await Did.authorizeTx(
      VERIFIER_DID_URI,
      tx,
      await assertionSigner({
        assertion,
        didDocument: backendDid?.document as DidDocument,
      }),
      account.address as `4${string}`
    )
    const { Item } = await getHandler(sessionId)

    if (!Item) {
      throw new Error('Invalid session')
    }

    const usersEncryptionKeyUri = Item.EncryptionKeyUri.S

    if (!usersEncryptionKeyUri) {
      throw new Error('No encryption key')
    }

    const usersEncryptionKey = Did.parse(
      usersEncryptionKeyUri as DidResourceUri
    )

    if (!usersEncryptionKey) {
      throw new Error('Invalid encryptionKey')
    }

    const messageBody: ISubmitAttestation = {
      type: 'submit-attestation',
      content: { attestation: attestedClaim },
    }

    const message = Message.fromBody(
      messageBody,
      VERIFIER_DID_URI,
      usersEncryptionKey.did
    )

    if (!message) {
      throw new Error('Invalid message')
    }

    // encrypt the message
    const encryptedMessage = await Message.encrypt(
      message,
      encrypt,
      `${usersEncryptionKey.did}${usersEncryptionKey.fragment}` as DidResourceUri
    )

    console.log('Happening Now 7', { authorizedAttestationTx })

    const batch = api.tx.utility.batchAll([
      newAccountDidCreation,
      authorizedAttestationTx,
    ])
    Blockchain.signAndSubmitTx(batch, account, {
      resolveOn: Blockchain.IS_IN_BLOCK,
    })
    return setTimeout(() => {
      response.status(200).send(JSON.stringify(encryptedMessage))
    }, 6000)
  } catch (error) {
    console.log(error)
  }
}
