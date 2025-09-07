"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page immediately
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex items-center justify-center">
      <div className="text-white text-xl">Redirecting to login...</div>
    </div>
  );
}