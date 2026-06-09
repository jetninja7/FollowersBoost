'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  balance: string;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-500">No users found</p>
      </Card>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    return role === 'ADMIN' ? 'default' : 'secondary';
  };

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'success' : 'destructive';
  };

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
          <Link href={`/admin/users/${user.id}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-blue-600 hover:underline">
                    {user.email}
                  </h3>
                  <Badge variant={getRoleBadgeVariant(user.role) as any}>
                    {user.role}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(user.isActive) as any}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
                {user.name && (
                  <p className="text-sm text-gray-600 mb-2">{user.name}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">
                    Balance: ${Number(user.balance).toFixed(2)}
                  </span>
                  <span>•</span>
                  <span className="text-gray-500">
                    Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
}
