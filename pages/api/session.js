import { Did, init } from "@kiltprotocol/sdk-js";
import { cryptoWaitReady, randomAsHex } from "@polkadot/util-crypto"
import { storage, decryptChallenge, methodNotFound, die } from "../../utils/verifier";
import encryptionKey from '../../utils/encryptionKey.json';

/** validateSession
 * checks that an established session is valid
 */
async function validateSession(req, res) {
  await cryptoWaitReady();
  await init({ address: process.env.WSS_ADDRESS });

  // the payload from client
  const { encryptionKeyId, encryptedChallenge, nonce, sessionId } = JSON.parse(req.body);

  // load the session, fail if null
  const session = storage.get(sessionId)
  if (!session) return die(res, 500, 'invalid session');

  // load the encryption key
  const encryptionKey = await Did.DidResolver.resolveKey(encryptionKeyId);
  if (!encryptionKey) return die(res, 500, `failed resolving ${encryptionKeyId}`);

  // decrypt the message
  const decrypted = await decryptChallenge(encryptedChallenge, encryptionKey, nonce);
  if (decrypted !== session.challenge) return die(res, 500, 'challenge mismatch');

  // update the session
  storage.set(sessionId, {
    ...session,
    did: encryptionKey.controller,
    encryptionKeyId,
    didConfirmed: true,
  });

  // return success
  res.status(200).end();
}

/** returnSessionValues
 * provides client with data needed to start session
 */
async function returnSessionValues(req, res) {
  // create session data
  const session = {
    sessionId: randomAsHex(),
    challenge: randomAsHex(),
    dappName: process.env.DAPP_NAME,
    dAppEncryptionKeyId: encryptionKey.id,
  };

  // store it in session
  storage.set(session.sessionId, session);

  // return session data
  res.status(200).json(session);
}

// expose GET and POST routes
export default async function(req, res) {
  const { method = '404' } = req;
  const actions = {
    GET: returnSessionValues,
    POST: validateSession,
    404: methodNotFound,
  };

  await actions[method](req, res);
}