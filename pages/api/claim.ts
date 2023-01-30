import {
  Attestation,
  Credential,
  Claim,
  Did,
  CType,
  ConfigService,
  Blockchain,
  ICType,
} from '@kiltprotocol/sdk-js'
import { randomAsNumber } from '@polkadot/util-crypto'
import storage from 'memory-cache'
import { getCookieData } from '../../utilities/auth'
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
async function claimerTable(request, response) {
  const ticketList = storage.get('ticket list')
  return response.send(ticketList)
}
async function claimData(request, response) {
  // get the user from http-only cookie
  const cookie = `token=${request.cookies.token}`
  const user = getCookieData({ name: 'token', cookie })

  // deny if not logged in
  if (!user) return response.status(401).send('unauthorized')

  const credential = JSON.parse(request.body)

  await Credential.verifyCredential(credential)
  const ticketList = storage.get('ticket list')

  if (!ticketList) {
    storage.put('ticket list', [credential])
  }

  if (ticketList.length === 0) {
    const valid = ticketList.map((val) => {
      if (val.rootHash === credential.rootHash) return val
    })
    
    if (!valid) return response.status(200).send(credential)

    storage.put('ticket list', [...ticketList, credential])

    return response.status(200)
  }

  return response.status(404).send('ticket already in the backend')
}

export default async function handler(req, res) {
  const { method = '404' } = req
  const actions = {
    GET: claimerTable,
    POST: claimData,
    404: methodNotFound,
    path: process.env.ASSET_PATH,
  }

  await actions[method](req, res)
}
