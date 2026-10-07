import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layouts/AdminLayout';

// Existing pages
import AdminDashboard from './pages/AdminDashboard';
import UsersList from './pages/UsersList';
import ExpertsList from './pages/ExpertsList';
import CategoriesList from './pages/CategoriesList';
import SubCategoriesList from './pages/SubCategoriesList';
import AdminProfile from './pages/AdminProfile';

// New pages
import Analytics from './pages/Analytics';
import ExpertApplications from './pages/ExpertApplications';
import ConsultationsList from './pages/ConsultationsList';
import AdminPlaceholder from './pages/AdminPlaceholder';
import PaymentsList from './pages/PaymentsList';
import SupportTickets from './pages/SupportTickets';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<AdminLayout />}>
          {/* MAIN */}
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/analytics" element={<Analytics />} />

          {/* USERS & EXPERTS */}
          <Route path="/users" element={<UsersList />} />
          <Route path="/experts" element={<ExpertsList />} />
          <Route path="/expert-applications" element={<ExpertApplications />} />
          <Route path="/categories" element={<CategoriesList />} />
          <Route path="/sub-categories" element={<SubCategoriesList />} />

          {/* CONSULTATIONS */}
          <Route path="/consultations" element={<ConsultationsList />} />
          <Route path="/consultations/upcoming" element={<ConsultationsList filterStatus="scheduled" />} />
          <Route path="/consultations/completed" element={<ConsultationsList filterStatus="completed" />} />
          <Route path="/consultations/cancelled" element={<ConsultationsList filterStatus="cancelled" />} />

          {/* COMMUNICATION */}
          <Route path="/messages" element={<SupportTickets />} />
          <Route path="/video-sessions" element={<AdminPlaceholder title="Video Sessions" description="Video session management coming soon." />} />
          <Route path="/notifications" element={<AdminPlaceholder title="Notifications" description="Notification management coming soon." />} />

          {/* FINANCE */}
          <Route path="/payments" element={<PaymentsList />} />
          <Route path="/transactions" element={<PaymentsList />} />
          <Route path="/refunds" element={<AdminPlaceholder title="Refunds" description="Refund management coming soon." />} />
          <Route path="/revenue" element={<AdminPlaceholder title="Revenue" description="Revenue dashboard coming soon." />} />

          {/* CONTENT */}
          <Route path="/reviews" element={<AdminPlaceholder title="Reviews & Ratings" description="Review moderation coming soon." />} />

          {/* SYSTEM */}
          <Route path="/settings" element={<AdminPlaceholder title="Settings" description="Platform settings coming soon." />} />

          {/* ADMIN */}
          <Route path="/profile" element={<AdminProfile />} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
