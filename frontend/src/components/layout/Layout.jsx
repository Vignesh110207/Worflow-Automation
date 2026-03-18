import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, GitBranch, Play, Users, FileText,
  Bell, LogOut, Menu, X, ChevronRight, Shield, Code2, Activity,
  Settings, Zap, Search, Terminal
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { notifApi } from '../../services/api'
import toast from 'react-hot-toast'
import styles from './Layout.module.css'

const navConfig = {
  admin: [
    { group: 'Overview', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/executions', icon: Activity, label: 'All Executions' },
    ]},
    { group: 'Developer', items: [
      { to: '/workflows', icon: GitBranch, label: 'Workflows' },
      { to: '/executions', icon: Activity, label: 'All Executions' },
      { to: '/execution-logs', icon: Terminal, label: 'Exec Logs' },
      { to: '/audit-logs', icon: FileText, label: 'Audit Logs' },
    ]},
    { group: 'Admin', items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/stats', icon: Settings, label: 'System Stats' },
    ]},
  ],
  developer: [
    { group: 'Overview', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { group: 'Build', items: [
      { to: '/workflows', icon: GitBranch, label: 'Workflows' },
      { to: '/executions', icon: Activity, label: 'Executions' },
      { to: '/execution-logs', icon: Terminal, label: 'Exec Logs' },
      { to: '/audit-logs', icon: FileText, label: 'Audit Logs' },
    ]},
  ],
  user: [
    { group: 'Overview', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]},
    { group: 'Workflow', items: [
      { to: '/user/workflows', icon: GitBranch, label: 'My Workflows' },
      { to: '/user/workflows/new', icon: Play, label: 'Create Workflow' },
      { to: '/user/executions', icon: Activity, label: 'My Executions' },
    ]},
  ],
}

const roleColor = { admin: 'var(--role-admin)', developer: 'var(--role-dev)', user: 'var(--role-user)' }
const roleIcon  = { admin: <Shield size={12}/>, developer: <Code2 size={12}/>, user: <Zap size={12}/> }

export default function Layout() {
  const { user, logout, isAdmin, isDev } = useAuth()
  const [open, setOpen]           = useState(false)
  const [notifs, setNotifs]       = useState([])
  const [unread, setUnread]       = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()

  useEffect(() => { setOpen(false); setShowNotifs(false) }, [location.pathname])

  useEffect(() => {
    const load = () => {
      notifApi.list().then(r => {
        setNotifs(r.data.data.notifications || [])
        setUnread(r.data.data.unread || 0)
      }).catch(() => {})
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  const handleMarkAllRead = async () => {
    await notifApi.markAllRead()
    setUnread(0)
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const groups = navConfig[user?.role] || navConfig.user
  const crumb  = () => {
    const p = location.pathname
    if (p === '/dashboard') return 'Dashboard'
    if (p.startsWith('/workflows')) return 'Workflows'
    if (p.startsWith('/executions')) return 'Executions'
    if (p.startsWith('/audit-logs')) return 'Audit Logs'
    if (p.startsWith('/admin')) return 'Admin'
    if (p.startsWith('/user/workflows/new')) return 'Create Workflow'
    if (p.startsWith('/user/workflows')) return 'My Workflows'
    if (p.startsWith('/user/executions')) return 'My Executions'
    return 'FlowForge'
  }

  return (
    <div className={styles.shell}>
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}
      {showNotifs && <div className={styles.overlay} style={{ zIndex:100 }} onClick={() => setShowNotifs(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <span className={styles.brandName}>FlowForge</span>
            <span className={styles.brandSub}>Advanced</span>
          </div>
        </div>

        {/* User card */}
        <div className={styles.userCard}>
          <div className={styles.userAvatar} style={{ background: roleColor[user?.role] }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userEmail}>{user?.email}</p>
            <span className={styles.userRole} style={{ background: roleColor[user?.role] + '22', color: roleColor[user?.role], border: `1px solid ${roleColor[user?.role]}33` }}>
              {roleIcon[user?.role]} {user?.role}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {groups.map(group => (
            <div key={group.group} className={styles.navGroup}>
              <p className={styles.groupLabel}>{group.group}</p>
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                  <span className={styles.linkIcon}><Icon size={16} /></span>
                  <span>{label}</span>
                  {location.pathname === to && <div className={styles.activePill} />}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setOpen(v => !v)}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>

          <div className={styles.breadcrumb}>
            <span className={styles.bc1}>FlowForge</span>
            <ChevronRight size={12} color="var(--text-4)" />
            <span className={styles.bc2}>{crumb()}</span>
          </div>

          <div className={styles.headerActions}>
            {/* Notification bell */}
            <div style={{ position:'relative' }}>
              <button className={styles.headerBtn} onClick={() => setShowNotifs(v => !v)}>
                <Bell size={17} />
                {unread > 0 && (
                  <span className={styles.notifBadge} style={{ animation:'notifBounce 0.4s ease' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifs && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span style={{ fontWeight:600, fontSize:13 }}>Notifications</span>
                    {unread > 0 && (
                      <button onClick={handleMarkAllRead} style={{ fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifs.length === 0 ? (
                      <p style={{ padding:'20px', textAlign:'center', color:'var(--text-4)', fontSize:12 }}>No notifications</p>
                    ) : notifs.slice(0,8).map(n => (
                      <div key={n.id} className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}
                        onClick={() => { notifApi.markRead(n.id); setNotifs(prev => prev.map(x => x.id===n.id?{...x,is_read:true}:x)); if(unread>0) setUnread(u=>u-1) }}>
                        <div className={styles.notifDot} style={{
                          background: n.type==='success'?'var(--green)':n.type==='error'?'var(--red)':n.type==='warning'?'var(--yellow)':'var(--accent)'
                        }} />
                        <div>
                          <p style={{ fontSize:12, fontWeight:600, color:'var(--text-1)' }}>{n.title}</p>
                          <p style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.headerDivider} />
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 10px 4px 6px', borderRadius:50, border:'1.5px solid var(--grey-100)', background:'var(--grey-50)' }}>
              <div className={styles.avatar} style={{ background: roleColor[user?.role], width:28, height:28 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ display:'flex', flexDirection:'column', lineHeight:1.2 }}>
                <span style={{ fontSize:12, fontWeight:800, color:'var(--grey-900)' }}>{user?.name}</span>
                <span style={{ fontSize:9, color: roleColor[user?.role], fontWeight:800, textTransform:'capitalize' }}>{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
