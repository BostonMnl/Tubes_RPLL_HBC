import { Card, Table, Button } from 'react-bootstrap';
import { useState } from 'react';

type PageProps = {
  goBack: () => void;
};

export default function ResetPage({ goBack }: PageProps) {
  const [data, setData] = useState([
    { id: 1, name: 'Calvin', date: '2026-04-20', status: 'pending' }
  ]);

  const approve = (id: number) => {
    setData(data.map(d => d.id === id ? { ...d, status: 'approved' } : d));
  };

  const remove = (id: number) => {
    setData(data.filter(d => d.id !== id));
  };

  return (
    <Card className="p-4 shadow-sm">
      <Button onClick={goBack} className="mb-3">← Back</Button>
      <h4>Password Reset</h4>
      <Table striped>
        <thead>
          <tr><th>Name</th><th>Date</th><th>Status</th><th>Action</th></tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.date}</td>
              <td>{d.status}</td>
              <td>
                <Button size="sm" onClick={() => approve(d.id)}>Approve</Button>{' '}
                <Button size="sm" variant="primary" onClick={() => remove(d.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}