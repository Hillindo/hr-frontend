'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TabPanel } from '@/components/ui/common';
import { useToastSimple } from '@/components/ui/toast-provider';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  Briefcase,
  MapPin,
  Phone,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { useBranchesQuery } from '@/features/master-data/branches/branches.hooks';
import { useDivisionsQuery } from '@/features/master-data/divisions/divisions.hooks';
import { useDepartmentsQuery } from '@/features/master-data/departments/departments.hooks';
import { usePositionsQuery } from '@/features/master-data/positions/positions.hooks';
import { useCreateEmployee, useEmployeeList } from '@/features/admin/hooks/useAdmin';
import { HttpError } from '@/lib/api/http';

interface FormData {
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
  nik: string;
  npwp: string;
  branchId: string;
  divisionId: string;
  departmentId: string;
  positionId: string;
  managerId: string;
  employmentType: string;
  employmentStatus: string;
  joinDate: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  nationality: string;
  religion: string;
  bloodType: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

const initialFormData: FormData = {
  fullName: '',
  preferredName: '',
  email: '',
  phone: '',
  gender: '',
  birthDate: '',
  nik: '',
  npwp: '',
  branchId: '',
  divisionId: '',
  departmentId: '',
  positionId: '',
  managerId: '',
  employmentType: '',
  employmentStatus: 'PROBATION',
  joinDate: new Date().toISOString().split('T')[0],
  address: '',
  city: '',
  province: '',
  postalCode: '',
  nationality: 'Indonesia',
  religion: '',
  bloodType: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
};

interface FormErrors {
  [key: string]: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const toast = useToastSimple();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const branchesQuery = useBranchesQuery({ pageSize: 100 });
  const divisionsQuery = useDivisionsQuery({ pageSize: 100 });
  const departmentsQuery = useDepartmentsQuery({ pageSize: 100 });
  const positionsQuery = usePositionsQuery({ pageSize: 100 });
  const managersQuery = useEmployeeList({ pageSize: 100, isActive: 'true' });
  const createEmployeeMutation = useCreateEmployee();

  const branches = branchesQuery.data?.data ?? [];
  const divisions = divisionsQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];
  const positions = positionsQuery.data?.data ?? [];
  const managers = managersQuery.data?.data ?? [];
  const selectedBranch = branches.find((branch) => branch.id === formData.branchId);
  const filteredDivisions = selectedBranch
    ? divisions.filter((division) => division.companyId === selectedBranch.companyId)
    : divisions;
  const filteredDepartments = formData.divisionId
    ? departments.filter((department) => department.divisionId === formData.divisionId)
    : departments;

