'use client';

import { useState, useEffect } from 'react';
import { EmployeePageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, InfoRow, ProgressBar } from '@/components/ui/common';
import { useMyProfile, useUpdateMyProfile } from '@/features/ess/api';
import { formatDate } from '@/lib/utils';
import { Mail, Phone, MapPin, Calendar, Building, User, Edit2, Save, X, AlertCircle } from 'lucide-react';

// Calculate profile completeness based on filled fields
function calculateProfileCompleteness(profile: EmployeeProfileData): number {
  const fields = [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.birthDate,
    profile.gender,
    profile.address,
    profile.city,
    profile.province,
    profile.postalCode,
  ];

  const filledCount = fields.filter(Boolean).length;
  return Math.round((filledCount / fields.length) * 100);
}

// Get missing fields for profile completeness
function getMissingFields(profile: EmployeeProfileData): string[] {
  const missing: string[] = [];
  if (!profile.fullName) missing.push('Full Name');
  if (!profile.email) missing.push('Email');
  if (!profile.phone) missing.push('Phone Number');
  if (!profile.birthDate) missing.push('Date of Birth');
  if (!profile.gender) missing.push('Gender');
  if (!profile.address) missing.push('Address');
  if (!profile.city) missing.push('City');
  if (!profile.province) missing.push('Province');
  if (!profile.postalCode) missing.push('Postal Code');
  return missing;
}

// Types based on API response structure
interface EmployeeProfileData {
  id: string;
  employeeCode: string;
  fullName: string;
  preferredName?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  bloodType?: string | null;
  religion?: string | null;
  nationality?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  photoUrl?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  divisionId?: string | null;
  divisionName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  positionId?: string | null;
  positionName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  shiftId?: string | null;
  shiftName?: string | null;
  joinDate?: string | null;
  confirmationDate?: string | null;
  endDate?: string | null;
  employmentStatus: string;
  employmentType: string;
  isActive: boolean;
  profileCompleteness?: number;
  emergencyContacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    address?: string;
    isPrimary: boolean;
  }>;
}

