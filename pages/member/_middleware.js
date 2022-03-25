import { getCookieData } from "../../utilities/auth"
import { NextResponse } from 'next/server'

export function middleware(req) {
  // format the token for the parser
  const cookie = `token=${req.cookies.token}`

  // get user
  const user = getCookieData({ name: 'token', cookie })

  if (!user) {
    // if user isn't logged in redirect 
    return NextResponse.redirect('/')

    // or you can throw 
    //return new NextResponse('unauthorized')
  }
}