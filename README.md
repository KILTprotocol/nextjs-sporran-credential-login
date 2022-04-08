## Verifier Setup

You can use the KILT Distillery CLI to quickly setup this project or generate the assets needed.

## Disclaimer
This code is not for production use. It serves as an example workflow for accepting Credentials. 

## Getting Started

First, install dependencies:

```bash
yarn install
```

Run the server

```bash
npm run dev
```

## API Authorization

API endpoints require the user to be logged in. You can ensure this by checking the http-only cookie. See `/pages/api/secret.js` as an example. 

``` javascript
export default function handler(req, res) {
  // get the user from http-only cookie
  const cookie = `token=${req.cookies.token}`
  const user = getCookieData({ name: 'token', cookie })

  // deny if not logged in
  if (!user) return res.status(401).send('unauthorized')
  
  // add more auth/business logic here if you need...
 
  res.status(200).send('"It might make sense just to get some in case it catches on." — Satoshi Nakamoto')
}
```

## Page Authorization

Pages leverage NextJS middleware to protect against unauthorized access. See `/pages/member/_middleware.js` as an example.

``` javascript
export function middleware(req) {
  // get the user from http-only cookie
  const cookie = `token=${req.cookies.token}`
  const user = getCookieData({ name: 'token', cookie })

  // deny if not logged in
  if (!user) return new NextResponse('unauthorized')
    
  // or you can redirect gracefully
  if (!user) return NextResponse.redirect('/')

  // add more auth/business logic here if you need...
    
}
```