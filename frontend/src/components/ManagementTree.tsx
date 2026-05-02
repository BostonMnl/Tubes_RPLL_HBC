import { useEffect, useState } from 'react';
import { Badge, Card } from 'react-bootstrap';
import type { User } from '../model/User';

type TreeUser = User & {
  children?: TreeUser[];
};

export function buildTree(users: User[]): TreeUser[] {
  const map = new Map<string, TreeUser>();
  users.forEach(u => map.set(u.user_id, { ...u, children: [] }));

  const roots: TreeUser[] = [];
  users.forEach(u => {
    const node = map.get(u.user_id)!;
    if (u.manager_id && map.has(u.manager_id)) {
      map.get(u.manager_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const dummyUsers: User[] = [
  {
    user_id: '1', nama: 'Budi Santoso', alamat: 'Jakarta',
    tanggal_lahir: '1980-01-01', email: 'budi@company.com',
    nomor_telepon: '0811111111', password: '123',
    jabatan: 'manager', manager_id: '', gambar: '',
    role: 'admin', departemen: 'SALES',
  },
  {
    user_id: '2', nama: 'Andi Wijaya', alamat: 'Bandung',
    tanggal_lahir: '1985-02-02', email: 'andi@company.com',
    nomor_telepon: '0822222222', password: '123',
    jabatan: 'manager', manager_id: '1', gambar: '',
    role: 'staff', departemen: 'IT',
  },
  {
    user_id: '3', nama: 'Rina Putri', alamat: 'Bandung',
    tanggal_lahir: '1995-03-03', email: 'rina@company.com',
    nomor_telepon: '0833333333', password: '123',
    jabatan: 'staff', manager_id: '2', gambar: '',
    role: 'staff', departemen: 'IT',
  },
  {
    user_id: '4', nama: 'Dedi Saputra', alamat: 'Bandung',
    tanggal_lahir: '1996-04-04', email: 'dedi@company.com',
    nomor_telepon: '0844444444', password: '123',
    jabatan: 'staff', manager_id: '2', gambar: '',
    role: 'staff', departemen: 'IT',
  },
  {
    user_id: '5', nama: 'Siti Rahma', alamat: 'Jakarta',
    tanggal_lahir: '1987-05-05', email: 'siti@company.com',
    nomor_telepon: '0855555555', password: '123',
    jabatan: 'manager', manager_id: '1', gambar: '',
    role: 'staff', departemen: 'FINANCE',
  },
  {
    user_id: '6', nama: 'Agus Salim', alamat: 'Jakarta',
    tanggal_lahir: '1994-06-06', email: 'agus@company.com',
    nomor_telepon: '0866666666', password: '123',
    jabatan: 'staff', manager_id: '5', gambar: '',
    role: 'staff', departemen: 'FINANCE',
  },
  {
    user_id: '7', nama: 'Dewi Lestari', alamat: 'Surabaya',
    tanggal_lahir: '1988-07-07', email: 'dewi@company.com',
    nomor_telepon: '0877777777', password: '123',
    jabatan: 'manager', manager_id: '1', gambar: '',
    role: 'staff', departemen: 'SALES',
  },
  {
    user_id: '8', nama: 'Rudi Hartono', alamat: 'Surabaya',
    tanggal_lahir: '1997-08-08', email: 'rudi@company.com',
    nomor_telepon: '0888888888', password: '123',
    jabatan: 'staff', manager_id: '7', gambar: '',
    role: 'staff', departemen: 'SALES',
  },
];

export default function ManagementTree() {
  const [tree, setTree] = useState<TreeUser[]>([]);

  useEffect(() => {
    setTree(buildTree(dummyUsers));
  }, []);

  function TreeNode({ node, level = 0 }: { node: TreeUser; level?: number }) {
    return (
      <div style={{ marginLeft: level * 40, position: 'relative' }} className="mb-3">

        {level > 0 && (
          <div
            style={{
              position: 'absolute',
              left: -20, top: 0, bottom: 0,
              width: 2,
              background: '#ffd1dc',
            }}
          />
        )}

        <Card className="shadow-sm" style={{ borderRadius: 14, border: 'none' }}>
          <Card.Body className="py-3 px-3 d-flex justify-content-between align-items-center">
            <div>
              <div style={{ fontWeight: 600, color: '#333' }}>{node.nama}</div>
              <small style={{ color: '#888' }}>
                {node.jabatan} • {node.departemen}
              </small>
            </div>
            <div className="d-flex gap-2">
              <Badge bg="secondary">{node.role}</Badge>
              <Badge style={{ background: '#ff6fa5' }}>{node.departemen}</Badge>
            </div>
          </Card.Body>
        </Card>

        {node.children && node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map(child => (
              <TreeNode key={child.user_id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#fff0f5', minHeight: '100vh', padding: '20px' }}>

      <Card
        className="p-4 mb-4 shadow-sm"
        style={{
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(135deg, #ff6fa5, #ff3d7f)',
          color: 'white',
        }}
      >
        <h3 className="mb-1">Management Structure</h3>
        <small>Organizational hierarchy overview</small>
      </Card>

      {tree.map(node => (
        <TreeNode key={node.user_id} node={node} />
      ))}

    </div>
  );
}