"use client";
import React, { useEffect, useState } from 'react';

interface ClientSelectorProps {
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
}

interface Client {
  client_id: string;
  model?: string;
}

export default function ClientSelector({ selectedClientId, onClientChange }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        } else {
          console.error('Failed to fetch clients');
          setClients([]);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-4">
          <div className="text-slate-300">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-xl p-4">
        <div className="flex items-center space-x-4">
          <label className="text-white font-medium">Client:</label>
          <select
            value={selectedClientId}
            onChange={(e) => onClientChange(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-48"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="all" className="bg-gray-800 text-white">
              All Clients
            </option>
            {clients.map((client) => (
              <option 
                key={client.client_id} 
                value={client.client_id}
                className="bg-gray-800 text-white"
              >
                {client.model || `Client ${client.client_id}`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
} 