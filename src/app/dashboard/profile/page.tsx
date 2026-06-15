'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Mail, Calendar, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (session?.user) {
      const userProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role,
        emailVerified: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(userProfile);
      setFormData({
        name: userProfile.name,
        email: userProfile.email,
      });
      setLoading(false);
    }
  }, [session]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
      });
    }
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();

      setProfile(data.data);
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.data.name,
          email: data.data.email,
        },
      });

      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'MODERATOR':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <p className="text-gray-600">Unable to load profile</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Profile
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account information
        </p>
      </div>

      {/* Profile Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account Information</CardTitle>
          {!editing ? (
            <Button onClick={handleEdit} variant="outline">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="size-4 text-gray-500" />
              Name
            </Label>
            {editing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            ) : (
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {profile.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="size-4 text-gray-500" />
              Email
            </Label>
            {editing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {profile.email}
                </p>
                {profile.emailVerified ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="size-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <XCircle className="size-3" />
                    Unverified
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Role Badge */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="size-4 text-gray-500" />
              Role
            </Label>
            <div>
              <Badge variant={getRoleBadgeVariant(profile.role)}>
                {profile.role}
              </Badge>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <Label>Account Status</Label>
            <div>
              <Badge variant={profile.isActive ? 'default' : 'destructive'}>
                {profile.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Member Since */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="size-4 text-gray-500" />
              Member Since
            </Label>
            <p className="text-gray-900 dark:text-gray-100">
              {formatDate(profile.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex items-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">••••••••</p>
              <Button variant="outline" size="sm" disabled>
                Change Password
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Password management coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
