import {
  naclBoxPairFromSecret,
  blake2AsU8a,
  keyFromPath,
  naclOpen,
  sr25519PairFromSeed,
  keyExtractPath,
  mnemonicToMiniSecret,
  cryptoWaitReady,
} from '@polkadot/util-crypto'
import {
  Utils,
  Did,
  KiltKeyringPair,
  NewDidEncryptionKey,
  DidUri,
  DecryptCallback,
  KiltEncryptionKeypair,
  DidDocument,
  EncryptCallback,
  connect,
} from '@kiltprotocol/sdk-js'
import { Crypto } from '@kiltprotocol/utils'
import { Keypair } from '@polkadot/util-crypto/types'

export type EncryptionKeyToolCallback = (
  didDocument: DidDocument
) => EncryptCallback

export interface Keypairs {
  authentication: KiltKeyringPair
  assertion: KiltKeyringPair
  keyAgreement: NewDidEncryptionKey & Keypair
}

export const MNEMONIC = process.env.VERIFIER_MNEMONIC
export const DID_URI = process.env.VERIFIER_DID_URI as DidUri

export async function getAccount() {
  await cryptoWaitReady()
  const signingKeyPairType = 'sr25519'
  const keyring = new Utils.Keyring({
    ss58Format: 38,
    type: signingKeyPairType,
  })
  return keyring.addFromMnemonic(MNEMONIC)
}

export async function getKeypairs(): Promise<Keypairs> {
  const account = await getAccount()
  const authentication = {
    ...account.derive('//did//0'),
    type: 'sr25519',
  } as KiltKeyringPair
  const assertion = {
    ...account.derive('//did//assertion//0'),
    type: 'sr25519',
  } as KiltKeyringPair
  const keyAgreement: NewDidEncryptionKey & Keypair = (function () {
    const secretKeyPair = sr25519PairFromSeed(mnemonicToMiniSecret(MNEMONIC))
    const { path } = keyExtractPath('//did//keyAgreement//0')
    const { secretKey } = keyFromPath(secretKeyPair, path, 'sr25519')
    return {
      ...naclBoxPairFromSecret(blake2AsU8a(secretKey)),
      type: 'x25519',
    }
  })()

  return {
    authentication,
    assertion,
    keyAgreement,
  }
}

export async function getFullDid() {
  await connect(process.env.WSS_ADDRESS)

  const fullDid = await Did.resolve(DID_URI)
  return fullDid
}

export async function decryptChallenge(
  encryptedChallenge,
  encryptionKey,
  nonce
) {
  // decrypt the challenge
  const data = Utils.Crypto.coToUInt8(encryptedChallenge)
  const nonced = Utils.Crypto.coToUInt8(nonce)
  const peerPublicKey = encryptionKey.publicKey
  const keypair = await getKeypairs()
  const decrypted = naclOpen(
    data,
    nonced,
    peerPublicKey,
    keypair.keyAgreement.secretKey
  )

  // compare hex strings, fail if mismatch
  return Utils.Crypto.u8aToHex(decrypted)
}

export function makeEncryptCallback(
  keyAgreementKey: KiltEncryptionKeypair
): EncryptionKeyToolCallback {
  return (didDocument) => {
    return async function encryptCallback({ data, peerPublicKey }) {
      const keyId = didDocument.keyAgreement?.[0].id
      if (!keyId) {
        throw new Error(`Encryption key not found in did "${didDocument.uri}"`)
      }
      const { box, nonce } = Crypto.encryptAsymmetric(
        data,
        peerPublicKey,
        keyAgreementKey.secretKey
      )
      return {
        nonce,
        data: box,
        keyUri: `${didDocument.uri}${keyId}`,
      }
    }
  }
}
export function makeDecryptCallback(
  keyAgreementKey: KiltEncryptionKeypair
): DecryptCallback {
  return async function decryptCallback({ data, nonce, peerPublicKey }) {
    const decrypted = Crypto.decryptAsymmetric(
      { box: data, nonce },
      peerPublicKey,
      keyAgreementKey.secretKey
    )
    if (decrypted === false) throw new Error('Decryption failed')
    return { data: decrypted }
  }
}
