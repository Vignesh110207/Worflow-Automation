import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, Play, CheckCircle, AlertCircle, Clock, Users, Activity, ArrowRight, Shield, Code2, Zap, Terminal, BarChart2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { adminApi, workflowApi, executionApi } from '../services/api'
import { Card, StatCard, Badge, Spinner } from '../components/common'
import { formatDistanceToNow } from 'date-fns'

const roleConfig = {
  admin:     { color:'#EF4444', bg:'rgba(239,68,68,0.08)',  icon:<Shield size={14}/>,  accent:'#EF4444' },
  developer: { color:'#6366F1', bg:'rgba(99,102,241,0.08)', icon:<Code2 size={14}/>,  accent:'#6366F1' },
  user:      { color:'#22C55E', bg:'rgba(34,197,94,0.08)',  icon:<Zap size={14}/>,    accent:'#22C55E' },
}

export default function Dashboard() {
  const { user, isAdmin, isDev } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]       = useState(null)
  const [workflows, setWorkflows] = useState([])
  const [executions, setExecs]  = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const loads = [
      workflowApi.list(0,6).then(r=>setWorkflows(r.data.data?.content||[])),
      executionApi.list(0,6).then(r=>setExecs(r.data.data?.content||[])),
    ]
    if(isAdmin) loads.push(adminApi.stats().then(r=>setStats(r.data.data)))
    Promise.all(loads).finally(()=>setLoading(false))
  }, [isAdmin])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><Spinner size={36}/></div>

  const get = s => parseInt(stats?.execByStatus?.find(x=>x.status===s)?.count||0)
  const rc = roleConfig[user?.role]||roleConfig.user

  return (
    <div className="fade-up">

      {/* ── Hero Banner ── */}
      <div style={{
        borderRadius:20, padding:'28px 30px', marginBottom:24, position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, #FFD600 0%, #FFAB00 60%, #FF9800 100%)',
        boxShadow:'0 12px 40px rgba(255,214,0,0.45)',
      }}>
        {/* Floating circles decoration */}
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.12)', animation:'floatA 8s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:-60, right:80, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.08)', animation:'floatB 11s ease-in-out infinite' }} />
        <div style={{ position:'absolute', top:10, right:200, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.15)', animation:'floatC 7s ease-in-out infinite' }} />
        {/* Dot grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize:'22px 22px', pointerEvents:'none' }} />

        <div style={{ position:'relative' }}>
          {/* User identity */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(255,255,255,0.3)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'var(--grey-900)', border:'2px solid rgba(255,255,255,0.5)' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize:24, fontWeight:900, color:'var(--grey-900)', letterSpacing:-0.5, lineHeight:1.1 }}>
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                <span style={{ fontSize:12, color:'rgba(26,23,18,0.6)', display:'flex', alignItems:'center', gap:4, fontWeight:600 }}>
                  {rc.icon} {user?.role}
                </span>
                <span style={{ fontSize:11, color:'rgba(26,23,18,0.5)' }}>·</span>
                <span style={{ fontSize:12, color:'rgba(26,23,18,0.55)', fontWeight:500 }}>{user?.email}</span>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {isDev && (
              <button onClick={()=>navigate('/workflows/new')} style={{ padding:'9px 20px', background:'rgba(255,255,255,0.9)', border:'none', borderRadius:10, fontWeight:800, fontSize:13, color:'var(--grey-900)', cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:'inherit', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.9)';e.currentTarget.style.transform='translateY(0)'}}>
                <GitBranch size={14}/> New workflow
              </button>
            )}
            <button onClick={()=>navigate(isAdmin||isDev?'/executions':'/user/executions')} style={{ padding:'9px 20px', background:'rgba(26,23,18,0.12)', border:'none', borderRadius:10, fontWeight:700, fontSize:13, color:'var(--grey-900)', cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:'inherit', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,23,18,0.2)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(26,23,18,0.12)'}}>
              <Activity size={14}/> View executions <ArrowRight size={13}/>
            </button>
          </div>
        </div>
      </div>

      {/* ── Admin Stats ── */}
      {isAdmin && stats && (
        <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(148px,1fr))', gap:12, marginBottom:24 }}>
          <StatCard label="Total Users"  value={stats.users?.count||0}      icon={<Users size={17}/>}       color="#EF4444" bg="rgba(239,68,68,0.08)"   />
          <StatCard label="Workflows"    value={stats.workflows?.count||0}   icon={<GitBranch size={17}/>}   color="#6366F1" bg="rgba(99,102,241,0.08)"  />
          <StatCard label="Total Runs"   value={stats.executions?.count||0}  icon={<BarChart2 size={17}/>}   color="#94A3B8" bg="var(--grey-50)"         />
          <StatCard label="Completed"    value={get('completed')}            icon={<CheckCircle size={17}/>} color="#15803D" bg="rgba(34,197,94,0.08)"   />
          <StatCard label="Running"      value={get('in_progress')}          icon={<Clock size={17}/>}       color="#854D0E" bg="rgba(234,179,8,0.1)"    />
          <StatCard label="Failed"       value={get('failed')}               icon={<AlertCircle size={17}/>} color="#991B1B" bg="rgba(239,68,68,0.08)"   />
        </div>
      )}

      {/* ── Recent grids ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>

        {(isAdmin||isDev) && (
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:28,height:28,borderRadius:8,background:'rgba(255,214,0,0.15)',display:'flex',alignItems:'center',justifyContent:'center' }}><GitBranch size={14} color="var(--sun-deep)"/></span>
                Recent workflows
              </h3>
              <button onClick={()=>navigate('/workflows')} style={{ background:'none',border:'none',color:'var(--sun-deep)',cursor:'pointer',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:4,fontFamily:'inherit' }}>View all <ArrowRight size={12}/></button>
            </div>
            {workflows.length===0
              ? <p style={{ fontSize:12,color:'var(--grey-300)',padding:'16px 0',textAlign:'center' }}>No workflows yet</p>
              : workflows.map((wf,i) => (
                <div key={wf.id} onClick={()=>navigate(`/workflows/${wf.id}`)} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderTop:i>0?'1px solid var(--grey-50)':'none',cursor:'pointer',transition:'all 0.15s',borderRadius:6 }}
                  onMouseEnter={e=>{e.currentTarget.style.paddingLeft='4px'}}
                  onMouseLeave={e=>{e.currentTarget.style.paddingLeft='0'}}>
                  <div>
                    <p style={{ fontSize:13,fontWeight:700,color:'var(--grey-800,var(--grey-900))' }}>{wf.name}</p>
                    <p style={{ fontSize:11,color:'var(--grey-400)',marginTop:1 }}>{wf.stepCount||0} steps · {wf.triggerType}</p>
                  </div>
                  <Badge status={wf.isActive?'Active':'Inactive'} size="xs"/>
                </div>
              ))
            }
          </Card>
        )}

        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:14,fontWeight:800,display:'flex',alignItems:'center',gap:8 }}>
              <span style={{ width:28,height:28,borderRadius:8,background:'rgba(99,102,241,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}><Activity size={14} color="#6366F1"/></span>
              Recent executions
            </h3>
            <button onClick={()=>navigate(isAdmin||isDev?'/executions':'/user/executions')} style={{ background:'none',border:'none',color:'#6366F1',cursor:'pointer',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:4,fontFamily:'inherit' }}>View all <ArrowRight size={12}/></button>
          </div>
          {executions.length===0
            ? <p style={{ fontSize:12,color:'var(--grey-300)',padding:'16px 0',textAlign:'center' }}>No executions yet</p>
            : executions.map((ex,i) => (
              <div key={ex.id} onClick={()=>navigate(`/executions/${ex.id}`)} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderTop:i>0?'1px solid var(--grey-50)':'none',cursor:'pointer',transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.paddingLeft='4px'}}
                onMouseLeave={e=>{e.currentTarget.style.paddingLeft='0'}}>
                <div>
                  <p style={{ fontSize:13,fontWeight:700,color:'var(--grey-900)' }}>{ex.workflowName}</p>
                  <p style={{ fontSize:11,color:'var(--grey-400)',marginTop:1 }}>by {ex.triggeredByName} · {ex.startedAt?formatDistanceToNow(new Date(ex.startedAt),{addSuffix:true}):'—'}</p>
                </div>
                <Badge status={ex.status} size="xs"/>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  )
}
