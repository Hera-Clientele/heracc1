"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = () => {
    // No authentication needed, just redirect to main dashboard
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f]">
      <AdminDashboard onLogout={handleLogout} />
    </div>
  );
}
