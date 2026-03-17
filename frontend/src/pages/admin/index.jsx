import React, { useEffect, useState, useCallback } from 'react'
import { Users, ShieldCheck, Activity, GitBranch, Search, Edit2, Trash2, RefreshCw, FileText, Shield, Code2, Zap, Mail, Clock, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, StatCard, Badge, Button, Input, Select, Modal, PageHeader, DataTable, Pagination, ConfirmDialog, IconBtn, Spinner } from '../../components/common'
import { formatDistanceToNow, format } from 'date-fns'

/* ── Admin Stats ── */
export function AdminStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { adminApi.stats().then(r=>setStats(r.data.data)).catch(e=>toast.error(e.message)).finally(()=>setLoading(false)) }, [])
  if(loading) return <div style={{ display:'flex',justifyContent:'center',paddingTop:60 }}><Spinner size={32}/></div>
  if(!stats) return null
  const get = s => parseInt(stats.execByStatus?.find(x=>x.status===s)?.count||0)
  return (
    <div className="fade-up">
      <PageHeader title="System stats" subtitle="Overview of all platform resources"/>
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
        <StatCard label="Total users"  value={stats.users?.count||0}      icon={<Users size={17}/>}       color="#EF4444" bg="rgba(239,68,68,0.08)"   />
        <StatCard label="Active users" value={stats.users?.active||0}     icon={<ShieldCheck size={17}/>} color="#22C55E" bg="rgba(34,197,94,0.08)"   />
        <StatCard label="Workflows"    value={stats.workflows?.count||0}  icon={<GitBranch size={17}/>}   color="#6366F1" bg="rgba(99,102,241,0.08)"  />
        <StatCard label="Active wf"    value={stats.workflows?.active||0} icon={<Activity size={17}/>}    color="#F59E0B" bg="rgba(245,158,11,0.1)"   />
        <StatCard label="Total runs"   value={stats.executions?.count||0} icon={<BarChart2 size={17}/>}   color="#94A3B8" bg="var(--grey-50)"         />
        <StatCard label="Completed"    value={get('completed')}           icon={<Activity size={17}/>}    color="#15803D" bg="rgba(34,197,94,0.08)"   />
        <StatCard label="Failed"       value={get('failed')}              icon={<Activity size={17}/>}    color="#991B1B" bg="rgba(239,68,68,0.08)"   />
        <StatCard label="Running"      value={get('in_progress')}         icon={<Activity size={17}/>}    color="#854D0E" bg="rgba(234,179,8,0.1)"    />
      </div>
      <Card>
        <h3 style={{ fontSize:14,fontWeight:800,marginBottom:16,display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ width:28,height:28,borderRadius:8,background:'rgba(99,102,241,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}><Activity size={14} color="#6366F1"/></span>
          Recent executions
        </h3>
        {(stats.recentExecutions||[]).map((ex,i)=>(
          <div key={ex.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderTop:i>0?'1px solid var(--grey-50)':'none' }}>
            <div>
              <p style={{ fontSize:13,fontWeight:700 }}>{ex.workflowName}</p>
              <p style={{ fontSize:11,color:'var(--grey-400)',marginTop:1 }}>by {ex.triggeredByName} · {ex.startedAt?formatDistanceToNow(new Date(ex.startedAt),{addSuffix:true}):'—'}</p>
            </div>
            <Badge status={ex.status} size="xs"/>
          </div>
        ))}
      </Card>
    </div>
  )
}

