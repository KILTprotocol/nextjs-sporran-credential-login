import {
  Attestation,
  Did,
  CType,
  ConfigService,
  Blockchain,
  ICType,
} from '@kiltprotocol/sdk-js'
import storage from 'memory-cache'
import { assertionSigner, methodNotFound } from '../../utilities/helpers'
import { getAccount, getFullDid, getKeypairs } from '../../utilities/verifier'
export async function isCtypeOnChain(ctype: ICType): Promise<boolean> {
  try {
    await CType.verifyStored(ctype)
    return true
  } catch {
    return false
  }
}

const ctype = CType.fromProperties('name', {
  firstName: { type: 'string' },
  secondName: { type: 'string' },
  ticketNumber: { type: 'number' },
})

async function attestResponse(request, response) {
  const credential = JSON.parse(request.body)

  const api = ConfigService.get('api')
  const ticketList = storage.get('ticket list')

  const valid = ticketList.map((val) => {
    if (val.rootHash === credential.rootHash) return val
  })
  if (!valid) throw new Error('No credential found in the store')
  const { document } = await getFullDid()
  const { assertion } = await getKeypairs()
  const account = await getAccount()

  if (!(await isCtypeOnChain(ctype))) {
    console.log('handled')
    const ctypeCreationTx = api.tx.ctype.add(CType.toChain(ctype))

    // Sign it with the right DID key.
    const authorizedCtypeCreationTx = await Did.authorizeTx(
      document.uri,
      ctypeCreationTx,
      await assertionSigner({ assertion, didDocument: document }),
      account.address as `4${string}`
    )
    // Submit the creation tx to the KILT blockchain
    // using the KILT account specified in the creation operation.
    await Blockchain.signAndSubmitTx(authorizedCtypeCreationTx, account)
  }

  console.log('The CType creation has been skipped as on chain')

  const { cTypeHash, claimHash, delegationId } =
    Attestation.fromCredentialAndDid(credential, document.uri)

  // Write the attestation info on the chain.
  const attestationTx = api.tx.attestation.add(
    claimHash,
    cTypeHash,
    delegationId
  )

  console.log('handling the transaction')

  try {
    const authorizedAttestationTx = await Did.authorizeTx(
      document.uri,
      attestationTx,
      await assertionSigner({ assertion, didDocument: document }),
      account.address as `4${string}`
    )

    await Blockchain.signAndSubmitTx(authorizedAttestationTx, account)
  } catch (e) {
    console.log('This is an error', e)
  }
  console.log('The transaction has gone through')

  console.log('credential', credential)
  response.status(200).send(credential)
}

export default async function handler(req, res) {
  const { method = '404' } = req
  const actions = {
    POST: attestResponse,
    404: methodNotFound,
    path: process.env.ASSET_PATH,
  }

  await actions[method](req, res)
}
