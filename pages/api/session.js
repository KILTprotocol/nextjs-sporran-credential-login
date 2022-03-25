import { randomAsHex } from "@polkadot/util-crypto"
import getStorage from "../../utilities/storage";
import { decryptChallenge, getFullDid } from "../../utilities/verifier";
import { exit, getEncryptionKey, methodNotFound } from "../../utilities/helpers";

/** validateSession
 * checks that an established session is valid
 */
async function validateSession(req, res) {
  // the payload from client
  const { encryptionKeyId, encryptedChallenge, nonce, sessionId } = JSON.parse(req.body);

  // load the session, fail if null
  const storage = getStorage()
  const session = storage.get(sessionId)
  if (!session) return exit(res, 500, 'invalid session');

  // load the encryption key
  const encryptionKey = await getEncryptionKey(encryptionKeyId)
  if (!encryptionKey) return exit(res, 500, `failed resolving ${encryptionKeyId}`);

  // decrypt the message
  const decrypted = await decryptChallenge(encryptedChallenge, encryptionKey, nonce);
  if (decrypted !== session.challenge) return exit(res, 500, 'challenge mismatch');

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
  const fullDid = await getFullDid()
  const dAppEncryptionKeyId = fullDid.assembleKeyId(fullDid.encryptionKey.id);

  const session = {
    sessionId: randomAsHex(),
    challenge: randomAsHex(),
    dappName: process.env.DAPP_NAME,
    dAppEncryptionKeyId,
  };

  // store it in session
  const storage = getStorage()
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