// client/src/app/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Vehicles from '../pages/Vehicles';
import VehicleDetail from '../pages/VehicleDetail';
import AddVehicle from '../pages/AddVehicle';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* protected later */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />

      {/* Vehicles */}
      <Route path="/vehicles" element={<Vehicles />} />
      <Route path="/vehicles/new" element={<AddVehicle />} />
      <Route path="/vehicles/:id" element={<VehicleDetail />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
