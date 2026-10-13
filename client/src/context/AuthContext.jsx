import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('creatoriq_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const savedLoginRole = localStorage.getItem('creatoriq_login_role');
        if (savedLoginRole && !parsed.loginRole) {
          parsed.loginRole = savedLoginRole;
        }
        return parsed;
      }
      return null;
    } catch {
      localStorage.removeItem('creatoriq_user');
      localStorage.removeItem('creatoriq_login_role');
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem('creatoriq_token') || null);
  const [loading, setLoading] = useState(Boolean(token && !user));

  useEffect(() => {
    let ignore = false;

    if (token) {
      client.get('/api/v1/auth/me')
        .then((res) => {
          if (ignore) return;
          const savedLoginRole = localStorage.getItem('creatoriq_login_role') || res.data.role;
          const hydratedUser = {
            ...res.data,
            loginRole: savedLoginRole
          };
          setUser(hydratedUser);
          localStorage.setItem('creatoriq_user', JSON.stringify(hydratedUser));
          localStorage.setItem('creatoriq_login_role', savedLoginRole);
        })
        .catch(() => {
          if (ignore) return;
          localStorage.removeItem('creatoriq_token');
          localStorage.removeItem('creatoriq_user');
          localStorage.removeItem('creatoriq_login_role');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      localStorage.removeItem('creatoriq_user');
      localStorage.removeItem('creatoriq_login_role');
      setUser(null);
      setLoading(false);
    }

    return () => {
      ignore = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await client.post('/api/v1/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    
    // Explicitly preserve the role user logged in with
    const initialLoginRole = userData.role;
    const hydratedUser = {
      ...userData,
      loginRole: initialLoginRole
    };

    localStorage.setItem('creatoriq_token', access_token);
    localStorage.setItem('creatoriq_user', JSON.stringify(hydratedUser));
    localStorage.setItem('creatoriq_login_role', initialLoginRole);

    setToken(access_token);
    setUser(hydratedUser);
    return hydratedUser;
  };

  const register = async (email, password, fullName, role = 'Creator') => {
    const res = await client.post('/api/v1/auth/register', {
      email,
      password,
      full_name: fullName,
      role,
    });
    const { access_token, user: userData } = res.data;

    const initialLoginRole = userData.role;
    const hydratedUser = {
      ...userData,
      loginRole: initialLoginRole
    };

    localStorage.setItem('creatoriq_token', access_token);
    localStorage.setItem('creatoriq_user', JSON.stringify(hydratedUser));
    localStorage.setItem('creatoriq_login_role', initialLoginRole);

    setToken(access_token);
    setUser(hydratedUser);
    return hydratedUser;
  };

  const logout = () => {
    localStorage.removeItem('creatoriq_token');
    localStorage.removeItem('creatoriq_user');
    localStorage.removeItem('creatoriq_login_role');
    setToken(null);
    setUser(null);
  };

  // Switch the active RBAC role seamlessly for the current authenticated user session
  // without losing the user identity or their initial login role
  const switchActiveRole = async (newRole) => {
    const currentLoginRole = localStorage.getItem('creatoriq_login_role') || user?.loginRole || user?.role || 'Creator';
    
    try {
      const res = await client.post('/api/v1/auth/switch-role', { role: newRole });
      const { access_token, user: updatedUser } = res.data;
      const mergedUser = {
        ...updatedUser,
        role: newRole,
        loginRole: currentLoginRole
      };

      localStorage.setItem('creatoriq_token', access_token);
      localStorage.setItem('creatoriq_user', JSON.stringify(mergedUser));
      setToken(access_token);
      setUser(mergedUser);
      return mergedUser;
    } catch {
      // Graceful offline/local update
      const fallbackUser = {
        ...user,
        role: newRole,
        loginRole: currentLoginRole
      };
      localStorage.setItem('creatoriq_user', JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const switchRoleDemo = async (targetEmail) => {
    localStorage.removeItem('creatoriq_login_role');
    return login(targetEmail, 'password123');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      switchActiveRole,
      switchRoleDemo
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