export default function MyProfilePage() {
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  // API hooks
  const { data, isLoading, error } = useMyProfile();
  const updateProfile = useUpdateMyProfile();

  // Extract profile data from API response
  const profile = data?.data;

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && !isEditingContact) {
      setFormData({
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        city: profile.city || '',
        province: profile.province || '',
        postalCode: profile.postalCode || '',
      });
    }
  }, [profile, isEditingContact]);

  // Calculate profile completeness
  const completeness = profile ? calculateProfileCompleteness(profile) : 0;
  const missingFields = profile ? getMissingFields(profile) : [];

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        province: formData.province || undefined,
        postalCode: formData.postalCode || undefined,
      });
      setIsEditingContact(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        city: profile.city || '',
        province: profile.province || '',
        postalCode: profile.postalCode || '',
      });
    }
    setIsEditingContact(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <EmployeePageWrapper
        title="My Profile"
        subtitle="View and manage your profile information"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)]">Loading profile...</p>
          </div>
        </div>
      </EmployeePageWrapper>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <EmployeePageWrapper
        title="My Profile"
        subtitle="View and manage your profile information"
      >
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-danger)] mx-auto mb-4" />
          <p className="text-[var(--color-text-primary)] font-medium mb-2">Failed to load profile</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {error?.message || 'Please try again later'}
          </p>
        </Card>
      </EmployeePageWrapper>
    );
  }

  const fullName = profile.fullName || '';

  return (
    <EmployeePageWrapper
      title="My Profile"
      subtitle="View and manage your profile information"
    >
      {/* Profile Header */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar name={profile.fullName || ''} src={profile.photoUrl || undefined} size="xl" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{fullName}</h2>
            <p className="text-[var(--color-text-muted)]">
              {profile.positionName} &bull; {profile.departmentName}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{profile.employeeCode}</p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow icon={Building} label="Branch" value={profile.branchName} />
              <InfoRow icon={Building} label="Division" value={profile.departmentName} />
              <InfoRow icon={Calendar} label="Join Date" value={formatDate(profile.joinDate || '')} />
              {profile.shiftName && (
                <InfoRow icon={Calendar} label="Shift" value={profile.shiftName} />
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information - Editable */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Contact Information</h3>
            {!isEditingContact && (
              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => setIsEditingContact(true)}
              >
                Edit
              </Button>
            )}
          </div>

          {isEditingContact ? (
            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                  placeholder="Enter email"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-none"
                  placeholder="Enter address"
                />
              </div>

              {/* City & Province */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-muted)] mb-1">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    placeholder="Province"
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                  placeholder="Postal code"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={X}
                  onClick={handleCancel}
                  disabled={updateProfile.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  icon={Save}
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  isLoading={updateProfile.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
<InfoRow icon={Phone} label="Phone" value={profile.phone || '-'} />
              </div>
              <InfoRow icon={Mail} label="Email" value={profile.email || '-'} />
              <InfoRow icon={MapPin} label="Address" value={profile.address || '-'} />
              {(profile.city || profile.province || profile.postalCode) && (
                <InfoRow
                  icon={MapPin}
                  label="Location"
                  value={[profile.city, profile.province, profile.postalCode].filter(Boolean).join(', ') || '-'}
                />
              )}
            </div>
          )}
        </Card>

        {/* Profile Completeness */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Profile Completeness</h3>
          <ProgressBar value={completeness} label="Profile Progress" />

          {completeness < 100 && missingFields.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-[var(--color-text-muted)] mb-2">Missing fields:</p>
              <ul className="text-sm space-y-1">
                {missingFields.slice(0, 5).map((field) => (
                  <li key={field} className="text-[var(--color-warning)]">&bull; {field}</li>
                ))}
                {missingFields.length > 5 && (
                  <li className="text-[var(--color-text-muted)]">+{missingFields.length - 5} more</li>
                )}
              </ul>
              <p className="text-xs text-[var(--color-text-muted)] mt-4">
                Click Edit to update your contact information.
              </p>
            </div>
          )}

          {completeness === 100 && (
            <div className="mt-4 p-4 bg-[var(--color-success-bg)] rounded-xl text-center">
              <p className="text-[var(--color-success)] font-medium">Your profile is complete!</p>
            </div>
          )}
        </Card>

        {/* Basic Information - Read Only */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Full Name</p>
                <p className="text-sm font-medium">{profile.fullName}</p>
              </div>
              {profile.preferredName && (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Preferred Name</p>
                  <p className="text-sm font-medium">{profile.preferredName}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Employee Number</p>
                <p className="text-sm font-medium font-mono">{profile.employeeCode}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Employment Status</p>
                <p className="text-sm font-medium capitalize">{profile.employmentStatus}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Date of Birth</p>
                <p className="text-sm font-medium">
                  {profile.birthDate ? formatDate(profile.birthDate) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Gender</p>
                <p className="text-sm font-medium capitalize">{profile.gender || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Marital Status</p>
                <p className="text-sm font-medium capitalize">{profile.maritalStatus || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Blood Type</p>
                <p className="text-sm font-medium">{profile.bloodType || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Religion</p>
                <p className="text-sm font-medium">{profile.religion || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Nationality</p>
                <p className="text-sm font-medium">{profile.nationality || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Company</p>
                <p className="text-sm font-medium">{profile.branchName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Join Date</p>
                <p className="text-sm font-medium">{formatDate(profile.joinDate || '')}</p>
              </div>
            </div>

            {profile.confirmationDate && (
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Confirmation Date</p>
                <p className="text-sm font-medium">{formatDate(profile.confirmationDate)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Work Information - Read Only */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Work Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Position</p>
                <p className="text-sm font-medium">{profile.positionName}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Department</p>
                <p className="text-sm font-medium">{profile.departmentName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Branch</p>
                <p className="text-sm font-medium">{profile.branchName}</p>
              </div>
              {profile.shiftName && (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Shift</p>
                  <p className="text-sm font-medium">{profile.shiftName}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </EmployeePageWrapper>
  );
}