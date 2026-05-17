'use client';

import { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect, FilterReset } from '@/components/ui/filter-bar';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/badge';
import { ProgressBar, Avatar } from '@/components/ui/common';
import { useRouter } from 'next/navigation';
import { Plus, Download, Upload, Users, CheckCircle, AlertCircle, FileText, Eye, MoreHorizontal, Edit2, Clock, Heart } from 'lucide-react';
import { useEmployeeList } from '@/features/admin/hooks/useAdmin';

export default function EmployeesPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: employeeData, isLoading } = useEmployeeList({
    page: currentPage,
    pageSize,
    ...(search ? { search } : {}),
    ...(branchFilter ? { branchId: branchFilter } : {}),
    ...(divisionFilter ? { divisionId: divisionFilter } : {}),
    ...(departmentFilter ? { departmentId: departmentFilter } : {}),
    ...(statusFilter ? { employmentStatus: statusFilter } : {}),
    ...(employmentType ? { employmentType } : {}),
  });

  const employees = employeeData?.data ?? [];
  const meta = employeeData?.meta;

  const totalEmployees = meta?.total ?? 0;
  const activeEmployees = employees.filter((e) => e.employmentStatus === 'ACTIVE' || e.employmentStatus === 'Active').length;
  const incompleteProfiles = employees.filter((e) => (e.profileCompleteness ?? 100) < 90).length;

  const resetFilters = () => {
    setSearch('');
    setBranchFilter('');
    setDivisionFilter('');
    setDepartmentFilter('');
    setStatusFilter('');
    setEmploymentType('');
  };

  const hasActiveFilters = search || branchFilter || divisionFilter || departmentFilter || statusFilter || employmentType;

  const columns = [
    {
      key: 'employeeCode', header: 'Employee ID', sortable: true, width: 'w-32',
      render: (row: typeof employees[0]) => <span className="font-mono text-sm text-[var(--color-text-muted)]">{row.employeeCode}</span>,
    },
    {
      key: 'fullName', header: 'Full Name', sortable: true,
      render: (row: typeof employees[0]) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="sm" />
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.fullName}</p>
            {row.preferredName && row.preferredName !== row.fullName && (
              <p className="text-xs text-[var(--color-text-muted)]">({row.preferredName})</p>
            )}
          </div>
        </div>
      ),
    },
    { key: 'departmentName', header: 'Department', sortable: true },
    { key: 'positionName', header: 'Position', sortable: true },
    {
      key: 'managerName', header: 'Manager', sortable: true,
      render: (row: typeof employees[0]) => row.managerName || '-',
    },
    {
      key: 'employmentStatus', header: 'Status', sortable: true,
      render: (row: typeof employees[0]) => <StatusBadge status={row.employmentStatus} />,
    },
    {
      key: 'profileCompleteness', header: 'Profile', sortable: true, width: 'w-32',
      render: (row: typeof employees[0]) => (
        <div className="w-full max-w-[120px]">
          <ProgressBar value={row.profileCompleteness ?? 0} size="sm" showPercentage />
        </div>
      ),
    },
    {
      key: 'actions', header: '', width: 'w-20',
      render: (row: typeof employees[0]) => (
        <div
          className="relative"
          ref={actionMenuOpen === row.id ? menuRef : undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActionMenuOpen(actionMenuOpen === row.id ? null : row.id); }}
            className="p-2 rounded-lg hover:bg-gray-100 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {actionMenuOpen === row.id && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-[var(--color-border)] shadow-lg py-1 w-48 z-50">
              <button onClick={(e) => { e.stopPropagation(); router.push(`/employees/${row.id}`); setActionMenuOpen(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors">
                <Eye className="w-4 h-4" />View Detail
              </button>
              <button onClick={(e) => { e.stopPropagation(); router.push(`/employees/${row.id}/edit`); setActionMenuOpen(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors">
                <Edit2 className="w-4 h-4" />Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); router.push(`/employees/${row.id}?tab=documents`); setActionMenuOpen(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors">
                <FileText className="w-4 h-4" />View Documents
              </button>
              <button onClick={(e) => { e.stopPropagation(); router.push(`/attendance?employee=${row.id}`); setActionMenuOpen(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors">
                <Clock className="w-4 h-4" />View Attendance
              </button>
              <button onClick={(e) => { e.stopPropagation(); router.push(`/leave?employee=${row.id}`); setActionMenuOpen(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors">
                <Heart className="w-4 h-4" />View Leave
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper
      title="Employees"
      subtitle="Manage employee records and profile completeness"
      actions={
        <>
          <Button variant="secondary" icon={Upload}>Import</Button>
          <Button variant="secondary" icon={Download}>Export</Button>
          <Button icon={Plus} onClick={() => router.push('/employees/new')}>Add Employee</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Employees" value={totalEmployees} icon={Users} />
        <SummaryCard title="Active" value={activeEmployees} subtext="Currently employed" icon={CheckCircle} />
        <SummaryCard title="Incomplete Profiles" value={incompleteProfiles} subtext="Need attention" icon={AlertCircle} urgent={incompleteProfiles > 0} />
        <SummaryCard title="Contract Employees" value={employees.filter((e) => e.employmentType === 'CONTRACT').length} subtext="Time-bound employment" icon={FileText} />
      </div>

      <FilterBar className="mb-6">
        <FilterInput placeholder="Search by name, employee ID, email..." value={search} onChange={setSearch} />
        <FilterSelect placeholder="Employment Status" value={statusFilter} onChange={setStatusFilter}
          options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'PROBATION', label: 'Probation' }, { value: 'CONTRACT', label: 'Contract' }, { value: 'RESIGNED', label: 'Resigned' }, { value: 'TERMINATED', label: 'Terminated' }]} />
        <FilterSelect placeholder="Employment Type" value={employmentType} onChange={setEmploymentType}
          options={[{ value: 'PERMANENT', label: 'Full Time' }, { value: 'CONTRACT', label: 'Contract' }, { value: 'PART_TIME', label: 'Part Time' }, { value: 'INTERN', label: 'Internship' }, { value: 'FREELANCE', label: 'Freelance' }]} />
        {hasActiveFilters && <FilterReset onClick={resetFilters}>Reset Filters</FilterReset>}
      </FilterBar>

      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing <span className="font-medium">{employees.length}</span> of <span className="font-medium">{totalEmployees}</span> employees
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
          </div>
        ) : (
          <>
            <DataTable columns={columns} data={employees} onRowClick={(row) => router.push(`/employees/${row.id}`)} />
            <Pagination currentPage={currentPage} totalPages={Math.max(1, meta?.totalPages ?? 1)} onPageChange={setCurrentPage} />
          </>
        )}
      </div>
    </PageWrapper>
  );
}
