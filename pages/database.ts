import storage from 'memory-cache'

type params = {
  sessionId: string
  did?: string
  encryptionKeyUri?: string
  didChallenge?: string
  didConfirmed?: boolean
}

export function addItem({
  sessionId,
  did,
  encryptionKeyUri,
  didChallenge,
  didConfirmed,
}: params) {
  // For performance reasons shouldn't be the session ID it should have a indexer for the USER
  const params = {
    TableName: 'prod-ps-kilt-authenticator-sessioninfo',
    Item: {
      DID: { S: did },
      DIDChallenge: { S: didChallenge },
      SessionId: { S: sessionId },
      EncryptionKeyUri: { S: encryptionKeyUri },
      DIDConfirmed: { BOOL: didConfirmed },
    },
  }

  console.log('params,', params)

  storage.put(sessionId, {
    Item: {
      DID: { S: did },
      DIDChallenge: { S: didChallenge },
      SessionId: { S: sessionId },
      EncryptionKeyUri: { S: encryptionKeyUri },
      DIDConfirmed: { BOOL: didConfirmed },
    },
  })
}
export async function updateItemBySessionId({
  sessionId,
  did,
  encryptionKeyUri,
  didChallenge,
  didConfirmed,
}: params) {
  // For performance reasons shouldn't be the session ID it should have a indexer for the USER
  const params = {
    TableName: 'prod-ps-kilt-authenticator-sessioninfo',
    Key: {
      SessionId: {
        S: sessionId,
      },
    },
    UpdateExpression:
      'set DID = :val1, EncryptionKeyUri = :val2, DIDChallenge = :val3, DIDConfirmed = :val4',
    ExpressionAttributeValues: {
      ':val1': { S: did },
      ':val2': { S: encryptionKeyUri },
      ':val3': { S: didChallenge },
      ':val4': { BOOL: didConfirmed },
    },
    ReturnValues: 'ALL_NEW',
  }
  console.log(sessionId, {
    Item: {
      DID: { S: did },
      DIDChallenge: { S: didChallenge },
      SessionId: { S: sessionId },
      EncryptionKeyUri: { S: encryptionKeyUri },
      DIDConfirmed: { BOOL: didConfirmed },
    },
  })
  storage.put(sessionId, {
    Item: {
      DID: { S: did },
      DIDChallenge: { S: didChallenge },
      SessionId: { S: sessionId },
      EncryptionKeyUri: { S: encryptionKeyUri },
      DIDConfirmed: { BOOL: didConfirmed },
    },
  })
}

export async function getHandler(sessionId: string) {
  return storage.get(sessionId)
}
