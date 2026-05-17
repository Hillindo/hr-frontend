'use client';

import { useState, useCallback } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Bell, CheckCheck, Filter } from 'lucide-react';
import { useNotificationsList } from '@/features/admin/hooks/useAdmin';
import { type NotificationItem } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);

  const queryParams: Record<string, unknown> = {
    limit: 20,
    ...(cursor ? { cursor } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(readFilter ? { read: readFilter } : {}),
  };

  const { data: notificationsData, isLoading, isFetching } = useNotificationsList(queryParams);

  const notifications: NotificationItem[] = notificationsData?.data ?? [];
  const meta = notificationsData?.meta;

  const displayedNotifications: NotificationItem[] = cursor ? [...allNotifications, ...notifications] : notifications;

  const loadMore = useCallback(() => {
    setAllNotifications(displayedNotifications);
    if (meta?.nextCursor) {
      setCursor(meta.nextCursor);
    }
  }, [meta, displayedNotifications]);

  const resetFilters = () => {
    setTypeFilter('');
    setReadFilter('');
    setCursor(undefined);
    setAllNotifications([]);
  };

  const applyFilter = (filterType: string, filterRead: string) => {
    setTypeFilter(filterType);
    setReadFilter(filterRead);
    setCursor(undefined);
    setAllNotifications([]);
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <PageWrapper
      title="Notifications"
      subtitle="Stay updated with system alerts and messages"
    >
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-muted)]">Filter:</span>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => applyFilter(e.target.value, readFilter)}
          className="h-9 px-3 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Types</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
        <select
          value={readFilter}
          onChange={(e) => applyFilter(typeFilter, e.target.value)}
          className="h-9 px-3 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
        {(typeFilter || readFilter) && (
          <Button variant="secondary" onClick={resetFilters} className="text-xs">
            Clear Filters
          </Button>
        )}
      </div>

      {isLoading && !cursor ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
        </div>
      ) : displayedNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg font-medium">No notifications</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            {typeFilter || readFilter ? 'Try adjusting your filters' : "You're all caught up!"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-colors hover:bg-gray-50/50 ${!notification.isRead ? 'bg-blue-50/30 border-l-4 border-l-[var(--color-accent)]' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {!notification.isRead ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]" />
                  ) : (
                    <CheckCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-medium ${!notification.isRead ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {notification.title}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[notification.type] || 'bg-gray-100 text-gray-800'}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {meta?.hasNext && (
            <div className="flex items-center justify-center py-4">
              <Button variant="secondary" onClick={loadMore} disabled={isFetching}>
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}