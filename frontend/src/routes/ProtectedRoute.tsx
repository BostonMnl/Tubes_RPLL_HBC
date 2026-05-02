import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  // Tampilkan loading spinner saat mengecek auth
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect ke login jika tidak authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}