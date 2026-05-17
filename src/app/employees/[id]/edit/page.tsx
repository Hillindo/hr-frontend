'use client';

import { useState, use, useEffect, useMemo } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { TabPanel } from '@/components/ui/common';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  User,
  Briefcase,
  MapPin,
  Phone,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';

import { useEmployeeDetail, useEmployeeList, useSalaryGroups, useUpdateEmployee } from '@/features/admin/hooks/useAdmin';
import { useBranchesQuery } from '@/features/master-data/branches/branches.hooks';
import { useDivisionsQuery } from '@/features/master-data/divisions/divisions.hooks';
import { useDepartmentsQuery } from '@/features/master-data/departments/departments.hooks';
import { usePositionsQuery } from '@/features/master-data/positions/positions.hooks';
import { useToastSimple } from '@/components/ui/toast-provider';
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
  endDate: string;
  salaryGroupId: string;
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
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
  bpjsKesehatanNumber: string;
  bpjsKetenagakerjaanNumber: string;
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
  employmentStatus: 'ACTIVE',
  joinDate: '',
  endDate: '',
  salaryGroupId: '',
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
  bankName: '',
  bankAccountNumber: '',
  bankAccountHolderName: '',
  bpjsKesehatanNumber: '',
  bpjsKetenagakerjaanNumber: '',
};

interface FormErrors {
  [key: string]: string;
}

const PAYROLL_SENSITIVE_FIELDS: (keyof FormData)[] = [
  'employmentStatus',
  'employmentType',
  'branchId',
  'divisionId',
  'departmentId',
  'positionId',
  'managerId',
  'joinDate',
  'endDate',
  'salaryGroupId',
  'npwp',
  'bankName',
  'bankAccountNumber',
  'bankAccountHolderName',
  'bpjsKesehatanNumber',
  'bpjsKetenagakerjaanNumber',
];

