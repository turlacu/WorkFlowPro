'use client';

import * as React from 'react';

export default function AppHeader() {
  return (
    <header style={{
      width: '100%',
      height: '60px',
      backgroundColor: '#ff0000',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      position: 'sticky',
      top: 0,
      zIndex: 9999
    }}>
      🔴 EMERGENCY MOBILE HEADER TEST - CAN YOU SEE THIS RED BAR? 🔴
    </header>
  );
}