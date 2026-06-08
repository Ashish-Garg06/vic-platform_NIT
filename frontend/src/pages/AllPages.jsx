// ── Shared imports ────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import AppLayout from '../components/AppLayout'
import { StatCard, Badge, TrlBadge, ProgressBar, Modal, Spinner, Card, EmptyState, SearchBar, Tabs, Avatar, Alert, FormGroup, Select, useToast, PageHeader } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const fmt = (n) => n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr` : n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${n?.toLocaleString()}`
const ROLE_COLORS = {'admin':'#B8860B','startup_founder':'#1B3A6B','mentor':'#006644','investor':'#0052CC','researcher':'#974F0C','evaluator':'#AE2A19'}

// ══════════════════════════════════════════════════════════
// MENTORS
// ══════════════════════════════════════════════════════════
export function Mentors() {
  const { user } = useAuth()
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [bookForm, setBookForm] = useState({ scheduled_at:'', platform:'Zoom', agenda:'' })
  const [booking, setBooking] = useState(false)
  const [sessions, setSessions] = useState([])
  const [tab, setTab] = useState('directory')
  const { show, ToastContainer } = useToast()

  useEffect(() => {
    api.get('/mentors').then(r => setMentors(r.data)).finally(() => setLoading(false))
    if (user?.role !== 'investor') api.get('/mentors/my/sessions').then(r => setSessions(r.data)).catch(()=>{})
  }, [])

  const filtered = mentors.filter(m => {
    const q = search.toLowerCase()
    return (!q || m.name?.toLowerCase().includes(q) || m.expertise?.toLowerCase().includes(q))
      && (filter === 'all' || (filter === 'available' && m.is_available))
  })

  const book = async () => {
    if (!bookForm.scheduled_at || !bookForm.agenda) return show('Please fill all fields', 'warning')
    setBooking(true)
    try {
      await api.post(`/mentors/${selected.id}/book`, bookForm)
      show('Session booked successfully!', 'success')
      setSelected(null)
      api.get('/mentors/my/sessions').then(r => setSessions(r.data))
    } catch(e) { show(e.error || 'Failed to book', 'danger') }
    finally { setBooking(false) }
  }

  if (loading) return <AppLayout pageTitle="Mentor Directory"><Spinner/></AppLayout>

  return (
    <AppLayout pageTitle="Mentor Directory">
      <ToastContainer/>
      <PageHeader title="Mentor Directory" subtitle={`${mentors.length} expert mentors available`}
        actions={<><SearchBar value={search} onChange={setSearch} placeholder="Search mentors..."/><select className="form-control" style={{width:140}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All Mentors</option><option value="available">Available Now</option></select></>}/>
      <Tabs tabs={[{id:'directory',label:'Mentor Directory'},{id:'sessions',label:`My Sessions (${sessions.length})`}]} active={tab} onChange={setTab}/>
      {tab==='directory' && (
        <div className="grid-auto">
          {filtered.map(m => (
            <div key={m.id} className="card" style={{ borderTop:`3px solid ${m.is_available ? 'var(--success)' : 'var(--border)'}` }}>
              <div className="flex gap-3 mb-3">
                <Avatar name={m.name} size={48} bg={ROLE_COLORS.mentor}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                  <div className="text-muted text-small">{m.company} · {m.designation}</div>
                  <div className="mt-1"><span style={{color:'#B8860B',fontSize:12}}>★ {m.rating||4.8}</span> · {m.total_sessions} sessions</div>
                </div>
                <div style={{width:10,height:10,borderRadius:'50%',background:m.is_available?'var(--success)':'var(--border)',flexShrink:0,marginTop:4}} title={m.is_available?'Available':'Unavailable'}/>
              </div>
              <div className="text-small text-muted mb-3" style={{lineHeight:1.5}}>{m.bio?.slice(0,120)}...</div>
              <div className="flex gap-1 mb-3" style={{flexWrap:'wrap'}}>
                {(m.expertise||'').split(',').slice(0,3).map(t=>t.trim()).filter(Boolean).map(t=><span key={t} className="chip">{t}</span>)}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary btn-sm" disabled={!m.is_available} onClick={() => setSelected(m)} style={{flex:1}}>{m.is_available?'Book Session':'Unavailable'}</button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <EmptyState icon="👥" title="No mentors found" text="Try adjusting search"/>}
        </div>
      )}
      {tab==='sessions' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mentor</th><th>Date & Time</th><th>Platform</th><th>Agenda</th><th>Status</th></tr></thead>
            <tbody>
              {sessions.length===0 && <tr><td colSpan={5}><EmptyState icon="📅" title="No sessions yet" text="Book your first mentoring session"/></td></tr>}
              {sessions.map(s=>(
                <tr key={s.id}>
                  <td style={{fontWeight:600}}>{s.mentor_name}</td>
                  <td>{s.scheduled_at}</td>
                  <td>{s.platform}</td>
                  <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.agenda}</td>
                  <td><Badge text={s.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={`Book Session — ${selected?.name}`}
        footer={<><button className="btn btn-ghost" onClick={()=>setSelected(null)}>Cancel</button><button className="btn btn-primary" onClick={book} disabled={booking}>{booking?'Booking…':'Confirm Booking'}</button></>}>
        <div className="flex gap-3 mb-4">
          <Avatar name={selected?.name||''} size={44} bg={ROLE_COLORS.mentor}/>
          <div><div style={{fontWeight:600}}>{selected?.name}</div><div className="text-muted text-small">{selected?.expertise}</div></div>
        </div>
        <FormGroup label="Date & Time" required>
          <input className="form-control" type="datetime-local" value={bookForm.scheduled_at} onChange={e=>setBookForm({...bookForm,scheduled_at:e.target.value})}/>
        </FormGroup>
        <FormGroup label="Platform">
          <Select value={bookForm.platform} onChange={e=>setBookForm({...bookForm,platform:e.target.value})}>
            {['Zoom','Google Meet','Microsoft Teams'].map(p=><option key={p}>{p}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Session Agenda" required>
          <textarea className="form-control" rows={3} placeholder="Describe what you'd like to discuss..." value={bookForm.agenda} onChange={e=>setBookForm({...bookForm,agenda:e.target.value})}/>
        </FormGroup>
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// INVESTORS
// ══════════════════════════════════════════════════════════
export function Investors() {
  const { user } = useAuth()
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [connecting, setConnecting] = useState(null)
  const { show, ToastContainer } = useToast()

  useEffect(() => { api.get('/investors').then(r=>setInvestors(r.data)).finally(()=>setLoading(false)) }, [])

  const connect = async (id) => {
    setConnecting(id)
    try { await api.post(`/investors/${id}/connect`, { message: 'Interested in a conversation about our startup.' }); show('Connection request sent!','success') }
    catch(e) { show(e.error||'Failed','danger') }
    finally { setConnecting(null) }
  }

  const filtered = investors.filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.firm_name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <AppLayout pageTitle="Investor Connect"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Investor Connect">
      <ToastContainer/>
      <PageHeader title="Investor Connect" subtitle="AI-matched investors based on your startup profile"
        actions={<SearchBar value={search} onChange={setSearch} placeholder="Search investors..."/>}/>
      <Alert type="info">🤖 Match scores calculated using AI based on sector alignment, stage, and funding requirements.</Alert>
      <div className="grid-auto mt-4">
        {filtered.map(inv => (
          <div key={inv.id} className="card" style={{borderTop:`3px solid var(--navy)`}}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <Avatar name={inv.firm_name||inv.name} size={44} bg="#0052CC"/>
                <div><div style={{fontWeight:700,fontSize:14}}>{inv.firm_name||inv.name}</div><div className="text-muted text-small">{inv.name} · {inv.city}</div></div>
              </div>
              <span className="badge badge-green">{Math.floor(70+Math.random()*25)}% match</span>
            </div>
            <div className="grid-2 mb-3" style={{gap:8}}>
              {[{l:'Type',v:inv.investor_type},{l:'Stage',v:inv.investment_stage},{l:'Ticket',v:inv.max_ticket?`${fmt(inv.min_ticket)}–${fmt(inv.max_ticket)}`:'-'},{l:'Portfolio',v:`${inv.portfolio_count} cos`}].map(d=>(
                <div key={d.l} style={{background:'var(--bg)',borderRadius:'var(--radius)',padding:'8px 10px'}}><div className="text-muted text-small">{d.l}</div><div style={{fontWeight:600,fontSize:12,marginTop:2}}>{d.v||'—'}</div></div>
              ))}
            </div>
            <div className="flex gap-1 mb-3" style={{flexWrap:'wrap'}}>
              {(inv.sectors_focus||'').split(',').filter(Boolean).map(s=><span key={s.trim()} className="chip">{s.trim()}</span>)}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={()=>setSelected(inv)} style={{flex:1}}>View Profile</button>
              <button className="btn btn-primary btn-sm" onClick={()=>connect(inv.id)} disabled={connecting===inv.id} style={{flex:1}}>{connecting===inv.id?'Sending…':'Connect'}</button>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?.firm_name||selected?.name||''}>
        {selected && (<div>
          <div className="grid-2 mb-4" style={{gap:12}}>
            {[{l:'Investor Type',v:selected.investor_type},{l:'Investment Stage',v:selected.investment_stage},{l:'Min Ticket',v:fmt(selected.min_ticket)},{l:'Max Ticket',v:fmt(selected.max_ticket)},{l:'Portfolio',v:`${selected.portfolio_count} companies`},{l:'City',v:selected.city}].map(d=>(
              <div key={d.l} style={{background:'var(--bg)',borderRadius:'var(--radius)',padding:12}}><div className="text-muted text-small">{d.l}</div><div style={{fontWeight:700,marginTop:4}}>{d.v||'—'}</div></div>
            ))}
          </div>
          {selected.bio&&<p className="text-muted" style={{fontSize:13,lineHeight:1.6}}>{selected.bio}</p>}
        </div>)}
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// COURSES
// ══════════════════════════════════════════════════════════
export function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const { show, ToastContainer } = useToast()

  const load = () => api.get('/courses').then(r=>setCourses(r.data)).finally(()=>setLoading(false))
  useEffect(() => { load() }, [])

  const enroll = async (id) => {
    try { await api.post(`/courses/${id}/enroll`); show('Enrolled successfully!','success'); load() }
    catch(e) { show(e.error||'Error','danger') }
  }

  const cats = [...new Set(courses.map(c=>c.category).filter(Boolean))]
  const filtered = courses.filter(c=>!filter||c.category===filter)

  const levelColor = {Beginner:'green',Intermediate:'amber',Advanced:'red'}

  if (loading) return <AppLayout pageTitle="Learning Academy"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Learning Academy">
      <ToastContainer/>
      <PageHeader title="Learning Academy" subtitle={`${courses.length} courses across ${cats.length} domains`}
        actions={<select className="form-control" style={{width:180}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All Categories</option>{cats.map(c=><option key={c}>{c}</option>)}</select>}/>
      <div className="grid-auto">
        {filtered.map(c=>(
          <div key={c.id} className="card" style={{borderTop:`3px solid var(--navy)`}}>
            <div className="flex justify-between mb-2">
              <span className="badge badge-navy">{c.category}</span>
              <span className={`badge badge-${levelColor[c.level]||'gray'}`}>{c.level}</span>
            </div>
            <h3 style={{marginBottom:6,fontSize:14}}>{c.title}</h3>
            <div className="text-muted text-small mb-3">by {c.instructor} · {c.duration_hours}h · {c.total_lessons} lessons · ★ {c.rating}</div>
            {c.enrolled && c.my_progress > 0 && (
              <div className="mb-3"><div className="flex justify-between text-small text-muted mb-1"><span>{c.my_progress>=100?'✅ Completed':'In Progress'}</span><span>{c.my_progress}%</span></div><ProgressBar value={c.my_progress} color={c.my_progress>=100?'green':'navy'}/></div>
            )}
            <div className="text-small text-muted mb-3">{c.enrolled_count?.toLocaleString()} enrolled</div>
            <button className="btn btn-sm w-full" onClick={()=>enroll(c.id)} style={{background:c.enrolled?'var(--success)':'var(--navy)',color:'#fff',border:'none'}}>
              {c.my_progress>=100?'📜 Get Certificate':c.enrolled?'▶ Continue Learning':'Enroll Free'}
            </button>
          </div>
        ))}
        {filtered.length===0&&<EmptyState icon="📚" title="No courses found"/>}
      </div>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════
export function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { show, ToastContainer } = useToast()

  const load = () => api.get('/events').then(r=>setEvents(r.data)).finally(()=>setLoading(false))
  useEffect(()=>{load()},[])

  const register = async (id) => {
    try { await api.post(`/events/${id}/register`); show('Registered successfully!','success'); load() }
    catch(e) { show(e.error||'Error','danger') }
  }
  const unregister = async (id) => {
    try { await api.delete(`/events/${id}/register`); show('Registration cancelled','info'); load() }
    catch(e) { show(e.error||'Error','danger') }
  }

  const typeIcon = {Workshop:'📋','Demo Day':'🎤',Hackathon:'💻',Conference:'🏛️',Networking:'🤝',Competition:'🏆'}

  if (loading) return <AppLayout pageTitle="Events"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Events & Workshops">
      <ToastContainer/>
      <PageHeader title="Events & Workshops" subtitle="Workshops, hackathons, demo days, and networking events"/>
      <div className="grid-auto">
        {events.map(ev=>(
          <div key={ev.id} className="card" style={{borderLeft:`4px solid var(--navy)`}}>
            <div className="flex justify-between mb-2">
              <span className="badge badge-navy">{ev.event_type}</span>
              <Badge text={ev.status}/>
            </div>
            <div style={{fontSize:20,marginBottom:8}}>{typeIcon[ev.event_type]||'📅'} {ev.title}</div>
            <div className="text-muted text-small mb-1">📅 {ev.start_date?.replace('T',' ')?.slice(0,16)}</div>
            <div className="text-muted text-small mb-3">📍 {ev.location} {ev.is_virtual?'· Virtual':''}</div>
            {ev.speakers&&<div className="text-small mb-3"><strong>Speakers:</strong> {ev.speakers}</div>}
            <div className="mb-3">
              <div className="flex justify-between text-small text-muted mb-1"><span>Registrations</span><span>{ev.registered_count}/{ev.capacity}</span></div>
              <ProgressBar value={(ev.registered_count/ev.capacity)*100}/>
            </div>
            <button className="btn btn-sm w-full" onClick={()=>ev.registered?unregister(ev.id):register(ev.id)} style={{background:ev.registered?'var(--danger)':'var(--navy)',color:'#fff',border:'none'}}>
              {ev.registered?'Cancel Registration':'Register Now'}
            </button>
          </div>
        ))}
        {events.length===0&&<EmptyState icon="📅" title="No upcoming events"/>}
      </div>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// FUNDING
// ══════════════════════════════════════════════════════════
export function Funding() {
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [applyForm, setApplyForm] = useState({amount_applied:'',notes:''})
  const { show, ToastContainer } = useToast()

  const load = ()=>api.get('/funding/schemes').then(r=>setSchemes(r.data)).finally(()=>setLoading(false))
  useEffect(()=>{load()},[])

  const apply = async () => {
    try {
      await api.post('/funding/apply',{scheme_id:applying.id,...applyForm})
      show('Application submitted!','success'); setApplying(null); load()
    } catch(e) { show(e.error||'Error','danger') }
  }

  const statusMap = {'not_applied':'gray','Draft':'gray','Submitted':'blue','Under Review':'amber','Approved':'green','Rejected':'red','Disbursed':'green'}

  if (loading) return <AppLayout pageTitle="Funding & Grants"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Funding & Grants">
      <ToastContainer/>
      <PageHeader title="Grants & Funding" subtitle="Government schemes, grants, and funding opportunities"/>
      <div className="grid-4 mb-4">
        <StatCard label="Available Schemes" value={schemes.filter(s=>s.status==='Open').length} icon="🏦" accent="var(--navy)"/>
        <StatCard label="Applied" value={schemes.filter(s=>s.my_status&&s.my_status!=='not_applied').length} icon="📝" accent="var(--navy-mid)"/>
        <StatCard label="Approved" value={schemes.filter(s=>s.my_status==='Approved').length} icon="✅" accent="var(--success)"/>
        <StatCard label="Under Review" value={schemes.filter(s=>s.my_status==='Under Review').length} icon="🔍" accent="var(--warning)"/>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {schemes.map(s=>(
          <div key={s.id} className="card" style={{borderLeft:`4px solid ${s.status==='Closing Soon'?'var(--danger)':'var(--navy)'}`}}>
            <div className="flex justify-between items-start" style={{flexWrap:'wrap',gap:8}}>
              <div>
                <div className="flex gap-2 items-center mb-2">
                  <h3 style={{marginBottom:0}}>{s.name}</h3>
                  {s.status==='Closing Soon'&&<Badge text="⚠ Closing Soon" type="red"/>}
                </div>
                <div className="flex gap-2 mb-2"><Badge text={s.authority} type="navy"/><span className="badge badge-gray">{s.scheme_type}</span></div>
                <p className="text-muted text-small">{s.description}</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:"'Merriweather',serif",fontSize:18,fontWeight:700,color:'var(--success)'}}>₹{(s.min_amount/100000).toFixed(0)}L – ₹{(s.max_amount/100000).toFixed(0)}L</div>
                <div className="text-muted text-small">Deadline: {s.deadline||'Rolling'}</div>
              </div>
            </div>
            <hr className="divider"/>
            <div className="flex justify-between items-center">
              <Badge text={s.my_status==='not_applied'?'Not Applied':s.my_status} type={statusMap[s.my_status]||'gray'}/>
              <div className="flex gap-2">
                {(s.my_status==='not_applied'||!s.my_status)&&<button className="btn btn-primary btn-sm" onClick={()=>setApplying(s)}>Apply Now</button>}
                {s.my_status&&s.my_status!=='not_applied'&&<span className="text-muted text-small">Applied {s.applied_at?.slice(0,10)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={!!applying} onClose={()=>setApplying(null)} title={`Apply — ${applying?.name}`}
        footer={<><button className="btn btn-ghost" onClick={()=>setApplying(null)}>Cancel</button><button className="btn btn-primary" onClick={apply}>Submit Application</button></>}>
        <Alert type="info">Grant range: ₹{(applying?.min_amount/100000).toFixed(0)}L – ₹{(applying?.max_amount/100000).toFixed(0)}L</Alert>
        <div className="mt-3">
          <FormGroup label="Amount Requested (₹)" required>
            <input className="form-control" type="number" value={applyForm.amount_applied} onChange={e=>setApplyForm({...applyForm,amount_applied:e.target.value})} placeholder="e.g. 500000"/>
          </FormGroup>
          <FormGroup label="Supporting Notes">
            <textarea className="form-control" rows={3} value={applyForm.notes} onChange={e=>setApplyForm({...applyForm,notes:e.target.value})} placeholder="Briefly describe how your startup meets the eligibility criteria..."/>
          </FormGroup>
        </div>
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// COMMUNITY
// ══════════════════════════════════════════════════════════
export function Community() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [circles, setCircles] = useState([])
  const [newPost, setNewPost] = useState('')
  const [tab, setTab] = useState('feed')
  const [loading, setLoading] = useState(true)
  const { show, ToastContainer } = useToast()

  const load = () => { api.get('/community/posts').then(r=>setPosts(r.data)); api.get('/community/circles').then(r=>setCircles(r.data)).finally(()=>setLoading(false)) }
  useEffect(()=>{load()},[])

  const post = async () => {
    if (!newPost.trim()) return
    try { await api.post('/community/posts',{content:newPost}); setNewPost(''); show('Posted!','success'); load() }
    catch(e) { show(e.error||'Error','danger') }
  }
  const like = async (id) => { try { await api.post(`/community/posts/${id}/like`); load() } catch(_){} }
  const joinCircle = async (id) => { try { await api.post(`/community/circles/${id}/join`); show('Joined!','success'); load() } catch(e){ show(e.error||'Already member','info') } }

  if (loading) return <AppLayout pageTitle="Community"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Community">
      <ToastContainer/>
      <PageHeader title="Innovation Community" subtitle="Connect, share insights, and collaborate with founders, mentors, and researchers"/>
      <Tabs tabs={[{id:'feed',label:'Community Feed'},{id:'circles',label:`Innovation Circles (${circles.length})`}]} active={tab} onChange={setTab}/>
      {tab==='feed' && (
        <div style={{maxWidth:720}}>
          <div className="card mb-4">
            <div className="flex gap-3">
              <Avatar name={user?.name||''} size={40} bg={ROLE_COLORS[user?.role]||'#1B3A6B'}/>
              <div style={{flex:1}}>
                <textarea className="form-control" rows={3} placeholder="Share an update, ask a question, or post an insight with the community..." value={newPost} onChange={e=>setNewPost(e.target.value)}/>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted text-small">Visible to all community members</span>
                  <button className="btn btn-primary btn-sm" onClick={post} disabled={!newPost.trim()}>Post Update</button>
                </div>
              </div>
            </div>
          </div>
          {posts.map(p=>(
            <div key={p.id} className="card mb-3">
              <div className="flex gap-3 mb-3">
                <Avatar name={p.author_name} size={40} bg={ROLE_COLORS[p.author_role]||'#1B3A6B'}/>
                <div>
                  <div style={{fontWeight:700}}>{p.author_name}</div>
                  <div className="text-muted text-small">{p.author_role?.replace('_',' ')} · {p.created_at?.slice(0,16)}</div>
                </div>
              </div>
              <p style={{fontSize:14,lineHeight:1.7,marginBottom:12,whiteSpace:'pre-wrap'}}>{p.content}</p>
              <hr className="divider"/>
              <div className="flex gap-4">
                <button className="btn btn-ghost btn-sm" onClick={()=>like(p.id)} style={{color:p.liked_by_me?'var(--navy)':'var(--text-3)'}}>👍 {p.likes_count}</button>
                <button className="btn btn-ghost btn-sm" style={{color:'var(--text-3)'}}>💬 {p.comments_count}</button>
                <button className="btn btn-ghost btn-sm" style={{color:'var(--text-3)',marginLeft:'auto'}}>↗ Share</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab==='circles' && (
        <div className="grid-auto">
          {circles.map(c=>(
            <div key={c.id} className="card">
              <div className="flex justify-between mb-2"><span className="badge badge-navy">{c.circle_type}</span>{c.is_private&&<span className="badge badge-gray">Private</span>}</div>
              <h3 style={{marginBottom:6,fontSize:14}}>{c.name}</h3>
              <p className="text-muted text-small mb-3">{c.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-small text-muted">👥 {c.member_count} members</span>
                <button className="btn btn-sm" onClick={()=>joinCircle(c.id)} style={{background:c.is_member?'var(--success)':'var(--navy)',color:'#fff',border:'none'}}>{c.is_member?'✓ Member':'Join'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// TECHNOLOGY TRANSFER
// ══════════════════════════════════════════════════════════
export function Technologies() {
  const { user } = useAuth()
  const [techs, setTechs] = useState([])
  const [ip, setIp] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [trlMin, setTrlMin] = useState(1)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({title:'',description:'',category:'',trl_level:1,keywords:'',valuation:''})
  const [tab, setTab] = useState('marketplace')
  const { show, ToastContainer } = useToast()

  const load = () => {
    api.get(`/technologies?trl_min=${trlMin}&q=${search}`).then(r=>setTechs(r.data))
    api.get('/technologies/my/ip').then(r=>setIp(r.data)).finally(()=>setLoading(false))
  }
  useEffect(()=>{load()},[search,trlMin])

  const addTech = async () => {
    try { await api.post('/technologies',addForm); show('Technology listed!','success'); setShowAdd(false); load() }
    catch(e) { show(e.error||'Error','danger') }
  }

  const licenseRequest = async (techId) => {
    try { await api.post(`/technologies/${techId}/license`,{license_type:'Non-Exclusive',royalty_rate:5,duration_years:5,terms:'Standard licensing terms apply'}); show('License request submitted!','success'); setSelected(null) }
    catch(e) { show(e.error||'Error','danger') }
  }

  if (loading) return <AppLayout pageTitle="Technology Transfer"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Technology Transfer & Commercialization">
      <ToastContainer/>
      <PageHeader title="Technology Transfer" subtitle="Discover and license university technologies for commercialization"
        actions={<>{['researcher'].includes(user?.role)&&<button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ List Technology</button>}</>}/>
      <Tabs tabs={[{id:'marketplace',label:'Technology Marketplace',count:techs.length},{id:'ip',label:'IP Portfolio',count:ip.length}]} active={tab} onChange={setTab}/>
      {tab==='marketplace' && (
        <>
          <div className="flex gap-3 mb-4" style={{flexWrap:'wrap'}}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search technologies..." style={{flex:1,minWidth:200}}/>
            <div className="flex items-center gap-2">
              <label className="text-small text-muted">Min TRL:</label>
              <input type="range" min={1} max={9} value={trlMin} onChange={e=>setTrlMin(e.target.value)} style={{width:100,accentColor:'var(--navy)'}}/>
              <span className="badge badge-navy">{trlMin}</span>
            </div>
          </div>
          <div className="grid-auto">
            {techs.map(t=>(
              <div key={t.id} className="card" style={{borderTop:'3px solid var(--navy)'}}>
                <div className="flex justify-between mb-2"><TrlBadge level={t.trl_level}/><Badge text={t.status}/></div>
                <h3 style={{marginBottom:6,fontSize:14}}>{t.title}</h3>
                <p className="text-muted text-small mb-2" style={{lineHeight:1.5}}>{t.description?.slice(0,100)}...</p>
                <div className="text-small mb-2"><strong>Researcher:</strong> {t.researcher_name} · {t.institution}</div>
                {t.valuation&&<div className="text-small mb-3"><strong>Valuation:</strong> {fmt(t.valuation)}</div>}
                <div className="flex gap-1 mb-3" style={{flexWrap:'wrap'}}>{(t.keywords||'').split(',').filter(Boolean).map(k=><span key={k.trim()} className="chip">{k.trim()}</span>)}</div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={()=>setSelected(t)}>Details</button>
                  {user?.role==='startup_founder'&&t.status==='Available'&&<button className="btn btn-primary btn-sm" style={{flex:1}} onClick={()=>licenseRequest(t.id)}>Request License</button>}
                </div>
              </div>
            ))}
            {techs.length===0&&<EmptyState icon="🔬" title="No technologies found"/>}
          </div>
        </>
      )}
      {tab==='ip' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Application No.</th><th>Filing Date</th></tr></thead>
            <tbody>
              {ip.length===0&&<tr><td colSpan={5}><EmptyState icon="💡" title="No IP assets registered"/></td></tr>}
              {ip.map(i=><tr key={i.id}><td style={{fontWeight:600}}>{i.title}</td><td>{i.ip_type}</td><td><Badge text={i.status}/></td><td>{i.application_number||'—'}</td><td>{i.filing_date||'—'}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="List New Technology"
        footer={<><button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={addTech}>Submit Listing</button></>}>
        <div className="form-row">
          <FormGroup label="Title" required><input className="form-control" value={addForm.title} onChange={e=>setAddForm({...addForm,title:e.target.value})}/></FormGroup>
          <FormGroup label="Category"><input className="form-control" value={addForm.category} onChange={e=>setAddForm({...addForm,category:e.target.value})}/></FormGroup>
        </div>
        <FormGroup label="Description"><textarea className="form-control" rows={3} value={addForm.description} onChange={e=>setAddForm({...addForm,description:e.target.value})}/></FormGroup>
        <div className="form-row">
          <FormGroup label={`TRL Level: ${addForm.trl_level}`}><input type="range" min={1} max={9} value={addForm.trl_level} onChange={e=>setAddForm({...addForm,trl_level:Number(e.target.value)})} style={{width:'100%',accentColor:'var(--navy)'}}/></FormGroup>
          <FormGroup label="Valuation (₹)"><input className="form-control" type="number" value={addForm.valuation} onChange={e=>setAddForm({...addForm,valuation:e.target.value})}/></FormGroup>
        </div>
        <FormGroup label="Keywords (comma-separated)"><input className="form-control" value={addForm.keywords} onChange={e=>setAddForm({...addForm,keywords:e.target.value})}/></FormGroup>
      </Modal>

      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?.title||''} size="lg">
        {selected&&(<div>
          <div className="flex gap-3 mb-4"><TrlBadge level={selected.trl_level}/><Badge text={selected.status}/></div>
          <p style={{lineHeight:1.7,marginBottom:16}}>{selected.description}</p>
          <div className="grid-2" style={{gap:12}}>
            {[{l:'Researcher',v:selected.researcher_name},{l:'Institution',v:selected.institution},{l:'Category',v:selected.category},{l:'Valuation',v:fmt(selected.valuation)}].map(d=>(
              <div key={d.l} style={{background:'var(--bg)',padding:'10px 12px',borderRadius:'var(--radius)'}}><div className="text-muted text-small">{d.l}</div><div style={{fontWeight:600,marginTop:3}}>{d.v||'—'}</div></div>
            ))}
          </div>
          {selected.use_cases&&<div className="mt-3"><strong>Use Cases:</strong><p className="text-muted mt-1" style={{fontSize:13}}>{selected.use_cases}</p></div>}
          {user?.role==='startup_founder'&&selected.status==='Available'&&<button className="btn btn-primary w-full mt-4" onClick={()=>licenseRequest(selected.id)}>Request License for This Technology</button>}
        </div>)}
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// INDUSTRY PROBLEMS
// ══════════════════════════════════════════════════════════
export function Problems() {
  const { user } = useAuth()
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({company_name:'',title:'',description:'',problem_type:'Technology Challenge',sector:'',budget_range:'',deadline:'',collaboration_type:'Co-Development'})
  const [solForm, setSolForm] = useState({title:'',description:'',approach:'',timeline:'',budget_requested:''})
  const [submittingSol, setSubmittingSol] = useState(false)
  const { show, ToastContainer } = useToast()

  const load = () => api.get('/problems').then(r=>setProblems(r.data)).finally(()=>setLoading(false))
  useEffect(()=>{load()},[])

  const addProblem = async () => {
    try { await api.post('/problems',addForm); show('Problem posted!','success'); setShowAdd(false); load() }
    catch(e) { show(e.error||'Error','danger') }
  }

  const submitSolution = async () => {
    setSubmittingSol(true)
    try { await api.post(`/problems/${selected.id}/solutions`,solForm); show('Solution submitted!','success'); setSelected(null); load() }
    catch(e) { show(e.error||'Error','danger') }
    finally { setSubmittingSol(false) }
  }

  const canPost = ['admin','industry','institutional_head'].includes(user?.role)
  const canSolve = ['startup_founder','researcher'].includes(user?.role)

  if (loading) return <AppLayout pageTitle="Open Innovation"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Industry Problem Exchange">
      <ToastContainer/>
      <PageHeader title="Open Innovation Platform" subtitle="Industry problem statements open for startup and research solutions"
        actions={canPost&&<button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Post Challenge</button>}/>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {problems.map(p=>(
          <div key={p.id} className="card" style={{borderLeft:`4px solid var(--gold)`}}>
            <div className="flex justify-between items-start" style={{flexWrap:'wrap',gap:8}}>
              <div style={{flex:1}}>
                <div className="flex gap-2 mb-2"><span className="badge badge-amber">{p.problem_type}</span><Badge text={p.status}/>{p.sector&&<span className="badge badge-navy">{p.sector}</span>}</div>
                <h3 style={{marginBottom:6}}>{p.title}</h3>
                <div className="text-muted text-small mb-2">Posted by {p.posted_by}{p.company_name&&` · ${p.company_name}`}</div>
                <p className="text-muted" style={{fontSize:13,lineHeight:1.6}}>{p.description?.slice(0,200)}{p.description?.length>200?'...':''}</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                {p.budget_range&&<div style={{fontWeight:700,color:'var(--success)',fontSize:14}}>{p.budget_range}</div>}
                {p.deadline&&<div className="text-muted text-small">Due: {p.deadline}</div>}
                <div className="text-small mt-1">{p.solutions_count} solution{p.solutions_count!==1?'s':''}</div>
              </div>
            </div>
            <hr className="divider"/>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={()=>setSelected(p)}>View Details</button>
              {canSolve&&p.status==='Open'&&<button className="btn btn-primary btn-sm" onClick={()=>setSelected(p)}>Submit Solution</button>}
            </div>
          </div>
        ))}
        {problems.length===0&&<EmptyState icon="🎯" title="No open challenges" text="No industry problems posted yet"/>}
      </div>

      {/* Add Problem Modal */}
      <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Post Industry Challenge" size="lg"
        footer={<><button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={addProblem}>Post Challenge</button></>}>
        <div className="form-row">
          <FormGroup label="Company Name"><input className="form-control" value={addForm.company_name} onChange={e=>setAddForm({...addForm,company_name:e.target.value})}/></FormGroup>
          <FormGroup label="Sector"><input className="form-control" value={addForm.sector} onChange={e=>setAddForm({...addForm,sector:e.target.value})}/></FormGroup>
        </div>
        <FormGroup label="Challenge Title" required><input className="form-control" value={addForm.title} onChange={e=>setAddForm({...addForm,title:e.target.value})}/></FormGroup>
        <FormGroup label="Description" required><textarea className="form-control" rows={4} value={addForm.description} onChange={e=>setAddForm({...addForm,description:e.target.value})}/></FormGroup>
        <div className="form-row">
          <FormGroup label="Problem Type"><Select value={addForm.problem_type} onChange={e=>setAddForm({...addForm,problem_type:e.target.value})}><option>Technology Challenge</option><option>Innovation Request</option><option>R&D Requirement</option><option>Technical Challenge</option></Select></FormGroup>
          <FormGroup label="Collaboration Type"><Select value={addForm.collaboration_type} onChange={e=>setAddForm({...addForm,collaboration_type:e.target.value})}><option>Co-Development</option><option>Licensing</option><option>Pilot Project</option><option>Research Contract</option></Select></FormGroup>
        </div>
        <div className="form-row">
          <FormGroup label="Budget Range"><input className="form-control" value={addForm.budget_range} onChange={e=>setAddForm({...addForm,budget_range:e.target.value})} placeholder="e.g. ₹25L – ₹1Cr"/></FormGroup>
          <FormGroup label="Deadline"><input className="form-control" type="date" value={addForm.deadline} onChange={e=>setAddForm({...addForm,deadline:e.target.value})}/></FormGroup>
        </div>
      </Modal>

      {/* View & Submit Solution Modal */}
      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?.title||''} size="lg">
        {selected&&(<div>
          <div className="flex gap-2 mb-3"><Badge text={selected.status}/><span className="badge badge-amber">{selected.problem_type}</span></div>
          <p style={{lineHeight:1.7,marginBottom:16}}>{selected.description}</p>
          <div className="grid-2 mb-4" style={{gap:10}}>
            {[{l:'Budget',v:selected.budget_range},{l:'Deadline',v:selected.deadline},{l:'Collaboration',v:selected.collaboration_type},{l:'Solutions',v:selected.solutions_count}].map(d=>(
              <div key={d.l} style={{background:'var(--bg)',padding:'10px 12px',borderRadius:'var(--radius)'}}><div className="text-muted text-small">{d.l}</div><div style={{fontWeight:600,marginTop:3}}>{d.v||'—'}</div></div>
            ))}
          </div>
          {canSolve&&selected.status==='Open'&&(<>
            <hr className="divider"/>
            <h3 className="mb-3">Submit Your Solution</h3>
            <FormGroup label="Solution Title" required><input className="form-control" value={solForm.title} onChange={e=>setSolForm({...solForm,title:e.target.value})}/></FormGroup>
            <FormGroup label="Solution Description" required><textarea className="form-control" rows={3} value={solForm.description} onChange={e=>setSolForm({...solForm,description:e.target.value})}/></FormGroup>
            <FormGroup label="Technical Approach"><textarea className="form-control" rows={2} value={solForm.approach} onChange={e=>setSolForm({...solForm,approach:e.target.value})}/></FormGroup>
            <div className="form-row">
              <FormGroup label="Timeline"><input className="form-control" value={solForm.timeline} onChange={e=>setSolForm({...solForm,timeline:e.target.value})} placeholder="e.g. 6 months"/></FormGroup>
              <FormGroup label="Budget Required (₹)"><input className="form-control" type="number" value={solForm.budget_requested} onChange={e=>setSolForm({...solForm,budget_requested:e.target.value})}/></FormGroup>
            </div>
            <button className="btn btn-primary w-full" onClick={submitSolution} disabled={submittingSol}>{submittingSol?'Submitting…':'Submit Solution'}</button>
          </>)}
        </div>)}
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// SERVICE REQUESTS
// ══════════════════════════════════════════════════════════
export function Services() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({service_type:'Patent Filing',title:'',description:'',priority:'Medium',due_date:''})
  const { show, ToastContainer } = useToast()

  const load = () => api.get('/services').then(r=>setRequests(r.data)).finally(()=>setLoading(false))
  useEffect(()=>{load()},[])

  const submit = async () => {
    try { await api.post('/services',form); show('Request submitted!','success'); setShowAdd(false); load() }
    catch(e) { show(e.error||'Error','danger') }
  }

  const SERVICE_TYPES = ['Patent Filing','Legal Review','Investor Readiness','Branding & Marketing','Prototype Development','Financial Modeling','Technical Architecture','Market Research','Compliance Review','Video Production']

  if (loading) return <AppLayout pageTitle="Service Requests"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Incubation Services">
      <ToastContainer/>
      <PageHeader title="Service Requests" subtitle="Request expert services from the VIC team"
        actions={['startup_founder','researcher'].includes(user?.role)&&<button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ New Request</button>}/>
      <div className="table-wrap card">
        <table>
          <thead><tr><th>#</th><th>Service Type</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            {requests.length===0&&<tr><td colSpan={6}><EmptyState icon="🛠️" title="No service requests yet" text="Submit a request to get expert help"/></td></tr>}
            {requests.map((r,i)=>(
              <tr key={r.id}>
                <td className="text-muted">{i+1}</td>
                <td style={{fontWeight:600}}>{r.service_type}</td>
                <td>{r.title}</td>
                <td><Badge text={r.priority} type={r.priority==='Urgent'?'red':r.priority==='High'?'amber':'gray'}/></td>
                <td><Badge text={r.status}/></td>
                <td className="text-muted text-small">{r.created_at?.slice(0,10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="New Service Request"
        footer={<><button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={submit}>Submit Request</button></>}>
        <FormGroup label="Service Type" required>
          <Select value={form.service_type} onChange={e=>setForm({...form,service_type:e.target.value})}>
            {SERVICE_TYPES.map(t=><option key={t}>{t}</option>)}
          </Select>
        </FormGroup>
        <FormGroup label="Request Title" required><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></FormGroup>
        <FormGroup label="Description" required><textarea className="form-control" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></FormGroup>
        <div className="form-row">
          <FormGroup label="Priority"><Select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></Select></FormGroup>
          <FormGroup label="Required By"><input className="form-control" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></FormGroup>
        </div>
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// ASSESSMENT
// ══════════════════════════════════════════════════════════
const PARAMS = [
  {key:'innovation_score',label:'Innovation',w:.20,icon:'💡',desc:'Novelty and uniqueness of the solution'},
  {key:'market_score',label:'Market Size',w:.15,icon:'📊',desc:'Addressable market size and growth'},
  {key:'team_score',label:'Team',w:.20,icon:'👥',desc:'Experience and complementary skills'},
  {key:'technology_score',label:'Technology',w:.15,icon:'⚙️',desc:'Technical defensibility and scalability'},
  {key:'revenue_score',label:'Revenue Potential',w:.15,icon:'💰',desc:'Clarity of monetization model'},
  {key:'scalability_score',label:'Scalability',w:.15,icon:'🚀',desc:'Ability to scale beyond initial market'},
]

export function Assessment() {
  const { user } = useAuth()
  const [scores, setScores] = useState(Object.fromEntries(PARAMS.map(p=>[p.key,5])))
  const [remarks, setRemarks] = useState('')
  const [startupId, setStartupId] = useState('')
  const [startups, setStartups] = useState([])
  const [assessments, setAssessments] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const { show, ToastContainer } = useToast()

  const isEval = ['admin','evaluator'].includes(user?.role)
  const isFounder = user?.role === 'startup_founder'

  useEffect(() => {
    if (isEval) {
      api.get('/startups').then(r=>setStartups(r.data))
      api.get('/assessments').then(r=>setAssessments(r.data)).finally(()=>setLoading(false))
    } else {
      api.get('/dashboard').then(r=>{
        if(r.data?.startup?.id){setStartupId(r.data.startup.id);api.get(`/assessments/startup/${r.data.startup.id}`).then(r2=>setAssessments(r2.data))}
      }).finally(()=>setLoading(false))
    }
  },[])

  const overall = PARAMS.reduce((acc,p)=>acc+scores[p.key]*p.w,0)*10
  const radarData = PARAMS.map(p=>({subject:p.label,value:scores[p.key],fullMark:10}))

  const submit = async () => {
    if (!startupId && isEval) return show('Select a startup','warning')
    try {
      const r = await api.post('/assessments',{startup_id:startupId||undefined,...scores,remarks})
      setResult(r.data); setSubmitted(true); show('Assessment submitted!','success')
    } catch(e) { show(e.error||'Error','danger') }
  }

  if (loading) return <AppLayout pageTitle="Assessment"><Spinner/></AppLayout>

  return (
    <AppLayout pageTitle="Startup Assessment Engine">
      <ToastContainer/>
      <PageHeader title="Startup Assessment Engine" subtitle="Evaluate startups on 6 key parameters for incubation readiness"/>
      {!submitted ? (
        <div className="grid-2">
          <div>
            {isEval && (
              <div className="card mb-4">
                <FormGroup label="Select Startup to Assess" required>
                  <Select value={startupId} onChange={e=>setStartupId(e.target.value)}>
                    <option value="">— Choose startup —</option>
                    {startups.map(s=><option key={s.id} value={s.id}>{s.name} ({s.sector})</option>)}
                  </Select>
                </FormGroup>
              </div>
            )}
            {PARAMS.map(p=>(
              <div key={p.key} className="card mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center"><span style={{fontSize:22}}>{p.icon}</span><div><div style={{fontWeight:700}}>{p.label}</div><div className="text-muted text-small">{p.desc}</div></div></div>
                  <div style={{fontFamily:"'Merriweather',serif",fontSize:24,fontWeight:700,color:scores[p.key]>=7?'var(--success)':scores[p.key]>=5?'var(--navy)':'var(--danger)'}}>{scores[p.key]}/10</div>
                </div>
                <input type="range" min={1} max={10} value={scores[p.key]} onChange={e=>setScores({...scores,[p.key]:Number(e.target.value)})} style={{width:'100%',accentColor:'var(--navy)'}}/>
                <div className="flex justify-between text-small text-muted mt-1"><span>1 — Poor</span><span>5 — Average</span><span>10 — Excellent</span></div>
              </div>
            ))}
            <div className="card mb-3">
              <FormGroup label="Evaluator Remarks">
                <textarea className="form-control" rows={3} value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Summary observations and recommendations..."/>
              </FormGroup>
            </div>
            <button className="btn btn-primary w-full btn-lg" onClick={submit}>Generate Assessment Report →</button>
          </div>
          <div>
            <div className="card mb-4" style={{textAlign:'center'}}>
              <h3 className="mb-2">Live Preview</h3>
              <div style={{fontFamily:"'Merriweather',serif",fontSize:52,fontWeight:700,color:overall>=70?'var(--success)':overall>=50?'var(--navy)':'var(--danger)',marginBottom:8}}>{Math.round(overall)}</div>
              <div className="text-muted">Overall Score / 100</div>
              <div className="grid-3 mt-3" style={{gap:8}}>
                {[{l:'Incubation',v:Math.min(99,overall*1.05)},{l:'Readiness',v:overall*.9},{l:'Funding',v:overall*.85}].map(s=>(
                  <div key={s.l} style={{background:'var(--bg)',borderRadius:'var(--radius)',padding:'10px 8px',textAlign:'center'}}><div style={{fontWeight:700,fontSize:18,color:'var(--navy)'}}>{Math.round(s.v)}</div><div className="text-muted text-small">{s.l}</div></div>
                ))}
              </div>
            </div>
            <div className="card">
              <h3 className="mb-3">Radar Analysis</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)"/>
                  <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:'var(--text-3)'}}/>
                  <PolarRadiusAxis angle={90} domain={[0,10]} tick={{fontSize:10}}/>
                  <Radar name="Score" dataKey="value" stroke="var(--navy)" fill="var(--navy)" fillOpacity={.2} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {assessments.length>0&&(
              <div className="card mt-4">
                <h3 className="mb-3">Previous Assessments</h3>
                {assessments.slice(0,3).map(a=>(
                  <div key={a.id} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                    <div className="flex justify-between"><span style={{fontWeight:600}}>Score: {Math.round(a.overall_score)}/100</span><span className="text-muted text-small">{a.assessed_at?.slice(0,10)}</span></div>
                    {a.evaluator_name&&<div className="text-muted text-small">by {a.evaluator_name}</div>}
                    {a.remarks&&<p className="text-small text-muted mt-1">{a.remarks?.slice(0,100)}...</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <Alert type="success">Assessment submitted and recorded. Founders have been notified.</Alert>
          <div className="grid-2 mt-4">
            <div className="card">
              <h2 className="mb-4">Assessment Report</h2>
              <div className="grid-3 mb-4" style={{gap:12}}>
                {[{l:'Overall',v:Math.round(result?.overall_score||overall)},{l:'Incubation Score',v:Math.round(result?.incubation_score||0)},{l:'Readiness',v:Math.round(result?.readiness_score||0)},{l:'Funding Score',v:Math.round(result?.funding_score||0)}].map(s=>(
                  <div key={s.l} style={{background:'var(--bg)',borderRadius:'var(--radius)',padding:14,textAlign:'center'}}><div style={{fontFamily:"'Merriweather',serif",fontSize:28,fontWeight:700,color:'var(--navy)'}}>{s.v}</div><div className="text-muted text-small">{s.l}</div></div>
                ))}
              </div>
              {PARAMS.map(p=>(
                <div key={p.key} className="mb-3">
                  <div className="flex justify-between text-small mb-1"><span style={{fontWeight:600}}>{p.icon} {p.label}</span><span style={{fontWeight:700}}>{scores[p.key]}/10</span></div>
                  <ProgressBar value={scores[p.key]*10} color={scores[p.key]>=7?'green':'navy'}/>
                </div>
              ))}
              <div className="alert alert-info mt-3"><span>🏛️</span><div><strong>Verdict:</strong> {overall>=65?'Recommended for Incubation. Apply for the VIC Accelerator Program.':'Conditional — Improvement required in low-scoring parameters before incubation.'}</div></div>
              <button className="btn btn-secondary w-full mt-3" onClick={()=>{setSubmitted(false);setResult(null)}}>New Assessment</button>
            </div>
            <div className="card">
              <h3 className="mb-3">Radar Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)"/>
                  <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:'var(--text-3)'}}/>
                  <PolarRadiusAxis angle={90} domain={[0,10]} tick={{fontSize:10}}/>
                  <Radar name="Score" dataKey="value" stroke="var(--navy)" fill="var(--navy)" fillOpacity={.2} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// PROGRAMS
// ══════════════════════════════════════════════════════════
export function Programs() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const { show, ToastContainer } = useToast()

  const load = () => api.get('/programs').then(r=>setPrograms(r.data)).finally(()=>setLoading(false))
  useEffect(()=>{load()},[])

  const apply = async (id) => {
    try { await api.post(`/programs/${id}/apply`); show('Application submitted for review!','success'); load() }
    catch(e) { show(e.error||'Error','danger') }
  }

  const typeColor = {'Pre-Incubation':'navy','Incubation':'navy','Acceleration':'gold','Fellowship':'green','Innovation Challenge':'amber','Venture Studio':'gray'}

  if (loading) return <AppLayout pageTitle="Programs"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Programs & Cohorts">
      <ToastContainer/>
      <PageHeader title="Programs & Cohorts" subtitle="Structured programs for every stage of your startup journey"/>
      <div className="grid-auto">
        {programs.map(p=>(
          <div key={p.id} className="card" style={{borderTop:`4px solid var(--navy)`}}>
            <div className="flex justify-between mb-3"><span className={`badge badge-${typeColor[p.program_type]||'gray'}`}>{p.program_type}</span><Badge text={p.status}/></div>
            <h3 style={{marginBottom:6}}>{p.name}</h3>
            <p className="text-muted text-small mb-3" style={{lineHeight:1.5}}>{p.description}</p>
            <div className="grid-2 mb-3" style={{gap:8}}>
              {[{l:'Duration',v:`${p.duration_months} months`},{l:'Cohort Size',v:`${p.cohort_size} startups`},{l:'Current Cohort',v:`#${p.current_cohort}`},{l:'Start Date',v:p.start_date||'TBA'}].map(d=>(
                <div key={d.l} style={{background:'var(--bg)',borderRadius:'var(--radius)',padding:'8px 10px'}}><div className="text-muted text-small">{d.l}</div><div style={{fontWeight:600,fontSize:12,marginTop:2}}>{d.v}</div></div>
              ))}
            </div>
            {p.benefits&&<div className="text-small mb-3"><strong>Benefits:</strong><br/><span className="text-muted">{p.benefits}</span></div>}
            {p.eligibility&&<div className="text-small mb-3"><strong>Eligibility:</strong><br/><span className="text-muted">{p.eligibility}</span></div>}
            <button className="btn btn-sm w-full" onClick={()=>apply(p.id)} style={{background: p.enrollment_status==='Enrolled'?'var(--success)': p.enrollment_status==='Applied'?'var(--gold)':'var(--navy)', color:'#fff', border:'none'}}>
              {p.enrollment_status==='Enrolled'?'✓ Enrolled':p.enrollment_status==='Applied'?'⏳ Applied':'Apply Now'}
            </button>
          </div>
        ))}
        {programs.length===0&&<EmptyState icon="🏛️" title="No programs available" text="Check back soon for new program announcements"/>}
      </div>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// RESOURCES
// ══════════════════════════════════════════════════════════
export function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const { show, ToastContainer } = useToast()

  useEffect(()=>{ api.get(`/resources?category=${filter}&q=${search}`).then(r=>setResources(r.data)).finally(()=>setLoading(false)) },[filter,search])

  const download = async (id,name) => {
    await api.post(`/resources/${id}/download`)
    show(`Downloading "${name}"…`,'success')
  }

  const cats = [...new Set(resources.map(r=>r.category))]
  const fmtIcon = {DOCX:'📄',PPTX:'📊',XLSX:'💹',PDF:'📋',default:'📁'}

  if (loading) return <AppLayout pageTitle="Resources"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Resource Library">
      <ToastContainer/>
      <PageHeader title="Resource Library" subtitle={`${resources.length} templates, guides, and tools`}
        actions={<><SearchBar value={search} onChange={setSearch} placeholder="Search resources..."/><select className="form-control" style={{width:160}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All Categories</option>{cats.map(c=><option key={c}>{c}</option>)}</select></>}/>
      <div className="grid-auto">
        {resources.map(r=>(
          <div key={r.id} className="card">
            <div className="flex gap-3 items-start mb-3">
              <div style={{width:44,height:44,background:'var(--navy-light)',borderRadius:'var(--radius)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{fmtIcon[r.file_format]||fmtIcon.default}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{r.name}</div>
                <div className="flex gap-1"><span className="badge badge-navy">{r.category}</span><span className="badge badge-gray">{r.file_format}</span></div>
              </div>
            </div>
            {r.description&&<p className="text-muted text-small mb-3" style={{lineHeight:1.4}}>{r.description}</p>}
            <div className="flex justify-between items-center mb-3">
              <span className="text-small text-muted">📥 {r.download_count?.toLocaleString()} downloads</span>
              <span className="text-small text-muted">{r.file_size}</span>
            </div>
            <button className="btn btn-secondary btn-sm w-full" onClick={()=>download(r.id,r.name)}>⬇ Download Free</button>
          </div>
        ))}
        {resources.length===0&&<EmptyState icon="📁" title="No resources found"/>}
      </div>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// STARTUP LIST (Admin / Evaluator / Investor view)
// ══════════════════════════════════════════════════════════
export function StartupList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [stage, setStage] = useState('')
  const [selected, setSelected] = useState(null)
  const { show, ToastContainer } = useToast()

  const load = () => api.get(`/startups?q=${search}&status=${status}&stage=${stage}`).then(r=>setStartups(r.data)).finally(()=>setLoading(false))
  useEffect(()=>{load()},[search,status,stage])

  const updateStatus = async (id, newStatus) => {
    try { await api.put(`/startups/${id}/status`,{status:newStatus}); show('Status updated','success'); load(); setSelected(null) }
    catch(e) { show(e.error||'Error','danger') }
  }

  const viewDetails = (s) => { api.get(`/startups/${s.id}`).then(r=>setSelected(r.data)).catch(()=>setSelected(s)) }

  if (loading) return <AppLayout pageTitle="Startups"><Spinner/></AppLayout>
  return (
    <AppLayout pageTitle="Startup Management">
      <ToastContainer/>
      <PageHeader title="Startup Directory" subtitle={`${startups.length} startups in the system`}
        actions={<><SearchBar value={search} onChange={setSearch} placeholder="Search startups..."/><select className="form-control" style={{width:140}} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All Status</option>{['Pending','Under Review','Active','Graduated','Rejected'].map(s=><option key={s}>{s}</option>)}</select><select className="form-control" style={{width:140}} value={stage} onChange={e=>setStage(e.target.value)}><option value="">All Stages</option>{['Idea','Prototype','MVP','Early Revenue','Growth'].map(s=><option key={s}>{s}</option>)}</select></>}/>
      <div className="table-wrap card">
        <table>
          <thead><tr><th>#</th><th>Startup</th><th>Founder</th><th>Sector</th><th>Stage</th><th>Status</th><th>Revenue</th><th>Funding</th><th>Actions</th></tr></thead>
          <tbody>
            {startups.length===0&&<tr><td colSpan={9}><EmptyState icon="🚀" title="No startups found" text="Try adjusting filters"/></td></tr>}
            {startups.map((s,i)=>(
              <tr key={s.id}>
                <td className="text-muted">{i+1}</td>
                <td style={{fontWeight:700}}>{s.name}</td>
                <td>{s.founder_name}</td>
                <td>{s.sector}</td>
                <td><span className="badge badge-navy">{s.stage}</span></td>
                <td><Badge text={s.status}/></td>
                <td>{s.monthly_revenue?fmt(s.monthly_revenue):'-'}</td>
                <td>{s.total_funding?fmt(s.total_funding):'-'}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={()=>viewDetails(s)}>View</button>
                    {['admin','institutional_head'].includes(user?.role)&&s.status==='Pending'&&(
                      <><button className="btn btn-success btn-sm" onClick={()=>updateStatus(s.id,'Active')}>✓</button><button className="btn btn-danger btn-sm" onClick={()=>updateStatus(s.id,'Rejected')}>✗</button></>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?.name||''} size="lg">
        {selected&&(<div>
          <div className="flex gap-2 mb-4"><Badge text={selected.status}/><span className="badge badge-navy">{selected.stage}</span>{selected.sector&&<span className="badge badge-gray">{selected.sector}</span>}</div>
          {selected.tagline&&<p className="text-muted mb-3" style={{fontStyle:'italic'}}>{selected.tagline}</p>}
          {selected.description&&<p style={{lineHeight:1.7,marginBottom:16,fontSize:13}}>{selected.description}</p>}
          <div className="grid-3 mb-4" style={{gap:10}}>
            {[{l:'Revenue',v:fmt(selected.monthly_revenue)},{l:'Funding',v:fmt(selected.total_funding)},{l:'Customers',v:selected.customers},{l:'Team',v:selected.team_size},{l:'Founded',v:selected.founded_year||'N/A'},{l:'Cohort',v:`#${selected.cohort||1}`}].map(d=>(
              <div key={d.l} style={{background:'var(--bg)',borderRadius:'var(--radius)',padding:'10px 12px'}}><div className="text-muted text-small">{d.l}</div><div style={{fontWeight:700,marginTop:3}}>{d.v||'—'}</div></div>
            ))}
          </div>
          {selected.milestones?.length>0&&(<div className="mb-4"><h4 className="mb-2">Milestones</h4>{selected.milestones.map(m=><div key={m.id} className="flex justify-between" style={{padding:'6px 0',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:13}}>{m.is_completed?'✅':'🔷'} {m.title}</span><span className="text-muted text-small">{m.progress}%</span></div>)}</div>)}
          {['admin','institutional_head'].includes(user?.role)&&(
            <div className="flex gap-2 mt-2">
              <button className="btn btn-success btn-sm" onClick={()=>updateStatus(selected.id,'Active')}>Approve</button>
              <button className="btn btn-primary btn-sm" onClick={()=>updateStatus(selected.id,'Graduated')}>Graduate</button>
              <button className="btn btn-danger btn-sm" onClick={()=>updateStatus(selected.id,'Rejected')}>Reject</button>
            </div>
          )}
        </div>)}
      </Modal>
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════
export function Admin() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(()=>{ api.get('/admin/stats').then(r=>setStats(r.data)).finally(()=>setLoading(false)) },[])

  if (loading) return <AppLayout pageTitle="Admin"><Spinner/></AppLayout>
  const s = stats || {}
  const COLORS = ['#1B3A6B','#2E5FA3','#B8860B','#006644','#AE2A19','#6B3A8B']

  return (
    <AppLayout pageTitle="Administration">
      <PageHeader title="Administration Dashboard" subtitle="VIC Platform — Complete operational overview"/>
      <Tabs tabs={[{id:'overview',label:'Overview'},{id:'users',label:'Platform Users'},{id:'logs',label:'Audit Logs'}]} active={tab} onChange={tab}/>
      {tab==='overview'&&(<>
        <div className="grid-4 mb-4">
          <StatCard label="Total Startups" value={s.startups?.total||0} sub={`${s.startups?.active||0} active`} icon="🚀" accent="#1B3A6B"/>
          <StatCard label="Graduated" value={s.startups?.graduated||0} icon="🎓" accent="#006644"/>
          <StatCard label="Mentoring Sessions" value={s.mentors?.sessions||0} icon="📅" accent="#2E5FA3"/>
          <StatCard label="Jobs Created" value={s.jobs?.total||0} icon="🏢" accent="#B8860B"/>
        </div>
        <div className="grid-4 mb-4">
          <StatCard label="Total Funding" value={`₹${((s.financial?.totalFunding||0)/10000000).toFixed(1)}Cr`} icon="💰" accent="#006644"/>
          <StatCard label="Grants Approved" value={`₹${((s.financial?.approvedGrants||0)/100000).toFixed(0)}L`} icon="🏦" accent="#B8860B"/>
          <StatCard label="Patents Filed" value={s.ip?.total||0} icon="💡" accent="#6B3A8B"/>
          <StatCard label="Technologies" value={s.technologies?.total||0} icon="🔬" accent="#2E5FA3"/>
        </div>
        <div className="grid-2 mb-4">
          <Card title="Startup Sector Distribution">
            {(s.sectors||[]).length>0?(
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={s.sectors} dataKey="count" nameKey="sector" cx="40%" cy="50%" outerRadius={90} innerRadius={50}>
                    {(s.sectors||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            ):<EmptyState icon="📊" title="No data"/>}
          </Card>
          <Card title="Stage Distribution">
            {(s.stages||[]).length>0?(
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={s.stages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis type="number" tick={{fontSize:11}} axisLine={false}/>
                  <YAxis dataKey="stage" type="category" tick={{fontSize:11}} axisLine={false} width={90}/>
                  <Tooltip/>
                  <Bar dataKey="count" fill="var(--navy)" radius={[0,4,4,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ):<EmptyState icon="📊" title="No data"/>}
          </Card>
        </div>
        <div className="grid-3">
          <StatCard label="Pending Applications" value={s.startups?.pending||0} icon="⏳" accent="var(--warning)"/>
          <StatCard label="Open Problems" value={s.problems?.open||0} icon="🎯" accent="var(--gold)"/>
          <StatCard label="Pending Services" value={s.services?.pending||0} icon="🛠️" accent="var(--danger)"/>
        </div>
      </>)}
    </AppLayout>
  )
}

// ══════════════════════════════════════════════════════════
// DATA ROOM
// ══════════════════════════════════════════════════════════
export function DataRoom() {
  const { user } = useAuth()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({category:'Legal',title:'',file_name:'',file_size:''})
  const [startupId, setStartupId] = useState(null)
  const { show, ToastContainer } = useToast()

  useEffect(()=>{
    api.get('/dashboard').then(r=>{
      const sid = r.data?.startup?.id
      if(sid){ setStartupId(sid); api.get(`/dataroom/${sid}`).then(r2=>setRoom(r2.data)).catch(()=>setRoom(null)).finally(()=>setLoading(false)) }
      else setLoading(false)
    }).catch(()=>setLoading(false))
  },[])

  const addDoc = async () => {
    try { await api.post(`/dataroom/${startupId}/documents`,form); show('Document added!','success'); setShowAdd(false); api.get(`/dataroom/${startupId}`).then(r=>setRoom(r.data)) }
    catch(e) { show(e.error||'Error','danger') }
  }

  const catIcon = {Legal:'⚖️',Financial:'💹',Team:'👥',IP:'💡',Product:'🚀',Market:'📊'}

  if (loading) return <AppLayout pageTitle="Data Room"><Spinner/></AppLayout>
  if (!room) return <AppLayout pageTitle="Data Room"><EmptyState icon="🗄️" title="No data room found" text="Register your startup to access the data room"/></AppLayout>

  const docs = room.documents || []
  const cats = ['Legal','Financial','Team','IP','Product','Market']

  return (
    <AppLayout pageTitle="Data Room">
      <ToastContainer/>
      <PageHeader title="Data Room" subtitle="Secure document repository for due diligence and investor access"
        actions={<button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}>+ Upload Document</button>}/>
      <Alert type="info" className="mb-4">🔒 Your data room is private. Share access with investors on a case-by-case basis.</Alert>
      <div className="grid-2 mb-4">
        <StatCard label="Total Documents" value={docs.length} icon="📄" accent="var(--navy)"/>
        <StatCard label="Categories Covered" value={cats.filter(c=>docs.some(d=>d.category===c)).length} icon="📂" accent="var(--navy-mid)"/>
      </div>
      {cats.map(cat=>{
        const catDocs = docs.filter(d=>d.category===cat)
        return (
          <div key={cat} className="card mb-3">
            <div className="card-header"><span className="card-title">{catIcon[cat]} {cat}</span><span className="badge badge-navy">{catDocs.length} documents</span></div>
            {catDocs.length===0?<p className="text-muted text-small">No documents in this category</p>:(
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{borderBottom:'1px solid var(--border)'}}><th style={{textAlign:'left',padding:'6px 0',color:'var(--text-3)',fontSize:11}}>Document</th><th style={{textAlign:'left',padding:'6px 0',color:'var(--text-3)',fontSize:11}}>Uploaded By</th><th style={{textAlign:'left',padding:'6px 0',color:'var(--text-3)',fontSize:11}}>Size</th><th style={{textAlign:'left',padding:'6px 0',color:'var(--text-3)',fontSize:11}}>Views</th></tr></thead>
                <tbody>{catDocs.map(d=><tr key={d.id} style={{borderBottom:'1px solid var(--border)'}}><td style={{padding:'8px 0',fontWeight:600}}>{d.title}</td><td style={{padding:'8px 0',color:'var(--text-3)'}}>{d.uploaded_by_name}</td><td style={{padding:'8px 0',color:'var(--text-3)'}}>{d.file_size||'—'}</td><td style={{padding:'8px 0',color:'var(--text-3)'}}>{d.view_count}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        )
      })}
      <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Upload Document"
        footer={<><button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={addDoc}>Add Document</button></>}>
        <FormGroup label="Category" required><Select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}</Select></FormGroup>
        <FormGroup label="Document Title" required><input className="form-control" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Certificate of Incorporation"/></FormGroup>
        <div className="form-row">
          <FormGroup label="File Name"><input className="form-control" value={form.file_name} onChange={e=>setForm({...form,file_name:e.target.value})} placeholder="document.pdf"/></FormGroup>
          <FormGroup label="File Size"><input className="form-control" value={form.file_size} onChange={e=>setForm({...form,file_size:e.target.value})} placeholder="e.g. 1.2 MB"/></FormGroup>
        </div>
        <Alert type="info">Note: File upload coming in v2. Add metadata now and attach files via the VIC admin portal.</Alert>
      </Modal>
    </AppLayout>
  )
}

export default Mentors
