// client/src/components/SideBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import ChromeCard from './ChromeCard';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function SideBar({ showTip = false }) {
  return (
    <ChromeCard className="sidebar">
      <div className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => cx('chrome-btn', 'sidebar-link', isActive && 'is-active')}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/vehicles"
          className={({ isActive }) => cx('chrome-btn', 'sidebar-link', isActive && 'is-active')}
        >
          Vehicles
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => cx('chrome-btn', 'sidebar-link', isActive && 'is-active')}
        >
          Profile
        </NavLink>
      </div>

      {showTip ? (
        <div className="sidebar-tip">
          <span className="sidebar-tipLabel">Tip</span>
          <span className="sidebar-tipText">
            Pick an era, then filter by make/model/year. Open a vehicle to drop comments + replies.
          </span>
        </div>
      ) : null}
    </ChromeCard>
  );
}
