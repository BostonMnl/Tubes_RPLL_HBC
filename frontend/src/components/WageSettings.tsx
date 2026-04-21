import { useState } from 'react';
import { Card, Table, Button } from 'react-bootstrap';
import WageDetail from './WageDetail';

export default function WageSettings() {
    type Employee = {
        id: number;
        name: string;
        role: string;
    };
    const [selected, setSelected] = useState<Employee | null>(null);

    const employees = [
        { id: 1, name: 'Calvin', role: 'Frontend Dev' },
        { id: 2, name: 'Sarah', role: 'HR Manager' },
        { id: 3, name: 'John', role: 'Backend Dev' },
    ];

    if (selected) {
        return <WageDetail employee={selected} goBack={() => setSelected(null)} />;
    }


    return (
        <Card className="p-4 shadow-sm">
            <h4>Employee Wage List</h4>
            <Table striped hover className="mt-3">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp, i) => (
                        <tr key={emp.id}>
                            <td>{i + 1}</td>
                            <td>{emp.name}</td>
                            <td>{emp.role}</td>
                            <td>
                                <Button variant="primary" size="sm" onClick={() => setSelected(emp)}>
                                    Detail
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Card>
    );
}