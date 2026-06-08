import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/UI'

const ROLES = [
  { id:'startup_founder', label:'Startup Founder', icon:'🚀', desc:'Register and grow your startup' },
  { id:'mentor',          label:'Expert Mentor',   icon:'👥', desc:'Guide and support startups' },
  { id:'investor',        label:'Investor',         icon:'💼', desc:'Discover and fund startups' },
  { id:'researcher',      label:'Researcher',        icon:'🔬', desc:'Commercialize your research' },
  { id:'industry',        label:'Industry Partner',  icon:'🏭', desc:'Post challenges, find solutions' },
  { id:'evaluator',       label:'Evaluator',          icon:'📋', desc:'Assess startup applications' },
]

const DEMOS = [
  { email:'admin@vic.in',    password:'admin123',    label:'Admin User' },
  { email:'startup@vic.in',  password:'startup123',  label:'Startup Founder' },
  { email:'mentor@vic.in',   password:'mentor123',   label:'Mentor' },
  { email:'rajan@angel.in',  password:'investor123', label:'Investor' },
  { email:'kumar@iima.in',   password:'researcher123', label:'Researcher' },
]

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email:'', password:'' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    try { await login(form.email, form.password); navigate('/dashboard') }
    catch(ex) { setErr(ex.error || 'Login failed') }
    finally { setLoading(false) }
  }

  const autoFill = d => setForm({ email: d.email, password: d.password })

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)' }}>
      {/* Left Panel */}
      <div style={{ width:360, background:'var(--navy)', display:'flex', flexDirection:'column', justifyContent:'center', padding:40 }}>
        <div style={{ fontFamily:"'Merriweather',serif", fontSize:28, fontWeight:700, color:'#fff', marginBottom:8 }}>VIC Platform</div>
        <div style={{ color:'rgba(255,255,255,.6)', fontSize:13, marginBottom:40 }}>Virtual Incubation Center</div>
        <div style={{ fontSize:14, color:'rgba(255,255,255,.8)', marginBottom:12 }}>Quick demo access:</div>
        {DEMOS.map(d => (
          <button key={d.email} onClick={() => autoFill(d)} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.85)', padding:'8px 14px', borderRadius:'var(--radius)', marginBottom:6, cursor:'pointer', textAlign:'left', fontSize:13, width:'100%' }}>
            <strong>{d.label}</strong><br/><span style={{ fontSize:11, opacity:.7 }}>{d.email}</span>
          </button>
        ))}
      </div>
      {/* Right Panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <h1 style={{ marginBottom:6 }}>Sign In</h1>
          <p style={{ color:'var(--text-3)', marginBottom:28, fontSize:14 }}>Access the VIC Platform with your credentials</p>
          {err && <Alert type="danger">{err}</Alert>}
          <form onSubmit={handle}>
            <div className="form-group mt-3">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" required/>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required/>
            </div>
            <button className="btn btn-primary w-full mt-2" style={{ padding:'10px',fontSize:15 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In to Platform'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-3)' }}>
            Don't have an account? <Link to="/register" style={{ color:'var(--navy-mid)', fontWeight:600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('startup_founder')
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault(); setErr(''); setLoading(true)
    try { await register({ ...form, role }); navigate('/dashboard') }
    catch(ex) { setErr(ex.error || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)' }}>
      <div style={{ width:340, background:'var(--navy)', display:'flex', flexDirection:'column', justifyContent:'center', padding:40 }}>
        <div style={{ fontFamily:"'Merriweather',serif", fontSize:26, fontWeight:700, color:'#fff', marginBottom:8 }}>Join VIC Platform</div>
        <div style={{ color:'rgba(255,255,255,.6)', fontSize:13, marginBottom:32 }}>India's Virtual Incubation Center</div>
        {['✅ Free to join', '🚀 Immediate access', '🤝 500+ community members', '💡 AI-powered tools', '📊 Real-time analytics'].map(f => (
          <div key={f} style={{ color:'rgba(255,255,255,.8)', fontSize:13, marginBottom:10 }}>{f}</div>
        ))}
        <p style={{ marginTop:24, textAlign:'center' }}>
          <Link to="/login" style={{ color:'rgba(255,255,255,.6)', fontSize:13 }}>Already have an account? Sign in →</Link>
        </p>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40, overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:500 }}>
          <h1 style={{ marginBottom:6 }}>Create Account</h1>
          <p style={{ color:'var(--text-3)', marginBottom:24, fontSize:14 }}>Select your role and fill in your details</p>
          {err && <Alert type="danger">{err}</Alert>}

          <div className="mb-4">
            <label className="form-label">I am joining as…</label>
            <div className="grid-2 mt-2" style={{ gap:8 }}>
              {ROLES.map(r => (
                <div key={r.id} onClick={() => setRole(r.id)} style={{ border:`2px solid ${role===r.id ? 'var(--navy)' : 'var(--border)'}`, borderRadius:'var(--radius)', padding:'10px 12px', cursor:'pointer', background: role===r.id ? 'var(--navy-light)' : '#fff', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{r.icon}</span>
                  <div><div style={{ fontSize:13, fontWeight:600, color: role===r.id ? 'var(--navy)' : 'var(--text)' }}>{r.label}</div><div style={{ fontSize:11, color:'var(--text-3)' }}>{r.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handle}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Dr. Firstname Lastname"/>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 9876543210"/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required placeholder="you@institution.in"/>
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-control" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required placeholder="Min. 6 characters" minLength={6}/>
              </div>
            </div>
            <button className="btn btn-primary w-full" style={{ padding:'11px',fontSize:15 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
