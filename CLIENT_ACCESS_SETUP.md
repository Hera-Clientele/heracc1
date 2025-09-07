# Client Access Setup

This document explains the new client-specific access system that allows individual clients to access only their own data without seeing other clients.

## Overview

The system now has two types of access:

1. **Admin Access** - Full access to all clients with client selector
2. **Client Access** - Individual client access to only their own data

## How It Works

### For Individual Clients (like Katie)

1. **Login URL**: `/login` or `/client/[clientId]`
2. **Authentication**: Clients log in with their client ID and password
3. **Access**: They are redirected to `/client/[clientId]` where they can only see their own data
4. **Features**: 
   - No client selector dropdown
   - Only their data is displayed
   - Cannot access other clients' information
   - Clean, focused interface

### For Admin Users

1. **Login URL**: `/` (main page)
2. **Authentication**: Admin users log in with special admin credentials
3. **Access**: Full dashboard with client selector
4. **Features**:
   - Can switch between all clients
   - See aggregated data across clients
   - Full administrative access

## URLs

- **Main Admin Dashboard**: `/` - Requires admin authentication
- **Client Login**: `/login` - Redirects clients to their dedicated page
- **Individual Client Dashboard**: `/client/[clientId]` - Client-specific view

## Authentication Flow

### Client Authentication
1. Client visits `/login` or `/client/[clientId]`
2. Enters their client ID and password
3. System verifies credentials against the `clients` table
4. If valid, client is redirected to `/client/[clientId]`
5. Client can only see their own data

### Admin Authentication
1. Admin visits `/` (main page)
2. Enters admin credentials
3. If valid, gains access to full dashboard with client selector
4. Can view all clients' data

## Security Features

- **Client Isolation**: Clients cannot see other clients' data
- **URL Protection**: Direct access to `/client/[clientId]` requires authentication for that specific client
- **Session Management**: Authentication state is stored in localStorage
- **Automatic Redirects**: Regular clients are automatically redirected to their dedicated pages

## Example Usage

### For Katie (Client #1)
1. Katie visits `/login`
2. Enters client ID: `1` and her password
3. Gets redirected to `/client/1`
4. Sees only her TikTok, Instagram, and Facebook data
5. Cannot see other clients or switch between them

### For Admin
1. Admin visits `/`
2. Enters admin credentials
3. Gets access to full dashboard
4. Can use client selector to view any client's data
5. Can see aggregated "All Clients" view

## Database Requirements

The system uses the existing `clients` table with:
- `client_id`: Unique identifier for each client
- `password`: Client's password
- `model`: Client's name/display name

For admin access, you'll need to create an admin client in the database with:
- `client_id`: "admin" (or any special identifier)
- `password`: Admin password
- `model`: "admin"

## Benefits

1. **Privacy**: Clients can't see other clients' data
2. **Security**: Each client has isolated access
3. **User Experience**: Clean, focused interface for individual clients
4. **Administrative Control**: Admins retain full access
5. **Scalability**: Easy to add new clients without affecting existing ones

