import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Search, Terminal, User, Clock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { executionApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, PageHeader, Input, Button, Spinner, Pagination } from '../../components/common'
import { format, formatDistanceToNow } from 'date-fns'

const LEVEL_META = {
  info:    { bg:'#E0F2FE', color:'#0369A1', border:'#BAE6FD', dot:'#38BDF8'  },
  success: { bg:'#DCFCE7', color:'#15803D', border:'#BBF7D0', dot:'#22C55E'  },
  warn:    { bg:'#FEF9C3', color:'#854D0E', border:'#FEF08A', dot:'#EAB308'  },
  error:   { bg:'#FEE2E2', color:'#991B1B', border:'#FECACA', dot:'#EF4444'  },
}

export default function ExecutionLogs() {
  const { user } = useAuth()
  const [data, setData]         = useState({ content:[], totalElements:0, totalPages:0 })
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [search, setSearch]     = useState('')
  const [levelFilter, setLevel] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    executionApi.logs(page, 30)
      .then(r=>setData(r.data.data||{content:[],totalElements:0,totalPages:0}))
      .catch(e=>toast.error(e.message))
      .finally(()=>setLoading(false))
  }, [page])

  useEffect(()=>{load()},[load])
  useEffect(()=>{
    if(!autoRefresh) return
    const t = setInterval(load, 5000)
    return ()=>clearInterval(t)
  },[autoRefresh, load])

  const filtered = data.content.filter(l => {
    const ms = !search || l.message?.toLowerCase().includes(search.toLowerCase()) || l.workflowName?.toLowerCase().includes(search.toLowerCase()) || l.stepName?.toLowerCase().includes(search.toLowerCase())
    const ml = levelFilter==='all' || l.logLevel===levelFilter
    return ms && ml
  })

  const counts = data.content.reduce((a,l)=>{a[l.logLevel]=(a[l.logLevel]||0)+1;return a},{})
  const roleColor = { admin:'#EF4444', developer:'#6366F1', user:'#22C55E' }

  return (
    <div className="fade-up">
      {/* Header row with viewer identity */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, letterSpacing:-0.4, color:'var(--grey-900)', marginBottom:4 }}>Execution Logs</h1>
          <p style={{ fontSize:13, color:'var(--grey-400)' }}>{data.totalElements} total log entries</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {/* Viewer pill */}
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 14px', background:'#fff', border:'1.5px solid var(--grey-100)', borderRadius:50, boxShadow:'0 2px 8px rgba(26,23,18,0.06)' }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:`${roleColor[user?.role]||'#6366F1'}18`, border:`2px solid ${roleColor[user?.role]||'#6366F1'}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:roleColor[user?.role]||'#6366F1' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize:12,fontWeight:700,color:'var(--grey-900)',lineHeight:1.2 }}>{user?.name}</p>
              <p style={{ fontSize:10,color:'var(--grey-400)',display:'flex',alignItems:'center',gap:3,lineHeight:1.2 }}><Mail size={8}/>{user?.email}</p>
            </div>
            <span style={{ fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:20,background:`${roleColor[user?.role]}18`,color:roleColor[user?.role],border:`1px solid ${roleColor[user?.role]}25`,textTransform:'capitalize' }}>{user?.role}</span>
          </div>

          <button onClick={()=>setAutoRefresh(v=>!v)} style={{ padding:'8px 14px', borderRadius:10, fontSize:12, fontWeight:700, background: autoRefresh?'#DCFCE7':'#fff', border: autoRefresh?'1.5px solid #BBF7D0':'1.5px solid var(--grey-200)', color: autoRefresh?'#15803D':'var(--grey-500)', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}>
            <div style={{ width:6,height:6,borderRadius:'50%',background:autoRefresh?'#22C55E':'var(--grey-300)',boxShadow:autoRefresh?'0 0 8px #22C55E':'none' }}/>
            {autoRefresh?'Live':'Live off'}
          </button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13}/>} onClick={load}>Refresh</Button>
        </div>
      </div>

      {/* Level filters */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        {['all','info','success','warn','error'].map(lv => {
          const m = lv==='all' ? null : LEVEL_META[lv]
          const count = lv==='all' ? data.content.length : (counts[lv]||0)
          const active = levelFilter===lv
          return (
            <button key={lv} onClick={()=>setLevel(lv)} style={{ padding:'5px 14px', borderRadius:30, fontSize:12, fontWeight:700, cursor:'pointer', background: active?(m?m.bg:'var(--grey-100)'):'transparent', border: active?`1.5px solid ${m?.border||'var(--grey-300)'}`:'1.5px solid var(--grey-200)', color: active?(m?m.color:'var(--grey-900)'):'var(--grey-400)', fontFamily:'inherit', transition:'all 0.15s', display:'flex', alignItems:'center', gap:6 }}>
              {m && <span style={{ width:6,height:6,borderRadius:'50%',background:m.dot }}/>}
              <span style={{ textTransform:'capitalize' }}>{lv}</span>
              <span style={{ opacity:0.6,fontWeight:500 }}>{count}</span>
            </button>
          )
        })}
        <div style={{ marginLeft:'auto' }}>
          <Input placeholder="Search logs…" value={search} onChange={e=>setSearch(e.target.value)} icon={<Search size={13}/>} containerStyle={{ maxWidth:260 }}/>
        </div>
      </div>

      {/* Log table */}
      <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid var(--grey-100)', overflow:'hidden', boxShadow:'0 2px 12px rgba(26,23,18,0.06)' }}>
        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'40px 150px 80px 1fr 140px', padding:'10px 16px', background:'var(--grey-50)', borderBottom:'1.5px solid var(--grey-100)' }}>
          {['#','Time','Level','Message','Workflow / Trigger'].map(h=>(
            <span key={h} style={{ fontSize:10,fontWeight:800,color:'var(--grey-400)',textTransform:'uppercase',letterSpacing:0.8 }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex',justifyContent:'center',padding:48 }}><Spinner size={28}/></div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:'center',padding:'56px 20px',color:'var(--grey-300)' }}>
            <Terminal size={36} style={{ marginBottom:12,opacity:0.3 }}/>
            <p style={{ fontSize:14,fontWeight:600 }}>No logs found</p>
          </div>
        ) : (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>
            {filtered.map((log,i) => {
              const lvl = LEVEL_META[log.logLevel]||LEVEL_META.info
              return (
                <div key={log.id||i} className="log-new" style={{ display:'grid', gridTemplateColumns:'40px 150px 80px 1fr 140px', padding:'9px 16px', borderBottom:'1px solid var(--grey-50)', transition:'background 0.1s', animationDelay:`${Math.min(i*15,300)}ms` }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--grey-50)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ fontSize:10,color:'var(--grey-300)',alignSelf:'center' }}>{page*30+i+1}</span>
                  <div style={{ alignSelf:'center' }}>
                    <p style={{ fontSize:10,color:'var(--grey-500)' }}>{log.createdAt?format(new Date(log.createdAt),'MMM d, HH:mm:ss'):'—'}</p>
                    <p style={{ fontSize:9,color:'var(--grey-300)',marginTop:1 }}>{log.createdAt?formatDistanceToNow(new Date(log.createdAt),{addSuffix:true}):''}</p>
                  </div>
                  <span style={{ alignSelf:'center' }}>
                    <span style={{ fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:10,background:lvl.bg,color:lvl.color,border:`1px solid ${lvl.border}`,fontFamily:'Outfit,sans-serif',letterSpacing:0.4 }}>{log.logLevel?.toUpperCase()}</span>
                  </span>
                  <div style={{ alignSelf:'center', overflow:'hidden' }}>
                    <p style={{ color:lvl.color,lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{log.message}</p>
                    {log.stepName && <p style={{ fontSize:9,color:'var(--grey-400)',fontFamily:'Outfit,sans-serif',marginTop:1 }}>Step: {log.stepName}</p>}
                  </div>
                  <div style={{ alignSelf:'center' }}>
                    {log.workflowName && <p style={{ fontSize:10,color:'var(--grey-700)',fontFamily:'Outfit,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600 }}>{log.workflowName}</p>}
                    {log.triggeredByName && <p style={{ fontSize:9,color:'var(--grey-400)',fontFamily:'Outfit,sans-serif',marginTop:1,display:'flex',alignItems:'center',gap:3 }}><User size={8}/>{log.triggeredByName}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={30} onPageChange={setPage}/>
    </div>
  )
}