/* ── User Management ── */
export function UserManagement() {
  const { user: me } = useAuth()
  const [data,setData]           = useState({content:[],totalElements:0,totalPages:0})
  const [loading,setLoading]     = useState(true)
  const [page,setPage]           = useState(0)
  const [search,setSearch]       = useState('')
  const [editTarget,setEdit]     = useState(null)
  const [editForm,setEditForm]   = useState({})
  const [editLoading,setEditLoad]= useState(false)
  const [delTarget,setDel]       = useState(null)
  const [delLoading,setDelLoad]  = useState(false)

  const load = useCallback(()=>{
    setLoading(true)
    adminApi.users(page,10,search).then(r=>setData(r.data.data||{content:[],totalElements:0,totalPages:0})).catch(e=>toast.error(e.message)).finally(()=>setLoading(false))
  },[page,search])
  useEffect(()=>{load()},[load])

  const handleEdit = async()=>{
    setEditLoad(true)
    try{await adminApi.updateUser(editTarget.id,editForm);toast.success('User updated');setEdit(null);load()}
    catch(e){toast.error(e.message)} finally{setEditLoad(false)}
  }
  const handleDel = async()=>{
    setDelLoad(true)
    try{await adminApi.deleteUser(delTarget.id);toast.success('User deleted');setDel(null);load()}
    catch(e){toast.error(e.message)} finally{setDelLoad(false)}
  }

  const rc = {admin:'#EF4444',developer:'#6366F1',user:'#22C55E'}
  const ri = {admin:<Shield size={10}/>,developer:<Code2 size={10}/>,user:<Zap size={10}/>}

  const columns = [
    { key:'name', label:'User', render:(v,row)=>(
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ width:36,height:36,borderRadius:'50%',background:`${rc[row.role]||'#6366F1'}15`,border:`2px solid ${rc[row.role]||'#6366F1'}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:rc[row.role]||'#6366F1',flexShrink:0 }}>{v?.charAt(0)?.toUpperCase()}</div>
        <div>
          <p style={{ fontSize:13,fontWeight:700,color:'var(--grey-900)',display:'flex',alignItems:'center',gap:6 }}>
            {v}
            {row.id===me?.id && <span style={{ fontSize:9,padding:'1px 6px',borderRadius:20,background:'rgba(255,214,0,0.2)',color:'#A07800',border:'1px solid rgba(255,214,0,0.4)',fontWeight:800 }}>You</span>}
          </p>
          <p style={{ fontSize:11,color:'var(--grey-400)',display:'flex',alignItems:'center',gap:3 }}><Mail size={9}/>{row.email}</p>
        </div>
      </div>
    )},
    { key:'role', label:'Role', width:130, render:v=>(
      <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,background:`${rc[v]||'#6366F1'}12`,color:rc[v]||'#6366F1',border:`1.5px solid ${rc[v]||'#6366F1'}22`,fontSize:11,fontWeight:800,textTransform:'capitalize' }}>
        {ri[v]}{v}
      </span>
    )},
    { key:'isActive', label:'Status', width:90, render:v=><Badge status={v?'Active':'Inactive'} size="xs"/> },
    { key:'lastLogin', label:'Last login', width:130, render:v=><span style={{ fontSize:11,color:'var(--grey-400)',display:'flex',alignItems:'center',gap:4 }}><Clock size={9}/>{v?formatDistanceToNow(new Date(v),{addSuffix:true}):'Never'}</span> },
    { key:'createdAt', label:'Joined', width:110, render:v=><span style={{ fontSize:11,color:'var(--grey-400)' }}>{v?format(new Date(v),'MMM d, yyyy'):'—'}</span> },
    { key:'_a', label:'', width:80, render:(_,row)=>(
      <div style={{ display:'flex',gap:4 }} onClick={e=>e.stopPropagation()}>
        <IconBtn title="Edit" variant="accent" size={28} icon={<Edit2 size={12}/>} onClick={()=>{setEdit(row);setEditForm({name:row.name,role:row.role,is_active:row.isActive})}}/>
        <IconBtn title="Delete" variant="danger" size={28} icon={<Trash2 size={12}/>} onClick={()=>setDel(row)} disabled={row.id===me?.id}/>
      </div>
    )},
  ]

  return (
    <div className="fade-up">
      <PageHeader title="User management" subtitle={`${data.totalElements} registered users`}/>
      <div style={{ marginBottom:14 }}><Input placeholder="Search users…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} icon={<Search size={14}/>} containerStyle={{ maxWidth:280 }}/></div>
      <DataTable columns={columns} data={data.content} loading={loading}/>
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPageChange={setPage}/>
      <Modal open={!!editTarget} onClose={()=>setEdit(null)} title="Edit user" subtitle={editTarget?.email} width={400}>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <Input label="Name" value={editForm.name||''} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}/>
          <Select label="Role" value={editForm.role||'user'} options={[{value:'user',label:'User — execute workflows'},{value:'developer',label:'Developer — build & manage'},{value:'admin',label:'Admin — full access'}]} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}/>
          <Select label="Status" value={String(editForm.isActive||editForm.is_active)} options={[{value:'true',label:'Active'},{value:'false',label:'Inactive'}]} onChange={e=>setEditForm(f=>({...f,is_active:e.target.value==='true'}))}/>
          <div style={{ display:'flex',gap:10,marginTop:4 }}>
            <Button loading={editLoading} icon={<Edit2 size={13}/>} onClick={handleEdit}>Save changes</Button>
            <Button variant="secondary" onClick={()=>setEdit(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!delTarget} onClose={()=>setDel(null)} onConfirm={handleDel} loading={delLoading} title="Delete user" message={`Permanently delete "${delTarget?.name}" (${delTarget?.email})?`}/>
    </div>
  )
}

/* ── Audit Logs ── */
export function AuditLogs() {
  const { user: me } = useAuth()
  const [data,setData]     = useState({content:[],totalElements:0,totalPages:0})
  const [loading,setLoad]  = useState(true)
  const [page,setPage]     = useState(0)
  const [search,setSearch] = useState('')

  const load = useCallback(()=>{
    setLoad(true)
    adminApi.auditLogs(page,20,search).then(r=>setData(r.data.data||{content:[],totalElements:0,totalPages:0})).catch(e=>toast.error(e.message)).finally(()=>setLoad(false))
  },[page,search])
  useEffect(()=>{load()},[load])

  const am = a => {
    if(a?.includes('CREATE'))  return {bg:'#DCFCE7',color:'#15803D',border:'#BBF7D0',dot:'#22C55E'}
    if(a?.includes('DELETE'))  return {bg:'#FEE2E2',color:'#991B1B',border:'#FECACA',dot:'#EF4444'}
    if(a?.includes('UPDATE'))  return {bg:'#FEF9C3',color:'#854D0E',border:'#FEF08A',dot:'#EAB308'}
    if(a?.includes('EXECUTE')) return {bg:'#E0F2FE',color:'#0369A1',border:'#BAE6FD',dot:'#38BDF8'}
    if(a?.includes('LOGIN'))   return {bg:'rgba(255,214,0,0.12)',color:'#A07800',border:'rgba(255,214,0,0.3)',dot:'#FFD600'}
    return {bg:'var(--grey-50)',color:'var(--grey-400)',border:'var(--grey-200)',dot:'var(--grey-300)'}
  }
  const rc = {admin:'#EF4444',developer:'#6366F1',user:'#22C55E'}

  const columns = [
    { key:'createdAt', label:'Time', width:155, render:v=>(
      <div>
        <p style={{ fontSize:11,color:'var(--grey-700)',fontFamily:'var(--font-mono)' }}>{v?format(new Date(v),'MMM d, HH:mm:ss'):'—'}</p>
        <p style={{ fontSize:9,color:'var(--grey-300)',marginTop:1 }}>{v?formatDistanceToNow(new Date(v),{addSuffix:true}):''}</p>
      </div>
    )},
    { key:'user_name', label:'Login User', width:190, render:(v,row)=>(
      <div style={{ display:'flex',alignItems:'center',gap:9 }}>
        <div style={{ width:30,height:30,borderRadius:'50%',background:`${rc[row.user_role]||'#6366F1'}12`,border:`1.5px solid ${rc[row.user_role]||'#6366F1'}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:rc[row.user_role]||'#6366F1',flexShrink:0 }}>{v?.charAt(0)?.toUpperCase()||'?'}</div>
        <div>
          <p style={{ fontSize:12,fontWeight:700,color:'var(--grey-900)',display:'flex',alignItems:'center',gap:5 }}>
            {v||'—'}
            {row.user_name===me?.name && <span style={{ fontSize:8,padding:'1px 5px',borderRadius:10,background:'rgba(255,214,0,0.2)',color:'#A07800',border:'1px solid rgba(255,214,0,0.35)',fontWeight:800 }}>You</span>}
          </p>
          <p style={{ fontSize:10,color:'var(--grey-400)',display:'flex',alignItems:'center',gap:3 }}><Mail size={8}/>{row.user_email||'—'}</p>
          {row.user_role && <p style={{ fontSize:9,color:rc[row.user_role]||'var(--grey-400)',fontWeight:800,marginTop:1,textTransform:'capitalize' }}>{row.user_role}</p>}
        </div>
      </div>
    )},
    { key:'action', label:'Action', width:155, render:v=>{
      const m=am(v)
      return <span style={{ fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:20,background:m.bg,color:m.color,border:`1.5px solid ${m.border}`,display:'inline-flex',alignItems:'center',gap:5 }}><span style={{ width:5,height:5,borderRadius:'50%',background:m.dot }}/>{v}</span>
    }},
    { key:'resource_type', label:'Resource', width:100, render:v=><span style={{ fontSize:11,color:'var(--grey-500)',textTransform:'capitalize' }}>{v||'—'}</span> },
    { key:'resource_name', label:'Target', render:v=><span style={{ fontSize:12,color:'var(--grey-700)',fontWeight:600 }}>{v||'—'}</span> },
    { key:'ip_address', label:'IP', width:130, render:v=><code style={{ fontSize:10,color:'var(--grey-400)',fontFamily:'var(--font-mono)',background:'var(--grey-50)',padding:'2px 6px',borderRadius:4,border:'1px solid var(--grey-100)' }}>{v||'—'}</code> },
  ]

  return (
    <div className="fade-up">
      {/* Viewer banner */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <h2 style={{ fontSize:22,fontWeight:900,letterSpacing:-0.4,marginBottom:4 }}>Audit Logs</h2>
          <p style={{ fontSize:13,color:'var(--grey-400)' }}>{data.totalElements} recorded events</p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,padding:'8px 14px',background:'rgba(255,214,0,0.08)',border:'1.5px solid rgba(255,214,0,0.2)',borderRadius:50 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:'rgba(255,214,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:'#A07800' }}>{me?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <p style={{ fontSize:11,fontWeight:700,color:'var(--grey-900)',lineHeight:1.2 }}>Viewing as {me?.name}</p>
              <p style={{ fontSize:9,color:'var(--grey-400)',display:'flex',alignItems:'center',gap:3 }}><Mail size={8}/>{me?.email}</p>
            </div>
            <span style={{ fontSize:9,padding:'2px 7px',borderRadius:20,background:'rgba(239,68,68,0.1)',color:'#EF4444',border:'1px solid rgba(239,68,68,0.2)',fontWeight:800 }}>ADMIN</span>
          </div>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13}/>} onClick={load}>Refresh</Button>
        </div>
      </div>
      <div style={{ marginBottom:14 }}><Input placeholder="Search by user, action, resource…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} icon={<Search size={14}/>} containerStyle={{ maxWidth:360 }}/></div>
      <DataTable columns={columns} data={data.content} loading={loading}
        emptyState={<div style={{ padding:'40px',textAlign:'center',color:'var(--grey-400)' }}><FileText size={32} style={{ marginBottom:10,opacity:0.25 }}/><p style={{ fontSize:14 }}>No audit events yet</p></div>}/>
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={20} onPageChange={setPage}/>
    </div>
  )
}
