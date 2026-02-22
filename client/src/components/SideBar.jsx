// client/src/components/SideBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function SideBar() {
  return (
    <aside className="chrome-card sidebar">
      <div className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `chrome-btn sidebar-link ${isActive ? 'is-active' : ''}`}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/vehicles"
          className={({ isActive }) => `chrome-btn sidebar-link ${isActive ? 'is-active' : ''}`}
        >
          Vehicles
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `chrome-btn sidebar-link ${isActive ? 'is-active' : ''}`}
        >
          Profile
        </NavLink>
      </div>

      <div className="sidebar-tip">
        <span className="sidebar-tipLabel">Tip</span>
        <span className="sidebar-tipText">
          Pick an era, then filter by make/model/year. Open a vehicle to drop comments + replies.
        </span>
      </div>
    </aside>
  );
}
