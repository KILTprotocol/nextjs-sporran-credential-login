import { getCookieData } from '../../utilities/auth'

export default function handler(req, res) {
  // get the user from http-only cookie
  const cookie = `token=${req.cookies.token}`
  const user = getCookieData({ name: 'token', cookie })

  // deny if not logged in
  if (!user) return res.status(401).send('unauthorized')

  // add more auth/business logic here if you need...

  res
    .status(200)
    .send(
      '"It might make sense just to get some in case it catches on." — Satoshi Nakamoto'
    )
}
