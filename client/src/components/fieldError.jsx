import React from 'react';

export default function FieldError({ message, className = '' }) {
  if (!message) return null;
  return <p className={`field-error ${className}`.trim()}>{message}</p>;
}
