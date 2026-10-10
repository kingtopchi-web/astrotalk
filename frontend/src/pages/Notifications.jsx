import React from 'react';
import UserLayout from '../components/UserLayout';

function Notifications() {
  return (
    <UserLayout title="Notifications" subtitle="Stay updated with your latest alerts.">
      <div className="py-12 bg-surface border border-border-color rounded-2xl flex flex-col items-center justify-center text-center px-4">
        <span className="text-6xl mb-4">🔔</span>
        <h2 className="text-2xl font-bold text-on-surface mb-2">No New Notifications</h2>
        <p className="text-on-surface/60 max-w-md">You're all caught up! When you have new alerts, they will appear here.</p>
      </div>
    </UserLayout>
  );
}

export default Notifications;
