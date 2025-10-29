"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectNewProduct() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin-secret-xyz/produtos/novo');
  }, [router]);
  return null;
}