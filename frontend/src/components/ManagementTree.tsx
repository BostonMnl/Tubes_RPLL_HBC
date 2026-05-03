import { useEffect, useState } from 'react';
import { Badge, Card, Spinner } from 'react-bootstrap';
import { userServices } from '../services/apiServices';

// 🔥 urutan jabatan (sama kayak backend)
const JABATAN_VALUES = ['staff', 'manager', 'supervisor'];

const jabatanIndex = (value: string): number => {
  const idx = JABATAN_VALUES.indexOf(value);
  if (idx === -1) return -1;
  return idx;
};

type User = {
  user_id: string;
  nama: string;
  email: string;
  jabatan: string;
  role: string;
  departemen: string;
  manager_id?: string | null; // 🔥 penting
};

type TreeUser = User & {
  children?: TreeUser[];
};

// 🔥 SORT TREE (biar supervisor > manager > staff)
function sortTree(node: TreeUser) {
  if (node.children && node.children.length > 0) {
    node.children.sort(
      (a, b) => jabatanIndex(b.jabatan) - jabatanIndex(a.jabatan)
    );

    node.children.forEach(child => sortTree(child));
  }
}

// 🔥 BUILD TREE BASED ON manager_id
function buildHierarchy(users: User[]): TreeUser[] {
  const map = new Map<string, TreeUser>();

  // init node
  users.forEach(u => {
    map.set(u.user_id, { ...u, children: [] });
  });

  const roots: TreeUser[] = [];

  users.forEach(u => {
    const node = map.get(u.user_id)!;

    if (u.manager_id) {
      const parent = map.get(u.manager_id);

      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node); // fallback kalau parent tidak ada
      }
    } else {
      roots.push(node); // top level
    }
  });

  // sorting
  roots.forEach(root => sortTree(root));

  return roots;
}

// 🔥 GROUP PER DEPARTEMEN + TREE
function buildTree(users: User[]): TreeUser[] {
  const grouped: Record<string, User[]> = {};

  users.forEach(user => {
    if (!grouped[user.departemen]) {
      grouped[user.departemen] = [];
    }
    grouped[user.departemen].push(user);
  });

  return Object.keys(grouped).map(dept => ({
    user_id: `dept-${dept}`,
    nama: dept,
    email: '',
    jabatan: 'department',
    role: '',
    departemen: dept,
    children: buildHierarchy(grouped[dept]),
  }));
}

export default function ManagementTree() {
  const [tree, setTree] = useState<TreeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await userServices.getAllUsers();
        const userList: User[] = response.data?.user || [];

        setTree(buildTree(userList));
      } catch (err) {
        console.error('Gagal fetch user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  function TreeNode({ node, level = 0 }: { node: TreeUser; level?: number }) {
    const isDept = node.jabatan === 'department';

    return (
      <div style={{ marginLeft: level * 30 }} className="mb-3">
        <Card
          className="shadow-sm"
          style={{
            borderRadius: 12,
            border: 'none',
            background: isDept ? '#ffe4ec' : 'white',
          }}
        >
          <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
            <div>
              <div style={{ fontWeight: 600 }}>
                {node.nama.toUpperCase()}
              </div>

              {!isDept && (
                <small style={{ color: '#888' }}>
                  {node.jabatan.toUpperCase()} • {node.departemen.toUpperCase()}
                </small>
              )}
            </div>

            {!isDept && (
              <div className="d-flex gap-2">
                <Badge bg="secondary">{node.role}</Badge>
                <Badge style={{ background: '#ff6fa5' }}>
                  {node.departemen.toUpperCase()}
                </Badge>
              </div>
            )}
          </Card.Body>
        </Card>

        {node.children && node.children.length > 0 && (
          <div className="mt-2">
            {node.children.map(child => (
              <TreeNode
                key={child.user_id}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
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