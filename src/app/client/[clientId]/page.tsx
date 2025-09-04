"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ClientDashboard from '../../components/ClientDashboard';
import LoginForm from '../../components/LoginForm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Client {
  client_id: string;
  model?: string;
}

export default function ClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.clientId as string;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientInfo, setClientInfo] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if there's a stored session or token
        const storedClientId = localStorage.getItem('authenticatedClientId');
        const storedClientName = localStorage.getItem('authenticatedClientName');
        
        if (storedClientId) {
          // Verify the client still exists
          const { data, error } = await supabase
            .from('clients')
            .select('client_id, model')
            .eq('client_id', storedClientId)
            .single();
          
          if (error || !data) {
            // Client doesn't exist or error occurred
            localStorage.removeItem('authenticatedClientId');
            localStorage.removeItem('authenticatedClientName');
            setIsAuthenticated(false);
          } else {
            setClientInfo(data);
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [clientId]);

  const handleLogin = (authenticatedClientId: string, clientName: string) => {
    // Store authentication info
    localStorage.setItem('authenticatedClientId', authenticatedClientId);
    localStorage.setItem('authenticatedClientName', clientName);
    
    setClientInfo({ client_id: authenticatedClientId, model: clientName });
    setIsAuthenticated(true);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('authenticatedClientId');
    localStorage.removeItem('authenticatedClientName');
    setIsAuthenticated(false);
    setClientInfo(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] to-[#23272f]">
        <LoginForm onLogin={handleLogin} />
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Logout button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Logout
        </button>
      </div>
      
      <ClientDashboard 
        clientId={clientInfo?.client_id || clientId} 
        clientName={clientInfo?.model || `Client ${clientId}`}
      />
    </div>
  );
}