const PAYROLL_SENSITIVE_LABELS: Record<string, string> = {
  employmentStatus: 'Employment Status',
  employmentType: 'Employment Type',
  branchId: 'Branch',
  divisionId: 'Division',
  departmentId: 'Department',
  positionId: 'Position',
  managerId: 'Manager',
  joinDate: 'Join Date',
  endDate: 'Resign Date',
  salaryGroupId: 'Salary Group',
  npwp: 'NPWP',
  bankName: 'Bank Name',
  bankAccountNumber: 'Bank Account Number',
  bankAccountHolderName: 'Bank Account Holder',
  bpjsKesehatanNumber: 'BPJS Kesehatan',
  bpjsKetenagakerjaanNumber: 'BPJS Ketenagakerjaan',
};

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToastSimple();
  const employeeQuery = useEmployeeDetail(id);
  const updateMutation = useUpdateEmployee();
  const branchesQuery = useBranchesQuery({ pageSize: 100 });
  const divisionsQuery = useDivisionsQuery({ pageSize: 100 });
  const departmentsQuery = useDepartmentsQuery({ pageSize: 100 });
  const positionsQuery = usePositionsQuery({ pageSize: 100 });
  const managersQuery = useEmployeeList({ pageSize: 100, isActive: 'true' });
  const salaryGroupsQuery = useSalaryGroups({ pageSize: 100, isActive: 'true' });

  const branches = branchesQuery.data?.data ?? [];
  const divisions = divisionsQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];
  const positions = positionsQuery.data?.data ?? [];
  const managers = managersQuery.data?.data ?? [];
  const salaryGroups = useMemo(() => salaryGroupsQuery.data?.data ?? [], [salaryGroupsQuery.data?.data]);
  const employee = employeeQuery.data?.data;

  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [originalData, setOriginalData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPayrollWarning, setShowPayrollWarning] = useState(false);

  useEffect(() => {
    if (employee) {
      const mapped: FormData = {
        fullName: employee.fullName || '',
        preferredName: employee.preferredName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        gender: employee.gender || '',
        birthDate: employee.birthDate || '',
        nik: employee.nik || '',
        npwp: employee.npwp || '',
        branchId: employee.branchId || '',
        divisionId: employee.divisionId || '',
        departmentId: employee.departmentId || '',
        positionId: employee.positionId || '',
        managerId: employee.managerId || '',
        employmentType: employee.employmentType,
        employmentStatus: employee.employmentStatus,
        joinDate: employee.joinDate || '',
        endDate: employee.endDate || '',
        salaryGroupId: salaryGroups.find((group) => group.code === employee.salaryGroup)?.id || '',
        address: employee.address || '',
        city: employee.city || '',
        province: employee.province || '',
        postalCode: employee.postalCode || '',
        nationality: employee.nationality || 'Indonesia',
        religion: employee.religion || '',
        bloodType: employee.bloodType || '',
        emergencyContactName: employee.emergencyContacts?.[0]?.name || '',
        emergencyContactRelationship: employee.emergencyContacts?.[0]?.relationship || '',
        emergencyContactPhone: employee.emergencyContacts?.[0]?.phone || '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        bankAccountHolderName: employee.bankAccountHolderName || '',
        bpjsKesehatanNumber: employee.bpjsKesehatanNumber || '',
        bpjsKetenagakerjaanNumber: employee.bpjsKetenagakerjaanNumber || '',
      };
      // This form mirrors async API data for an edit screen.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(mapped);
      setOriginalData(mapped);
    }
  }, [employee, salaryGroups]);

  const changedPayrollFields = useMemo(() => {
    return PAYROLL_SENSITIVE_FIELDS.filter((field) => {
      return formData[field] !== originalData[field];
    });
  }, [formData, originalData]);

  if (employeeQuery.isLoading || branchesQuery.isLoading || divisionsQuery.isLoading || departmentsQuery.isLoading || positionsQuery.isLoading || salaryGroupsQuery.isLoading) {
    return (
      <PageWrapper title="Edit Employee">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
          <span className="ml-3 text-[var(--color-text-muted)]">Loading employee data...</span>
        </div>
      </PageWrapper>
    );
  }

  if (employeeQuery.isError || !employee) {
    return (
      <PageWrapper title="Employee Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[var(--color-text-muted)]">Employee not found</p>
          <Button variant="secondary" onClick={() => router.push('/employees')} className="mt-4">
            Back to Employees
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'contact', label: 'Contact', icon: MapPin },
    { id: 'emergency', label: 'Emergency', icon: Phone },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
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
      if (formData.joinDate && formData.endDate && formData.joinDate > formData.endDate) {
        newErrors.endDate = 'Resign date cannot be earlier than join date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeTab)) {
      const tabOrder = ['basic', 'employment', 'payroll', 'contact', 'emergency'];
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
      }
    }
  };

  const handleBack = () => {
    const tabOrder = ['basic', 'employment', 'payroll', 'contact', 'emergency'];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };

  const buildPayload = () => {
    const payload: Record<string, string> = {};
    for (const key of Object.keys(formData) as (keyof FormData)[]) {
      if (formData[key] !== originalData[key]) {
        if (formData[key] !== '' || originalData[key] !== '') {
          (payload as Record<string, string>)[key] = formData[key];
        }
      }
    }
    return payload;
  };

  const doSave = async () => {
    const payload = buildPayload();

    if (Object.keys(payload).length === 0) {
      toast.info('No changes', 'No fields were modified.');
      return;
    }

    try {
      await updateMutation.mutateAsync({ id, payload });
      toast.success('Employee updated', `${employee.fullName} has been updated successfully.`);
      router.push(`/employees/${id}`);
    } catch (error) {
      const description =
        error instanceof HttpError
          ? error.message
          : 'The employee could not be updated. Please review the form and try again.';
      toast.error('Failed to update employee', description);
    }
  };

  const handleSave = () => {
    const basicValid = validateStep('basic');
    const employmentValid = validateStep('employment');

    if (!basicValid || !employmentValid) {
      setActiveTab(!basicValid ? 'basic' : 'employment');
      return;
    }

    if (changedPayrollFields.length > 0) {
      setShowPayrollWarning(true);
    } else {
      doSave();
    }
  };

  const handleConfirmPayrollWarning = () => {
    setShowPayrollWarning(false);
    doSave();
  };

  const isSaving = updateMutation.isPending;

  const tabOrder = ['basic', 'employment', 'payroll', 'contact', 'emergency'];
  const currentTabIndex = tabOrder.indexOf(activeTab);

  return (
    <PageWrapper
      title="Edit Employee"
      subtitle={`Editing ${employee.fullName} - ${employee.employeeCode}`}
    >
      <button
        onClick={() => router.push(`/employees/${id}`)}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employee Detail
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
                  <div className={cn(`w-12 h-0.5`, isCompleted ? 'bg-[var(--color-accent)]' : 'bg-gray-200')} />
                )}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl transition-colors',
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                      : isCompleted
                      ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                      : 'bg-gray-50 text-[var(--color-text-muted)] hover:bg-gray-100'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{tab.label}</span>
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
                        {employee.employeeCode}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-[var(--color-text-muted)]">
                      Read-only
                    </span>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Full Name <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    disabled={isSaving}
                    className={cn(
                      'w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2',
                      errors.fullName ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
                      isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    )}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.fullName}
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
                    disabled={isSaving}
                    className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Email <span className="text-[var(--color-danger)]">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isSaving}
                      className={cn(
                        'w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2',
                        errors.email ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
                        isSaving ? 'opacity-50 cursor-not-allowed' : ''
                      )}
                    />
                    {errors.email && (
                      <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={isSaving}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Gender and Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      disabled={isSaving}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white disabled:opacity-50"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Birth Date</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      disabled={isSaving}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* NIK and NPWP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">NIK (National ID)</label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => handleInputChange('nik', e.target.value)}
                      disabled={isSaving}
                      maxLength={16}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 font-mono disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      NPWP (Tax Number)
                      {changedPayrollFields.includes('npwp') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]" title="Payroll-sensitive field">
                          <AlertTriangle className="w-3 h-3 inline" /> Payroll
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={formData.npwp}
                      onChange={(e) => handleInputChange('npwp', e.target.value)}
                      disabled={isSaving}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 font-mono disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={() => router.push(`/employees/${id}`)} disabled={isSaving}>Cancel</Button>
                  <Button onClick={handleNext} icon={ArrowRight} iconPosition="right">Next</Button>
                </div>
              </div>
            </TabPanel>

            {/* Section 2 - Employment Info */}
            <TabPanel isActive={activeTab === 'employment'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Employment Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Branch <span className="text-[var(--color-danger)]">*</span>
                      {changedPayrollFields.includes('branchId') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => handleInputChange('branchId', e.target.value)}
                      disabled={isSaving}
                      className={cn('w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white', errors.branchId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', isSaving ? 'opacity-50' : '')}
                    >
                      <option value="">Select branch</option>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {errors.branchId && <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.branchId}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Division <span className="text-[var(--color-danger)]">*</span>
                      {changedPayrollFields.includes('divisionId') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <select
                      value={formData.divisionId}
                      onChange={(e) => handleInputChange('divisionId', e.target.value)}
                      disabled={isSaving}
                      className={cn('w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white', errors.divisionId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', isSaving ? 'opacity-50' : '')}
                    >
                      <option value="">Select division</option>
                      {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Department <span className="text-[var(--color-danger)]">*</span>
                      {changedPayrollFields.includes('departmentId') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => handleInputChange('departmentId', e.target.value)}
                      disabled={isSaving}
                      className={cn('w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white', errors.departmentId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', isSaving ? 'opacity-50' : '')}
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Position <span className="text-[var(--color-danger)]">*</span>
                      {changedPayrollFields.includes('positionId') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <select
                      value={formData.positionId}
                      onChange={(e) => handleInputChange('positionId', e.target.value)}
                      disabled={isSaving}
                      className={cn('w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white', errors.positionId ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', isSaving ? 'opacity-50' : '')}
                    >
                      <option value="">Select position</option>
                      {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Manager
                    {changedPayrollFields.includes('managerId') && (
                      <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                    )}
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => handleInputChange('managerId', e.target.value)}
                    disabled={isSaving}
                    className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white disabled:opacity-50"
                  >
                    <option value="">Select manager</option>
                    {managers.filter((e) => e.id !== id).map((e) => (
                      <option key={e.id} value={e.id}>{e.fullName} - {e.positionName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Employment Type <span className="text-[var(--color-danger)]">*</span>
                      {changedPayrollFields.includes('employmentType') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => handleInputChange('employmentType', e.target.value)}
                      disabled={isSaving}
                      className={cn('w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white', errors.employmentType ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', isSaving ? 'opacity-50' : '')}
                    >
                      <option value="">Select type</option>
                      <option value="PERMANENT">Full-time / Permanent</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Employment Status
                      {changedPayrollFields.includes('employmentStatus') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <select
                      value={formData.employmentStatus}
                      onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                      disabled={isSaving}
                      className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white disabled:opacity-50"
                    >
                      <option value="PROBATION">On Probation</option>
                      <option value="ACTIVE">Active</option>
                      <option value="RESIGNED">Resigned</option>
                      <option value="TERMINATED">Terminated</option>
                      <option value="CONTRACT">Contract</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Join Date <span className="text-[var(--color-danger)]">*</span>
                      {changedPayrollFields.includes('joinDate') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => handleInputChange('joinDate', e.target.value)}
                      disabled={isSaving}
                      className={cn('w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2', errors.joinDate ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', isSaving ? 'opacity-50' : '')}
                    />
                    {errors.joinDate && <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.joinDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Resign Date
                      {changedPayrollFields.includes('endDate') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      disabled={isSaving}
                      className={cn('w-full h-10 px-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2', errors.endDate ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]', isSaving ? 'opacity-50' : '')}
                    />
                    {errors.endDate && <p className="text-xs text-[var(--color-danger)] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.endDate}</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={handleBack} icon={ArrowLeft} disabled={isSaving}>Back</Button>
                  <Button onClick={handleNext} icon={ArrowRight} iconPosition="right">Next</Button>
                </div>
              </div>
            </TabPanel>

            {/* Section 3 - Payroll, Bank & Compliance */}
            <TabPanel isActive={activeTab === 'payroll'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Payroll, Bank & Compliance Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Salary Group
                    {changedPayrollFields.includes('salaryGroupId') && (
                      <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                    )}
                  </label>
                  <select
                    value={formData.salaryGroupId}
                    onChange={(e) => handleInputChange('salaryGroupId', e.target.value)}
                    disabled={isSaving}
                    className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white disabled:opacity-50"
                  >
                    <option value="">No salary group</option>
                    {salaryGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.code} - {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Bank Name
                      {changedPayrollFields.includes('bankName') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <input type="text" value={formData.bankName} onChange={(e) => handleInputChange('bankName', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      Bank Account Number
                      {changedPayrollFields.includes('bankAccountNumber') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <input type="text" value={formData.bankAccountNumber} onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Bank Account Holder
                    {changedPayrollFields.includes('bankAccountHolderName') && (
                      <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                    )}
                  </label>
                  <input type="text" value={formData.bankAccountHolderName} onChange={(e) => handleInputChange('bankAccountHolderName', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      BPJS Kesehatan
                      {changedPayrollFields.includes('bpjsKesehatanNumber') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <input type="text" value={formData.bpjsKesehatanNumber} onChange={(e) => handleInputChange('bpjsKesehatanNumber', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                      BPJS Ketenagakerjaan
                      {changedPayrollFields.includes('bpjsKetenagakerjaanNumber') && (
                        <span className="ml-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-3 h-3 inline" /> Payroll</span>
                      )}
                    </label>
                    <input type="text" value={formData.bpjsKetenagakerjaanNumber} onChange={(e) => handleInputChange('bpjsKetenagakerjaanNumber', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={handleBack} icon={ArrowLeft} disabled={isSaving}>Back</Button>
                  <Button onClick={handleNext} icon={ArrowRight} iconPosition="right">Next</Button>
                </div>
              </div>
            </TabPanel>

            {/* Section 3 - Contact & Address */}
            <TabPanel isActive={activeTab === 'contact'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Contact & Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={isSaving}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 resize-none disabled:opacity-50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">City</label>
                    <input type="text" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Province</label>
                    <input type="text" value={formData.province} onChange={(e) => handleInputChange('province', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Postal Code</label>
                    <input type="text" value={formData.postalCode} onChange={(e) => handleInputChange('postalCode', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Nationality</label>
                    <input type="text" value={formData.nationality} onChange={(e) => handleInputChange('nationality', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Religion</label>
                    <select value={formData.religion} onChange={(e) => handleInputChange('religion', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white disabled:opacity-50">
                      <option value="">Select religion</option>
                      <option value="Islam">Islam</option>
                      <option value="Christian">Christian</option>
                      <option value="Catholic">Catholic</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Blood Type</label>
                    <select value={formData.bloodType} onChange={(e) => handleInputChange('bloodType', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white disabled:opacity-50">
                      <option value="">Select blood type</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={handleBack} icon={ArrowLeft} disabled={isSaving}>Back</Button>
                  <Button onClick={handleNext} icon={ArrowRight} iconPosition="right">Next</Button>
                </div>
              </div>
            </TabPanel>

            {/* Section 4 - Emergency Contact */}
            <TabPanel isActive={activeTab === 'emergency'}>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Emergency Contact</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Contact Name</label>
                  <input type="text" value={formData.emergencyContactName} onChange={(e) => handleInputChange('emergencyContactName', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Relationship</label>
                  <select value={formData.emergencyContactRelationship} onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 bg-white disabled:opacity-50">
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Phone Number</label>
                  <input type="tel" value={formData.emergencyContactPhone} onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)} disabled={isSaving} className="w-full h-10 px-3 border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="secondary" onClick={handleBack} icon={ArrowLeft} disabled={isSaving}>Back</Button>
                  <Button onClick={handleSave} icon={Save} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </TabPanel>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Current Data</h3>
            <div className="space-y-4">
              <div className="p-4 bg-[var(--color-bg)] rounded-xl">
                <p className="text-xs text-[var(--color-text-muted)]">Employee Code</p>
                <p className="text-sm font-mono font-medium">{employee.employeeCode}</p>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-xl">
                <p className="text-xs text-[var(--color-text-muted)]">Department</p>
                <p className="text-sm font-medium">{employee.departmentName}</p>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-xl">
                <p className="text-xs text-[var(--color-text-muted)]">Position</p>
                <p className="text-sm font-medium">{employee.positionName}</p>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-xl">
                <p className="text-xs text-[var(--color-text-muted)]">Employment Status</p>
                <p className="text-sm font-medium">{employee.employmentStatus}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <Button variant="secondary" className="w-full" onClick={() => router.push(`/employees/${id}`)} disabled={isSaving}>Cancel</Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Payroll-Sensitive Field Warning Modal */}
      <Modal
        isOpen={showPayrollWarning}
        onClose={() => setShowPayrollWarning(false)}
        title="Payroll-Sensitive Changes Detected"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowPayrollWarning(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmPayrollWarning} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : 'Confirm & Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Changes to the following fields can affect payroll calculations:
              </p>
              <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                {changedPayrollFields.map((field) => (
                  <li key={field}>{PAYROLL_SENSITIVE_LABELS[field] || field}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            These changes will be recorded in the audit trail. This will only affect future payroll runs, not historical payroll data.
          </p>
        </div>
      </Modal>
    </PageWrapper>
  );
}
