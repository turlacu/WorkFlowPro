'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header style={{
        width: '100%',
        height: '60px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Mobile Layout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }} className="md:hidden">
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleMobileMenu}
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* App Name */}
          <Link href="/assignments" style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1e40af',
            textDecoration: 'none'
          }}>
            WorkSmart Scheduler
          </Link>

          {/* Right side placeholder */}
          <div style={{
            width: '44px',
            height: '44px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}>
            SET
          </div>
        </div>

        {/* Desktop Layout */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }} className="md:flex">
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>
            WorkSmart Scheduler (Desktop)
          </div>
          <div style={{
            backgroundColor: '#ddd6fe',
            padding: '8px 16px',
            borderRadius: '8px'
          }}>
            Desktop Menu
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 40,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#dbeafe',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>
              Mobile Menu
            </h3>
            <p style={{ margin: 0, color: '#64748b' }}>
              Navigation options would go here
            </p>
          </div>
          
          <button
            onClick={closeMobileMenu}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Close Menu
          </button>
        </div>
      )}
    </>
  );
}