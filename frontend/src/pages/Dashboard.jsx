import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../components/AppLayout'
import { StatCard, Badge, ProgressBar, Spinner, Card, EmptyState } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const FMT = v => typeof v === 'number' ? `₹${(v/100000).toFixed(1)}L` : v

const SECTOR_COLORS = ['#1B3A6B','#2E5FA3','#B8860B','#006644','#AE2A19','#6B3A8B']

const MOCK_TREND = [
  {m:'Jan',rev:2.1,cust:120},{m:'Feb',rev:3.4,cust:180},{m:'Mar',rev:4.2,cust:240},
  {m:'Apr',rev:3.8,cust:220},{m:'May',rev:5.6,cust:380},{m:'Jun',rev:7.2,cust:520}
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout pageTitle="Dashboard"><Spinner /></AppLayout>

  // Admin / Institutional Head view
  if (['admin','institutional_head'].includes(user?.role)) {
    const d = data || {}
    const sectors = d.sectors || []
    return (
      <AppLayout pageTitle="Administration Dashboard">
        <div>
          <div className="page-header">
            <div><h1>Institutional Dashboard</h1><p className="text-muted mt-1">VIC Platform — Live statistics and operational overview</p></div>
          </div>
          <div className="grid-4 mb-4">
            <StatCard label="Total Startups" value={d.totalStartups||0} sub={`${d.activeStartups||0} active`} icon="🚀" accent="#1B3A6B"/>
            <StatCard label="Total Mentors" value={d.totalMentors||0} sub={`${d.availableMentors||0} available`} icon="👥" accent="#006644"/>
            <StatCard label="Funds Facilitated" value={`₹${((d.totalFunding||0)/10000000).toFixed(1)}Cr`} icon="💰" accent="#B8860B"/>
            <StatCard label="Jobs Created" value={d.totalJobs||0} icon="🏢" accent="#2E5FA3"/>
          </div>
          <div className="grid-4 mb-4">
            <StatCard label="Graduated" value={d.graduatedStartups||0} icon="🎓" accent="#006644"/>
            <StatCard label="Patents Filed" value={d.totalPatents||0} icon="💡" accent="#6B3A8B"/>
            <StatCard label="Open Challenges" value={d.openProblems||0} icon="🎯" accent="#974F0C"/>
            <StatCard label="Pending Services" value={d.pendingServices||0} icon="🛠️" accent="#AE2A19"/>
          </div>
          <div className="grid-2 mb-4">
            <Card title="Startup Sector Distribution">
              {sectors.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={sectors} dataKey="count" nameKey="sector" cx="40%" cy="50%" outerRadius={85} innerRadius={45}>
                      {sectors.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState icon="📊" title="No data yet"/>}
            </Card>
            <Card title="Recent Startups">
              {(d.recentStartups||[]).slice(0,5).map(s => (
                <div key={s.id} className="flex items-center justify-between" style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{s.name}</div>
                    <div className="text-muted text-small">{s.founder_name} · {s.sector}</div>
                  </div>
                  <Badge text={s.status}/>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm w-full mt-3" onClick={() => navigate('/startups-list')}>View All Startups →</button>
            </Card>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Startup Founder view
  if (user?.role === 'startup_founder') {
    const s = data?.startup
    const mils = data?.milestones || []
    const sessions = data?.recentSessions || []
    const notifs = data?.notifications || []
    if (!s) return (
      <AppLayout pageTitle="Dashboard">
        <div className="card" style={{ maxWidth:560, margin:'60px auto', textAlign:'center', padding:40 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🚀</div>
          <h2 style={{ marginBottom:12 }}>Register Your Startup</h2>
          <p className="text-muted mb-4">Set up your startup profile to access all platform features — mentors, funding, programs, and more.</p>
          <button className="btn btn-primary" onClick={() => navigate('/startup')}>Register Now →</button>
        </div>
      </AppLayout>
    )
    return (
      <AppLayout pageTitle="Startup Dashboard">
        <div className="flex items-center justify-between mb-4" style={{ background:'var(--navy-light)', padding:'16px 20px', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)' }}>
          <div>
            <h2 style={{ marginBottom:2 }}>Welcome back, {user.name.split(' ')[0]}!</h2>
            <p className="text-muted" style={{ fontSize:13 }}>{s.name} · {s.sector} · <Badge text={s.stage}/> · <Badge text={s.status}/></p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/mentors')}>Book Mentor</button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/assessment')}>Assessment</button>
          </div>
        </div>
        <div className="grid-4 mb-4">
          <StatCard label="Monthly Revenue" value={FMT(s.monthly_revenue)} icon="💰" accent="#006644"/>
          <StatCard label="Customers" value={s.customers} icon="👥" accent="#1B3A6B"/>
          <StatCard label="Funding Raised" value={FMT(s.total_funding)} icon="📈" accent="#B8860B"/>
          <StatCard label="Team Size" value={s.team_size} icon="🏢" accent="#2E5FA3"/>
        </div>
        <div className="grid-2 mb-4">
          <Card title="Revenue Trend">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MOCK_TREND}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1B3A6B" stopOpacity={.25}/><stop offset="95%" stopColor="#1B3A6B" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="m" tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip/>
                <Area type="monotone" dataKey="rev" name="Revenue (L)" stroke="#1B3A6B" fill="url(#rg)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Milestones">
            {mils.length === 0 ? <EmptyState icon="🎯" title="No milestones yet" text="Add milestones to track progress"/> : mils.map(m => (
              <div key={m.id} style={{ marginBottom:14 }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize:13, fontWeight:500, color: m.is_completed ? 'var(--text-3)' : 'var(--text)' }}>
                    {m.is_completed ? '✅' : '🔷'} {m.title}
                  </span>
                  <span className="text-small text-muted">{m.target_date}</span>
                </div>
                {!m.is_completed && <ProgressBar value={m.progress} showLabel/>}
              </div>
            ))}
          </Card>
        </div>
        <div className="grid-2">
          <Card title="Upcoming Sessions">
            {sessions.length === 0 ? <EmptyState icon="📅" title="No sessions" text="Book a mentor session" action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/mentors')}>Find Mentors</button>}/> : sessions.map(s => (
              <div key={s.id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{s.mentor_name}</div>
                <div className="text-muted text-small">{s.scheduled_at} · {s.platform}</div>
                <Badge text={s.status}/>
              </div>
            ))}
          </Card>
          <Card title="Notifications">
            {notifs.length === 0 ? <EmptyState icon="🔔" title="No new notifications"/> : notifs.map(n => (
              <div key={n.id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{n.title}</div>
                <div className="text-muted text-small">{n.message}</div>
              </div>
            ))}
          </Card>
        </div>
      </AppLayout>
    )
  }

  // Default / Mentor / Investor / Researcher
  return (
    <AppLayout pageTitle="Dashboard">
      <div className="page-header">
        <div><h1>Welcome, {user?.name}</h1><p className="text-muted mt-1">{user?.role?.replace('_',' ')} Dashboard</p></div>
      </div>
      <div className="grid-3">
        {[
          { icon:'📅', title:'Events', desc:'View upcoming events and workshops', path:'/events' },
          { icon:'💬', title:'Community', desc:'Connect with the innovation community', path:'/community' },
          { icon:'🔬', title:'Tech Marketplace', desc:'Explore available technologies', path:'/technologies' },
        ].map(c => (
          <div key={c.title} className="card" style={{ textAlign:'center', cursor:'pointer' }} onClick={() => navigate(c.path)}>
            <div style={{ fontSize:40, marginBottom:12 }}>{c.icon}</div>
            <h3 style={{ marginBottom:6 }}>{c.title}</h3>
            <p className="text-muted" style={{ fontSize:13 }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
