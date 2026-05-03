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

  if (!user) return <Navigate to="/" />;

  const normalize = (val?: string) => val?.toLowerCase().trim();
  const roleOk = allowRole
    ? allowRole.map(normalize).includes(normalize(user.role))
    : false;

  const jabatanOk = allowJabatan
    ? allowJabatan.map(normalize).includes(normalize(user.jabatan))
    : false;

  if (!(roleOk || jabatanOk)) {
    return <Navigate to="/" />;
  }

  return children;
}