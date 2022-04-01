import { getCookieData } from "../../utilities/auth"
import { NextResponse } from 'next/server'

export function middleware(req) {
  // format the token for the parser
  const cookie = `token=${req.cookies.token}`

  // get user
  const user = getCookieData({ name: 'token', cookie })

  if (!user) {
    // you can throw unauthorized
    return new NextResponse('unauthorized')
    
    // or you can redirect gracefully
    return NextResponse.redirect('/')
  }
}