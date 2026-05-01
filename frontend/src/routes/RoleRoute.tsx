import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function RoleRoute({
  children,
  allowRole,
  allowJabatan,
}: {
  children: ReactNode;
  allowRole?: string[];
  allowJabatan?: string[];
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  const roleOk = allowRole ? allowRole.includes(user.role) : false;
  const jabatanOk = allowJabatan
    ? allowJabatan.includes(user.jabatan)
    : false;

  if (!(roleOk || jabatanOk)) {
    return <Navigate to="/login" />;
  }

  return children;
}