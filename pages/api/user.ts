import {
  clearCookie,
  setCookie,
  createJWT,
  getCookieData,
} from '../../utilities/auth'
import { ConfigService, disconnect, init } from '@kiltprotocol/sdk-js'

export default async function handler(req, res) {
  await init({ address: process.env.WSS_ADDRESS })

  // load and parse the cookie
  const cookie = req.headers.cookie || ''
  // get the user from cookie
  const user = getCookieData({ name: 'token', cookie })
  console.log('this is the suer', user)
  if (!user) {
    // if null ensure cookie is cleared & 401
    clearCookie(res, { name: 'token' })
    await disconnect()

    res.status(401).send('')
  } else {
    // if user and renew reset the token
    const renew = process.env.JWT_RENEW
    if (renew) {
      const newToken = createJWT(user)
      setCookie(res, { name: 'token', data: newToken })
    }
    const api = ConfigService.get('api')

    const web3Name = await api.query.web3Names.owner(user)
    await disconnect()
    // send user and 200
    res.status(200).send(web3Name ? web3Name : user)
  }
}
