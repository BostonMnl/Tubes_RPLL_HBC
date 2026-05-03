import { useEffect, useState } from 'react';
import { Badge, Card, Spinner } from 'react-bootstrap';
import { userServices } from '../services/apiServices';

type User = {
  user_id: string;
  nama: string;
  email: string;
  jabatan: string;
  role: string;
  departemen: string;
};

type TreeUser = User & {
  children?: TreeUser[];
};

function buildTree(users: User[]): TreeUser[] {
  const departments = Array.from(new Set(users.map(u => u.departemen)));

  return departments.map(dept => {
    const deptUsers = users.filter(u => u.departemen === dept);

    const admins = deptUsers.filter(u => u.role === 'admin');
    const supervisors = deptUsers.filter(u => u.jabatan === 'supervisor');
    const managers = deptUsers.filter(u => u.jabatan === 'manager');
    const staff = deptUsers.filter(u => u.jabatan === 'staff');

    const deptNode: TreeUser = {
      user_id: `dept-${dept}`,
      nama: dept,
      email: '',
      jabatan: 'department',
      role: '',
      departemen: dept,
      children: [],
    };

    // 🔥 helper builder
    const buildManagers = () =>
      managers.map(m => ({
        ...m,
        children: staff.map(st => ({ ...st })),
      }));

    const buildSupervisors = () =>
      supervisors.map(s => ({
        ...s,
        children: buildManagers().length > 0 ? buildManagers() : staff.map(st => ({ ...st })),
      }));

    // 🔥 ADMIN LEVEL
    if (admins.length > 0) {
      deptNode.children = admins.map(a => ({
        ...a,
        children:
          buildSupervisors().length > 0
            ? buildSupervisors()
            : buildManagers().length > 0
            ? buildManagers()
            : staff.map(st => ({ ...st })),
      }));
    }
    // 🔥 NO ADMIN → SUPERVISOR
    else if (supervisors.length > 0) {
      deptNode.children = buildSupervisors();
    }
    // 🔥 NO SUPERVISOR → MANAGER
    else if (managers.length > 0) {
      deptNode.children = buildManagers();
    }
    // 🔥 ONLY STAFF
    else {
      deptNode.children = staff.map(st => ({ ...st }));
    }

    return deptNode;
  });
}

export default function ManagementTree() {
  const [tree, setTree] = useState<TreeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await userServices.getAllUsers();
        const userList = response.data?.user || [];

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
                {node.nama}
              </div>

              {!isDept && (
                <small style={{ color: '#888' }}>
                  {node.jabatan} • {node.departemen}
                </small>
              )}
            </div>

            {!isDept && (
              <div className="d-flex gap-2">
                <Badge bg="secondary">{node.role}</Badge>
                <Badge style={{ background: '#ff6fa5' }}>
                  {node.departemen}
                </Badge>
              </div>
            )}
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