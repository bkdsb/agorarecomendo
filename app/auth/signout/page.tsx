'use client'

import { signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function SignOut() {
  useEffect(() => {
    signOut({ callbackUrl: '/' })
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Saindo...</h1>
        <p>Você será redirecionado em alguns instantes.</p>
      </div>
    </div>
  )
}