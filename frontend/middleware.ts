import { NextResponse } from 'next/server';

export function middleware() {
  // Client-side auth is handled by the DashboardLayout component
  // This middleware is a placeholder for future server-side auth checks
  return NextResponse.next();
}

export const config = {
  matcher: ['/(dashboard|departments|positions|employees|payroll)(.*)'],
};
