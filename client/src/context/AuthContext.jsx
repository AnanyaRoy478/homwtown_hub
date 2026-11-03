import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('hh_token'));

  useEffect(() => {
    if (!localStorage.getItem('hh_token')) return;
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('hh_token'))
      .finally(() => setLoading(false));
  }, []);

  const save = (data) => {
    localStorage.setItem('hh_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const login = async (email, password) => save((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => save((await api.post('/auth/register', payload)).data);
  const logout = () => {
    localStorage.removeItem('hh_token');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
