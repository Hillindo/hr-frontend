'use client';

import { PageWrapper } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Settings, Bell, Shield, Database, Palette } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <PageWrapper
      title="Settings"
      subtitle="Manage your account and system preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-gray-100'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            {activeSection === 'general' && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">General Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Language</label>
                    <select className="mt-1 w-full h-10 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm">
                      <option>Bahasa Indonesia</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Timezone</label>
                    <select className="mt-1 w-full h-10 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm">
                      <option>Asia/Jakarta (GMT+7)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Date Format</label>
                    <select className="mt-1 w-full h-10 px-3 bg-white border border-[var(--color-border)] rounded-xl text-sm">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  {['Email notifications for approvals', 'Push notifications for leave requests', 'Daily attendance reminder', 'Document expiry alerts'].map((item) => (
                    <div key={item} className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                      <span className="text-sm text-[var(--color-text-secondary)]">{item}</span>
                      <input type="checkbox" className="w-5 h-5 rounded" defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Change Password</p>
                    <Button variant="secondary" className="mt-2">Update Password</Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Two-Factor Authentication</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Add an extra layer of security to your account</p>
                    <Button variant="secondary" className="mt-2">Enable 2FA</Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Active Sessions</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">1 active session on this device</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Data & Privacy</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Export My Data</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Download a copy of your personal data</p>
                    <Button variant="secondary" className="mt-2">Request Export</Button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Data Retention</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Your data is retained according to company policy</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Theme</label>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      <div className="p-4 border-2 border-[var(--color-primary)] rounded-xl text-center cursor-pointer">
                        <div className="w-full h-20 bg-white rounded-lg mb-2" />
                        <p className="text-sm font-medium">Light</p>
                      </div>
                      <div className="p-4 border border-[var(--color-border)] rounded-xl text-center cursor-pointer hover:border-gray-400">
                        <div className="w-full h-20 bg-gray-800 rounded-lg mb-2" />
                        <p className="text-sm">Dark</p>
                      </div>
                      <div className="p-4 border border-[var(--color-border)] rounded-xl text-center cursor-pointer hover:border-gray-400">
                        <div className="w-full h-20 bg-gradient-to-b from-white to-gray-800 rounded-lg mb-2" />
                        <p className="text-sm">System</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}