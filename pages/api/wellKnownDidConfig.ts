import { setDomainLinkage } from '../../utilities/auth'
import { methodNotFound } from '../../utilities/helpers'

async function domainLinkage(request, response) {
  const domainLinkage = await setDomainLinkage()
  response.status(200).send(domainLinkage)
}

export default async function handler(req, res) {
  const { method = '404' } = req
  const actions = {
    GET: domainLinkage,
    404: methodNotFound,
    path: process.env.ASSET_PATH,
  }

  await actions[method](req, res)
}

