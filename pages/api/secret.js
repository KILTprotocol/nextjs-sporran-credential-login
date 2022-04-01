import { protectRoute } from "../../utilities/auth"

export default function handler(req, res) {
  protectRoute(req, res)
  .then(() => {
    // user logged in
    res.status(200).send('"It might make sense just to get some in case it catches on." — Satoshi Nakamoto')
  }).catch(() => {
    // user not logged in
    res.status(401).send('unauthorized') 
  })
}