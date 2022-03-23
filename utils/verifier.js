import NodeCache from "node-cache";
import { naclBoxPairFromSecret, keyExtractPath, blake2AsU8a, keyFromPath, naclOpen, naclSeal, sr25519PairFromSeed, mnemonicToMiniSecret } from "@polkadot/util-crypto";
import { Utils } from "@kiltprotocol/sdk-js"

export const storage = new NodeCache({ 
  stdTTL: 60 * 60, 
  useClones: false 
});

export const die = (response, status, message) => {
  response.statusMessage = message;
  return response.status(status).end();
}

export const account = (() => {
  const keyring = new Utils.Keyring({ ss58Format: 38, type: 'sr25519' });
  const account = keyring.addFromUri(process.env.VERIFIER_MNEMONIC);
  return account;
})();

export const keyAgreement = (function() {
  const seedPhrase = process.env.VERIFIER_MNEMONIC;
  const secretKeyPair = sr25519PairFromSeed(mnemonicToMiniSecret(seedPhrase));
  const { path } = keyExtractPath('//did//keyAgreement//0');
  const { secretKey } = keyFromPath(secretKeyPair, path, 'sr25519');
  const blake = blake2AsU8a(secretKey);
  const boxPair = naclBoxPairFromSecret(blake);
  return {
    ...boxPair,
    type: 'x25519',
  }
}());

export const decryptChallenge = async (encryptedChallenge, encryptionKey, nonce) => {
  // decrypt the challenge
  const data = Utils.Crypto.coToUInt8(encryptedChallenge);
  const nonced = Utils.Crypto.coToUInt8(nonce);
  const peerPublicKey = encryptionKey.publicKey;
  const decrypted = naclOpen(data, nonced, peerPublicKey, keyAgreement.secretKey);

  // compare hex strings, fail if mismatch
  return Utils.Crypto.u8aToHex(decrypted);
}

export const encryptionKeystore = {
  async encrypt({ data, alg, peerPublicKey }) {
    const { sealed, nonce } = naclSeal( data, keyAgreement.secretKey, peerPublicKey, )
    return { data: sealed, alg, nonce, }
  },
  async decrypt({ data, alg, nonce, peerPublicKey }) {
    const decrypted = naclOpen( data, nonce, peerPublicKey, keyAgreement.secretKey)
    if (!decrypted) throw new Error('Failed to decrypt with given key')
    return { data: decrypted, alg, }
  },
};

export const cTypes = [
  { name: 'SocialKYC Twitter', cTypeHash: '0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420' },
  { name: 'SocialKYC Email', cTypeHash: '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac' },
];

export default async function(req, res) {
  res.status(403).send('not allowed');
};

export async function methodNotFound(req, res) {
  res.statusMessage = `method ${method} no found`;
  res.status(400).end();
};