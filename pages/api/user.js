import { clearCookie, setCookie, createJWT, getCookieData } from '../../utilities/auth';

export default function handler(req, res) {
  // load and parse the cookie
  const cookie = req.headers.cookie || ''

  // get the user from cookie
  const user = getCookieData({ name: 'token', cookie })

  if (!user) {
    // if null ensure cookie is cleared & 401
    clearCookie(res, { name: 'token'})
    res.status(401).send('')
  } else {
    // if user and renew reset the token
    const renew = process.env.JWT_RENEW
    if (renew) {
      const newToken = createJWT(user)
      setCookie(res, { name: 'token', data: newToken })
    }
    // send user and 200
    res.status(200).send(user)
  }
}