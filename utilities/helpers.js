import { Did, init } from "@kiltprotocol/sdk-js";
import { cryptoWaitReady } from "@polkadot/util-crypto";

export const exit = (response, status, message) => {
  response.statusMessage = message;
  return response.status(status).end();
}

export async function methodNotFound(request, response) {
  response.statusMessage = `method ${method} no found`;
  response.status(400).end();
}

export async function getEncryptionKey(encryptionKeyId) {
  await cryptoWaitReady();
  await init({ address: process.env.WSS_ADDRESS });
  const encryptionKey = await Did.DidResolver.resolveKey(encryptionKeyId);
  return encryptionKey
}

export const cTypes = [
  { name: 'SocialKYC Twitter', cTypeHash: '0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420' },
  { name: 'SocialKYC Email', cTypeHash: '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac' },
];