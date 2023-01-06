import {
  DidDocument,
  KiltKeyringPair,
  SignCallback,
  SignExtrinsicCallback,
} from '@kiltprotocol/sdk-js'
export type KeyToolSignCallback = (didDocument: DidDocument) => SignCallback

export const exit = (response, status, message) => {
  response.statusMessage = message
  return response.status(status).end()
}

export async function methodNotFound(request, response, method: () => void) {
  response.statusMessage = `method ${method} no found`
  response.status(400).end()
}

export async function assertionSigner({
  assertion,
  didDocument,
}: {
  assertion: KiltKeyringPair
  didDocument: DidDocument
}): Promise<SignCallback> {
  const { assertionMethod } = didDocument
  if (!assertionMethod) throw new Error('no assertionMethod key')

  return async ({ data }) => ({
    signature: assertion.sign(data),
    keyType: assertion.type,
    keyUri: `${didDocument.uri}${assertionMethod[0].id}`,
  })
}

export async function authenticationSigner({
  authentication,
}: {
  authentication: KiltKeyringPair
}): Promise<SignExtrinsicCallback> {
  if (!authentication) throw new Error('no authentication key')

  return async ({ data }) => ({
    signature: authentication.sign(data),
    keyType: authentication.type,
  })
}