  const masterDataLoading = branchesQuery.isLoading || divisionsQuery.isLoading || departmentsQuery.isLoading || positionsQuery.isLoading;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: MapPin },
    { id: 'emergency', label: 'Emergency', icon: Phone },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((current) => {
      if (field === 'branchId') {
        const nextBranch = branches.find((branch) => branch.id === value);
        const nextDivisionStillValid = current.divisionId
          ? divisions.some(
              (division) =>
                division.id === current.divisionId && division.companyId === nextBranch?.companyId,
            )
          : true;

        return {
          ...current,
          branchId: value,
          divisionId: nextDivisionStillValid ? current.divisionId : '',
          departmentId: nextDivisionStillValid ? current.departmentId : '',
        };
      }

      if (field === 'divisionId') {
        return {
          ...current,
          divisionId: value,
          departmentId:
            current.departmentId &&
            departments.some(
              (department) =>
                department.id === current.departmentId && department.divisionId === value,
            )
              ? current.departmentId
              : '',
        };
      }

      return { ...current, [field]: value };
    });

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateStep = (step: string): boolean => {
    const newErrors: FormErrors = {};

    if (step === 'basic') {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    }

    if (step === 'employment') {
      if (!formData.branchId) newErrors.branchId = 'Branch is required';
      if (!formData.divisionId) newErrors.divisionId = 'Division is required';
      if (!formData.departmentId) newErrors.departmentId = 'Department is required';
      if (!formData.positionId) newErrors.positionId = 'Position is required';
      if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
      if (!formData.joinDate) newErrors.joinDate = 'Join date is required';
    }

    if (step === 'emergency') {
      const hasName = formData.emergencyContactName?.trim();
      const hasPhone = formData.emergencyContactPhone?.trim();
      if (hasName && !hasPhone) newErrors.emergencyContactPhone = 'Phone number is required when contact name is provided';
      if (hasPhone && !hasName) newErrors.emergencyContactName = 'Contact name is required when phone number is provided';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeTab)) {
      const tabOrder = ['basic', 'employment', 'contact', 'emergency'];
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
      }
    }
  };

  const handleBack = () => {
    const tabOrder = ['basic', 'employment', 'contact', 'emergency'];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.info('Draft save is not implemented', 'This form currently submits directly to the employee API.');
  };

  const handleSubmit = async () => {
    const basicValid = validateStep('basic');
    const employmentValid = validateStep('employment');
    const emergencyValid = validateStep('emergency');

    if (!basicValid || !employmentValid || !emergencyValid) {
      if (!basicValid) setActiveTab('basic');
      else if (!employmentValid) setActiveTab('employment');
      else if (!emergencyValid) setActiveTab('emergency');
      return;
    }

    try {
      const response = await createEmployeeMutation.mutateAsync({
        fullName: formData.fullName,
        preferredName: formData.preferredName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        birthDate: formData.birthDate || undefined,
        nik: formData.nik || undefined,
        npwp: formData.npwp || undefined,
        branchId: formData.branchId,
        divisionId: formData.divisionId,
        departmentId: formData.departmentId,
        positionId: formData.positionId,
        managerId: formData.managerId || undefined,
        employmentType: formData.employmentType,
        employmentStatus: formData.employmentStatus || undefined,
        joinDate: formData.joinDate,
        address: formData.address || undefined,
        city: formData.city || undefined,
        province: formData.province || undefined,
        postalCode: formData.postalCode || undefined,
        nationality: formData.nationality || undefined,
        religion: formData.religion || undefined,
        bloodType: formData.bloodType || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
      });

      toast.success('Employee created', `${formData.fullName} has been added successfully.`);
      const createdEmployeeId = response.data?.id;
      router.push(createdEmployeeId ? `/employees/${createdEmployeeId}?tab=documents` : '/employees');
    } catch (error) {
      const description =
        error instanceof HttpError
          ? error.message
          : 'The employee could not be created. Please review the form and try again.';

      toast.error('Failed to create employee', description);
    }
  };

  const tabOrder = ['basic', 'employment', 'contact', 'emergency'];
  const currentTabIndex = tabOrder.indexOf(activeTab);

  if (masterDataLoading) {
    return (
      <PageWrapper title="Add Employee" subtitle="Create a new employee record for PT Hillga Indonesia">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
          <span className="ml-3 text-[var(--color-text-muted)]">Loading form data...</span>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Add Employee"
      subtitle="Create a new employee record for PT Hillga Indonesia"
    >
      <button
        onClick={() => router.push('/employees')}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </button>

      {/* Form Progress */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCompleted = currentTabIndex > index;

            return (
              <div key={tab.id} className="flex items-center gap-2">
                {index > 0 && (
                  <div className={`w-12 h-0.5 ${isCompleted ? 'bg-[var(--color-accent)]' : 'bg-gray-200'}`} />
                )}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                      : isCompleted
                      ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                      : 'bg-gray-50 text-[var(--color-text-muted)] hover:bg-gray-100'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Section 1 - Basic Information */}
            <TabPanel isActive={activeTab === 'basic'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Basic Information</h3>
              <div className="space-y-4">
                {/* Employee Code Display */}
                <div className="p-4 bg-[var(--color-bg)] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Employee Code</p>
                      <p className="text-lg font-mono font-semibold text-[var(--color-text-primary)]">
                        Assigned after submit
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-[var(--color-text-muted)]">
                      Generated by backend
                    </span>
                  </div>
                </div>

                {/* Full Name - Required */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Full Name <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter full name as per ID"
                    className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
                      errors.fullName ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Preferred Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Preferred Name
                  </label>
                  <input
                    type="text"
                    value={formData.preferredName}
                    onChange={(e) => handleInputChange('preferredName', e.target.value)}
                    placeholder="e.g., Adi (optional)"
                    className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Email <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="name@company.com"
                      className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
                        errors.email ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                    />
                  </div>
                </div>

                {/* Gender and Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                    />
                  </div>
                </div>

                {/* NIK and NPWP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* NIK */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      NIK (National ID)
                    </label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => handleInputChange('nik', e.target.value)}
                      placeholder="16-digit NIK"
                      maxLength={16}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 font-mono"
                    />
                  </div>

                  {/* NPWP */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      NPWP (Tax Number)
                    </label>
                    <input
                      type="text"
                      value={formData.npwp}
                      onChange={(e) => handleInputChange('npwp', e.target.value)}
                      placeholder="00.000.000.0-000.000"
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 font-mono"
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={() => router.push('/employees')}>
                    Cancel
                  </Button>
                  <Button onClick={handleNext} icon={ArrowRight} iconPosition="right">
                    Next
                  </Button>
                </div>
              </div>
            </TabPanel>

            {/* Section 2 - Employment Info */}
            <TabPanel isActive={activeTab === 'employment'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Employment Information</h3>
              <div className="space-y-4">
                {/* Branch and Division */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Branch - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Branch <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => handleInputChange('branchId', e.target.value)}
                      className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white ${
                        errors.branchId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                      }`}
                    >
                      <option value="">Select branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    {errors.branchId && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.branchId}
                      </p>
                    )}
                  </div>

                  {/* Division - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Division <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <select
                      value={formData.divisionId}
                      onChange={(e) => handleInputChange('divisionId', e.target.value)}
                      className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white ${
                        errors.divisionId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                      }`}
                    >
                      <option value="">Select division</option>
                      {filteredDivisions.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {errors.divisionId && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.divisionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Department and Position */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Department <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => handleInputChange('departmentId', e.target.value)}
                      className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white ${
                        errors.departmentId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                      }`}
                    >
                      <option value="">Select department</option>
                      {filteredDepartments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.departmentId}
                      </p>
                    )}
                  </div>

                  {/* Position - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Position <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <select
                      value={formData.positionId}
                      onChange={(e) => handleInputChange('positionId', e.target.value)}
                      className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white ${
                        errors.positionId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                      }`}
                    >
                      <option value="">Select position</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {errors.positionId && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.positionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Manager */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => handleInputChange('managerId', e.target.value)}
                    className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white"
                  >
                    <option value="">Select manager (optional)</option>
                    {managers.map((e) => (
                      <option key={e.id} value={e.id}>{e.fullName} - {e.positionName}</option>
                    ))}
                  </select>
                </div>

                {/* Employment Type and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Employment Type - Required */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Employment Type <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => handleInputChange('employmentType', e.target.value)}
                      className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white ${
                        errors.employmentType ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                      }`}
                    >
                      <option value="">Select type</option>
                      <option value="PERMANENT">Full-time / Permanent</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="INTERN">Intern</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                    {errors.employmentType && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.employmentType}
                      </p>
                    )}
                  </div>

                  {/* Employment Status */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Employment Status
                    </label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white"
                    >
                      <option value="PROBATION">On Probation</option>
                      <option value="ACTIVE">Active</option>
                    </select>
                  </div>
                </div>

                {/* Join Date - Required */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Join Date <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
                      errors.joinDate ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                  />
                  {errors.joinDate && (
                    <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.joinDate}
                    </p>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={handleBack} icon={ArrowLeft}>
                    Back
                  </Button>
                  <Button onClick={handleNext} icon={ArrowRight} iconPosition="right">
                    Next
                  </Button>
                </div>
              </div>
            </TabPanel>

            {/* Section 3 - Contact & Address */}
            <TabPanel isActive={activeTab === 'contact'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Contact & Address</h3>
              <div className="space-y-4">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address, building, unit number..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 resize-none"
                  />
                </div>

                {/* City and Province */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City name"
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                    />
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Province
                    </label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      placeholder="Province name"
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                    />
                  </div>
                </div>

                {/* Postal Code and Nationality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="5-digit postal code"
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                    />
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2"
                    />
                  </div>
                </div>

                {/* Religion and Blood Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Religion */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Religion
                    </label>
                    <select
                      value={formData.religion}
                      onChange={(e) => handleInputChange('religion', e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white"
                    >
                      <option value="">Select religion</option>
                      <option value="Islam">Islam</option>
                      <option value="Christian">Christian</option>
                      <option value="Catholic">Catholic</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Blood Type */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Blood Type
                    </label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) => handleInputChange('bloodType', e.target.value)}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={handleBack} icon={ArrowLeft}>
                    Back
                  </Button>
                  <Button onClick={handleNext} icon={ArrowRight} iconPosition="right">
                    Next
                  </Button>
                </div>
              </div>
            </TabPanel>

            {/* Section 4 - Emergency Contact */}
            <TabPanel isActive={activeTab === 'emergency'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Emergency Contact</h3>
              <div className="space-y-4">
                {/* Contact Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    placeholder="Emergency contact person's name"
                    className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
                      errors.emergencyContactName ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                  />
                  {errors.emergencyContactName && (
                    <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.emergencyContactName}
                    </p>
                  )}
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Relationship
                  </label>
                  <select
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                    className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white"
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className={`w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${
                      errors.emergencyContactPhone ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
                    }`}
                  />
                  {errors.emergencyContactPhone && (
                    <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.emergencyContactPhone}
                    </p>
                  )}
                </div>

                {/* Info Note */}
                <div className="p-4 bg-[var(--color-info-bg)] rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--color-info)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-info)]">Important</p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Emergency contact will be used in case of workplace emergencies or medical situations. If you provide a contact name, you must also provide a phone number (and vice versa).
                    </p>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={handleBack} icon={ArrowLeft}>
                    Back
                  </Button>
                  <Button variant="secondary" onClick={handleSaveDraft} icon={Save} isLoading={isSaving}>
                    Save as Draft
                  </Button>
                  <Button onClick={handleSubmit} icon={Check} isLoading={createEmployeeMutation.isPending}>
                    Submit
                  </Button>
                </div>
              </div>
            </TabPanel>
          </Card>
        </div>

        {/* Sidebar - Form Summary */}
        <div>
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Form Summary</h3>

            <div className="space-y-4">
              {/* Section Status */}
              {[
                { name: 'Basic Information', tab: 'basic', required: ['fullName', 'email'] },
                { name: 'Employment Info', tab: 'employment', required: ['branchId', 'divisionId', 'departmentId', 'positionId', 'employmentType', 'joinDate'] },
                { name: 'Contact & Address', tab: 'contact', required: [] },
                { name: 'Emergency Contact', tab: 'emergency', required: [] },
              ].map((section) => {
                const isActive = activeTab === section.tab;
                const isCompleted = currentTabIndex > tabOrder.indexOf(section.tab);

                return (
                  <div key={section.tab} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted || isActive
                        ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                        : 'bg-gray-100 text-[var(--color-text-muted)]'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-medium">{tabOrder.indexOf(section.tab) + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                        {section.name}
                      </p>
                      {section.required.length > 0 && (
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {section.required.filter(f => formData[f as keyof FormData]).length}/{section.required.length} required fields
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <Button
                variant="secondary"
                className="w-full mb-2"
                onClick={() => router.push('/employees')}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
