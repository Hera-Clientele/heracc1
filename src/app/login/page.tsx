"use client";
import React from 'react';
import LoginForm from '../components/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return <LoginForm redirectToClient={true} />;
}

