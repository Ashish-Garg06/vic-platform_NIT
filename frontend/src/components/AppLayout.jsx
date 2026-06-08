import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './UI'

const roleColors = {
  admin: '#B8860B', institutional_head: '#6B3A8B', startup_founder: '#1B3A6B',
  mentor: '#006644', investor: '#0052CC', researcher: '#974F0C',
  evaluator: '#AE2A19', industry: '#2E5FA3'
}

const roleLabel = {
  admin: 'Administrator', institutional_head: 'Institutional Head',
  startup_founder: 'Startup Founder', mentor: 'Expert Mentor',
  investor: 'Investor', researcher: 'Researcher',
  evaluator: 'Evaluator', industry: 'Industry Partner'
}

function navForRole(role) {
  const base = [
    { id: 'core', label: 'Core', items: [
      { path: '/dashboard', icon: '📊', label: 'Dashboard' },
      { path: '/programs', icon: '🏛️', label: 'Programs' },
      { path: '/events', icon: '📅', label: 'Events' },
      { path: '/community', icon: '💬', label: 'Community' },
      { path: '/resources', icon: '📁', label: 'Resources' },
    ]},
  ]
  const byRole = {
    startup_founder: [
      { id: 'startup', label: 'My Startup', items: [
        { path: '/startup', icon: '🚀', label: 'My Profile' },
        { path: '/mentors', icon: '👥', label: 'Mentors' },
        { path: '/investors', icon: '💼', label: 'Investors' },
        { path: '/funding', icon: '💰', label: 'Grants & Funding' },
        { path: '/courses', icon: '📚', label: 'Learning' },
        { path: '/technologies', icon: '🔬', label: 'Tech Transfer' },
        { path: '/problems', icon: '🎯', label: 'Open Innovation' },
        { path: '/services', icon: '🛠️', label: 'Service Requests' },
        { path: '/assessment', icon: '🏆', label: 'Assessment' },
        { path: '/dataroom', icon: '🗄️', label: 'Data Room' },
      ]},
    ],
    mentor: [
      { id: 'mentor', label: 'Mentoring', items: [
        { path: '/mentor-profile', icon: '👤', label: 'My Profile' },
        { path: '/sessions', icon: '📋', label: 'My Sessions' },
      ]},
    ],
    investor: [
      { id: 'investor', label: 'Investments', items: [
        { path: '/startups-list', icon: '🚀', label: 'Browse Startups' },
        { path: '/deals', icon: '📝', label: 'Deal Flow' },
        { path: '/technologies', icon: '🔬', label: 'Tech Marketplace' },
      ]},
    ],
    researcher: [
      { id: 'research', label: 'Research', items: [
        { path: '/researcher-profile', icon: '👤', label: 'My Profile' },
        { path: '/technologies', icon: '🔬', label: 'My Technologies' },
        { path: '/problems', icon: '🎯', label: 'Industry Problems' },
      ]},
    ],
    admin: [
      { id: 'admin', label: 'Administration', items: [
        { path: '/admin', icon: '🏛️', label: 'Admin Overview' },
        { path: '/startups-list', icon: '🚀', label: 'All Startups' },
        { path: '/mentors', icon: '👥', label: 'Mentors' },
        { path: '/investors', icon: '💼', label: 'Investors' },
        { path: '/researchers', icon: '🔬', label: 'Researchers' },
        { path: '/assessments', icon: '🏆', label: 'Assessments' },
        { path: '/services-admin', icon: '🛠️', label: 'Service Tickets' },
        { path: '/funding', icon: '💰', label: 'Funding Schemes' },
        { path: '/courses', icon: '📚', label: 'Courses' },
        { path: '/audit', icon: '📜', label: 'Audit Logs' },
      ]},
    ],
    institutional_head: [
      { id: 'leadership', label: 'Leadership', items: [
        { path: '/admin', icon: '📊', label: 'Dashboard' },
        { path: '/startups-list', icon: '🚀', label: 'Startups' },
        { path: '/technologies', icon: '🔬', label: 'Tech Transfer' },
        { path: '/problems', icon: '🎯', label: 'Open Innovation' },
      ]},
    ],
    evaluator: [
      { id: 'eval', label: 'Evaluation', items: [
        { path: '/startups-list', icon: '🚀', label: 'Startups' },
        { path: '/assessments', icon: '🏆', label: 'Assessments' },
      ]},
    ],
    industry: [
      { id: 'industry', label: 'Industry', items: [
        { path: '/problems', icon: '🎯', label: 'My Challenges' },
        { path: '/technologies', icon: '🔬', label: 'Tech Marketplace' },
        { path: '/startups-list', icon: '🚀', label: 'Browse Startups' },
      ]},
    ],
  }
  return [...base, ...(byRole[role] || [])]
}

export default function AppLayout({ children, pageTitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const sections = navForRole(user?.role || 'startup_founder')

  return (
    <div>
      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div className="sidebar-logo-icon">🏛️</div>
          <div>
            <div className="sidebar-logo-text">VIC Platform</div>
            <div className="sidebar-logo-sub">Virtual Incubation Center</div>
          </div>
        </div>

        <div className="sidebar-user">
          <Avatar name={user?.name || ''} size={34} bg={roleColors[user?.role] || '#1B3A6B'} />
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{roleLabel[user?.role] || user?.role}</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {sections.map(sec => (
            <div key={sec.id}>
              <div className="sidebar-section">{sec.label}</div>
              {sec.items.map(item => (
                <div
                  key={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="nav-item" onClick={logout} style={{ color: 'rgba(255,200,200,.8)' }}>
            <span className="nav-item-icon">🚪</span>
            <span>Sign Out</span>
          </div>
        </div>
      </nav>

      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-title">{pageTitle || 'VIC Platform'}</div>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>🔔</button>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.email}</span>
        </div>
      </header>

      {/* CONTENT */}
      <main className="main-content">
        <div className="page-inner">{children}</div>
      </main>
    </div>
  )
}
