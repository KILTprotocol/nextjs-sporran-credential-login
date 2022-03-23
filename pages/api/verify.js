import { Utils, Message, MessageBodyType, Did, Credential } from '@kiltprotocol/sdk-js';
import { storage, encryptionKeystore, cTypes, methodNotFound, die } from "../../utils/verifier";
import encryptionKey from '../../utils/encryptionKey.json'
import { clearCookie, createJWT, setCookie } from '../../utils/auth';

/** verifyRequest
 * verifies credential presentation, returns 200
 * if credential is attested and meets
 */
async function verifyRequest(req, res) {
  // the payload from client
  const { sessionId, message: rawMessage } = JSON.parse(req.body);

  // load the session, fail if null or missing challenge request
  const session = storage.get(sessionId);
  if (!session) return die(res, 500, 'invalid session');

  const challenge = session.challenge
  if (!challenge) return die(res, 500, 'invalid challenge request');

  // get decrypted message
  const message = await Message.decrypt(rawMessage, encryptionKeystore);
  const messageBody = message.body;
  const { type, content } = messageBody;

  // fail if incorrect message type
  if (type !== 'submit-credential') {
    res.statusMessage = 'unexpected message type';
    return res.status(500).end();
  }

  // load the credential, check attestation and ownership
  const credential = Credential.fromCredential(content[0]);
  const isValid = await credential.verify({ challenge });
  const { owner } = credential.request.claim
  const did = owner.includes(':light:') ? `did:kilt:${owner.split(':')[3]}` : owner

  // fail if not attested or owner
  if (!isValid) return die(403, 'invalid credential')

  // credential valid, business logic here...
  // set JWT session token, issue privelaged response etc..
  // here we just set verified to true for other hypothetical calls
  storage.set(sessionId, { ...session, verified: true });

  if (!did) {
    // if invalid clear httpOnly cookie & send 401
    clearCookie(res, { name: 'token'})
    res.status(401).send('')
  } else {
    // if valid create JWT from DID, set httpOnly cookie, return 200 with DID
    const token = createJWT(did)
    setCookie(res, { name: 'token', data: token })
    res.status(200).send(did)
  }

  // return success
  return res.status(200).end();
}

/** getRequest
 * creates and returns an encrypted message for
 * Sporran session to prompt credential sharing
 */
async function getRequest(req, res) {
  const { sessionId } = req.query;

  // load the session
  const session = storage.get(sessionId);
  if (!session) return die(res, 500, 'invalid session');

  // load encryptionKeyId and the did, making sure it's confirmed
  const { did, didConfirmed, encryptionKeyId } = session;
  if (!did || !didConfirmed) return die(res, 500, 'unconfirmed did');
  if (!encryptionKeyId) return die(res, 500, 'missing encryptionKeyId');

  // set the challenge
  const challenge = Utils.UUID.generate();
  storage.set(sessionId, { ...session, challenge });

  // construct the message
  const content = { cTypes, challenge };
  const type = MessageBodyType.REQUEST_CREDENTIAL;
  const didUri = process.env.VERIFIER_DID_URI;
  const keyDid = encryptionKeyId.replace(/#.*$/, '');
  const message = new Message({ content, type }, didUri, keyDid);
  if (!message) return die(res, 500, 'failed to construct message');

  // load the encryption keys
  // const receiverKey = await Did.DidResolver.resolveKey(encryptionKeyId);
  // if (!receiverKey) return die(res, 500, `failed to resolve receiver key ${encryptionKeyId}`);
  
  // const dappEncryptionKey = await Did.DidResolver.resolveKey(encryptionKey.id);
  // if (!dappEncryptionKey) return die(res, 500, `failed to resolve receiver key ${encryptionKey.id}`);

  const { identifier } = Did.DidUtils.parseDidUri(didUri);
  const fullDid = await Did.FullDidDetails.fromChainInfo(identifier);
  console.log(fullDid)
  
  // encrypt the message
  const output = await message.encrypt(encryptionKey.id, fullDid, encryptionKeystore, encryptionKeyId);
  if (!output) return die(res, 500, `failed to encrypt message`);

  res.status(200).send(output);
}

// expose GET and POST routes
export default async function(req, res) {
  const { method = '404' } = req;
  const actions = {
    GET: getRequest,
    POST: verifyRequest,
    404: methodNotFound,
  };

  await actions[method](req, res);
}