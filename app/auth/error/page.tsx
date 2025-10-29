'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="max-w-md text-center">
      <h1 className="mb-4 text-2xl font-bold">Erro na Autenticação</h1>
      <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
        {error === 'Configuration' && (
          <p>Existe um problema com a configuração do servidor.</p>
        )}
        {error === 'AccessDenied' && (
          <p>Você não tem permissão para acessar esta página.</p>
        )}
        {error === 'Verification' && (
          <p>O link de verificação expirou ou já foi usado.</p>
        )}
        {!error && (
          <p>Ocorreu um erro desconhecido durante a autenticação.</p>
        )}
      </div>
      <a
        href="/"
        className="inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
      >
        Voltar para a página inicial
      </a>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando…</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  )
}