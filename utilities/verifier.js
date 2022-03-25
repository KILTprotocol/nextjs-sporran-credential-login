import { naclBoxPairFromSecret, keyExtractPath, blake2AsU8a, keyFromPath, naclOpen, naclSeal, sr25519PairFromSeed, mnemonicToMiniSecret, cryptoWaitReady } from "@polkadot/util-crypto";
import { Utils, Did, KeyRelationship, init } from "@kiltprotocol/sdk-js"

export const mnemonic = process.env.VERIFIER_MNEMONIC

export const account = (function() {
  const signingKeyPairType = 'sr25519'
  const keyring = new Utils.Keyring({
    ss58Format: 38,
    type: signingKeyPairType,
  })
  return keyring.addFromUri(mnemonic)
}())

export const keypairs = {
  authentication: account.derive('//did//0'),
  assertion: account.derive('//did//assertion//0'),
  keyAgreement: (function() {
    const secretKeyPair = sr25519PairFromSeed(mnemonicToMiniSecret(mnemonic))
    const { path } = keyExtractPath('//did//keyAgreement//0')
    const { secretKey } = keyFromPath(secretKeyPair, path, 'sr25519')
    const blake = blake2AsU8a(secretKey)
    const boxPair = naclBoxPairFromSecret(blake)
    return {
      ...boxPair,
      type: 'x25519',
    }
  }())
}

export const relationships = {
  [KeyRelationship.authentication]: keypairs.authentication,
  [KeyRelationship.assertionMethod]: keypairs.assertion,
  [KeyRelationship.keyAgreement]: keypairs.keyAgreement,
}

export async function getFullDid() {
  await cryptoWaitReady()
  await init({ address: process.env.WSS_ADDRESS })
  const { identifier } = Did.DidUtils.parseDidUri(process.env.VERIFIER_DID_URI)
  const fullDid = await Did.FullDidDetails.fromChainInfo(identifier)
  return fullDid
}

export const decryptChallenge = async (encryptedChallenge, encryptionKey, nonce) => {
  // decrypt the challenge
  const data = Utils.Crypto.coToUInt8(encryptedChallenge)
  const nonced = Utils.Crypto.coToUInt8(nonce)
  const peerPublicKey = encryptionKey.publicKey
  const decrypted = naclOpen(data, nonced, peerPublicKey, keypairs.keyAgreement.secretKey)

  // compare hex strings, fail if mismatch
  return Utils.Crypto.u8aToHex(decrypted)
}

export const encryptionKeystore = {
  async encrypt({ data, alg, peerPublicKey }) {
    const { sealed, nonce } = naclSeal( data, keypairs.keyAgreement.secretKey, peerPublicKey, )
    return { data: sealed, alg, nonce, }
  },
  async decrypt({ data, alg, nonce, peerPublicKey }) {
    const decrypted = naclOpen( data, nonce, peerPublicKey, keypairs.keyAgreement.secretKey)
    if (!decrypted) throw new Error('Failed to decrypt with given key')
    return { data: decrypted, alg, }
  },
}