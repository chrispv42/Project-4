import React from 'react';

export default function ChromeCard({ className = '', children, ...props }) {
  return (
    <div className={`chrome-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
