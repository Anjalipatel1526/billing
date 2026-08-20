import React, { createContext, useContext } from 'react';

const AuthContext = createContext<any>(null);

// Auth is disabled — provider always returns a no-auth state.
// Keeping the provider shell so existing useAuth() calls don't break.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const value = {
    user: null,
    session: null,
    loading: false,
    isAuthenticated: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

