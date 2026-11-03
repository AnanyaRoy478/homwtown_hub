import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

export default function ProtectedRoute({ children, admin = false }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname + loc.search }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
