import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import type { User } from './types';
import Auth from './components/Auth/Auth';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user_data');
    
    // Check if session exists
    if (token && savedUser) {
        setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData: any, token: string) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    window.location.href = '/'; 
  };

  if (!user) {
    return (
      <div 
        className="h-screen w-full flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')` }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

        {/* Google Provider MUST wrap the Auth component */}
        <GoogleOAuthProvider clientId="577129960094-dvqmurtgvtui2s2kunj7m73togc94kll.apps.googleusercontent.com">
            <Auth onLoginSuccess={handleLoginSuccess} />
        </GoogleOAuthProvider>
      </div>
    );
  }

  // Logged in? Show the app router
  return <RouterProvider router={router} context={{ user, handleLogout }} />;
}

export default App;