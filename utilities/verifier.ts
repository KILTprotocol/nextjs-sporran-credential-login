import {
  naclBoxPairFromSecret,
  blake2AsU8a,
  keyFromPath,
  naclOpen,
  sr25519PairFromSeed,
  keyExtractPath,
  mnemonicToMiniSecret,
  naclSeal,
} from '@polkadot/util-crypto'
import {
  Utils,
  Did,
  KiltKeyringPair,
  NewDidEncryptionKey,
  DidUri,
  DecryptCallback,
  DidDocument,
  EncryptCallback,
  ConfigService,
  Blockchain,
  DidResourceUri,
} from '@kiltprotocol/sdk-js'
import { Crypto } from '@kiltprotocol/utils'
import { Keypair } from '@polkadot/util-crypto/types'
import { authenticationSigner } from './helpers'

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
  const api = ConfigService.get('api')
  const fullDid = await Did.resolve(DID_URI)

  const { authentication, assertion } = await getKeypairs()

  if (fullDid.document.assertionMethod === undefined) {
    const extrinsic = api.tx.did.setAttestationKey(
      Did.publicKeyToChain(assertion)
    )

    const account = await getAccount()

    const tx = await Did.authorizeTx(
      fullDid.document.uri,
      extrinsic,
      await authenticationSigner({
        authentication,
      }),
      account.address as `4${string}`
    )

    await Blockchain.signAndSubmitTx(tx, account)
  }

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

export async function encrypt({
  data,
  peerPublicKey,
}: Parameters<EncryptCallback>[0]) {
  const { keyAgreement } = await getKeypairs()
  const { document } = await getFullDid()

  const { sealed, nonce } = naclSeal(
    data,
    keyAgreement.secretKey,
    peerPublicKey
  )

  return {
    data: sealed,
    nonce,
    keyUri: `${document.uri}${document.keyAgreement[0].id}` as DidResourceUri,
  }
}

export async function decrypt({
  data,
  nonce,
  peerPublicKey,
}: Parameters<DecryptCallback>[0]) {
  const { keyAgreement } = await getKeypairs()

  const decrypted = naclOpen(data, nonce, peerPublicKey, keyAgreement.secretKey)
  if (!decrypted) {
    throw new Error('Failed to decrypt with given key')
  }

  return {
    data: decrypted,
  }
}
