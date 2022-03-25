import { protectRoute } from "../../utilities/auth"

export default function handler(req, res) {
  protectRoute(req, res)
  .then(() => {
    // user logged in
    res.status(200).send('top secret message')
  }).catch(() => {
    // user not logged in
    res.status(401).send('unauthorized') 
  })
}