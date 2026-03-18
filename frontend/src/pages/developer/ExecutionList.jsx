import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Eye, RotateCcw, XCircle, Play, Activity, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { executionApi } from '../../services/api'
import { Badge, Button, Select, PageHeader, EmptyState, DataTable, Pagination, IconBtn } from '../../components/common'
import { formatDistanceToNow, format } from 'date-fns'

const STATUS_META = {
  completed:   { color:'#15803D', bg:'rgba(34,197,94,0.1)'   },
  failed:      { color:'#991B1B', bg:'rgba(239,68,68,0.1)'   },
  in_progress: { color:'#0369A1', bg:'rgba(56,189,248,0.1)'  },
  pending:     { color:'#854D0E', bg:'rgba(245,158,11,0.1)'  },
  canceled:    { color:'var(--grey-400)', bg:'var(--grey-50)' },
}

export default function ExecutionList() {
  const navigate  = useNavigate()
  const [data, setData]       = useState({ content:[], totalElements:0, totalPages:0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(0)
  const [status, setStatus]   = useState('')
  const [actioning, setActioning] = useState({})

  const load = useCallback(() => {
    setLoading(true)
    executionApi.list(page, 10, status ? { status } : {})
      .then(r => setData(r.data.data || { content:[], totalElements:0, totalPages:0 }))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [page, status])

  useEffect(() => { load() }, [load])

  const doAction = async (id, action, label) => {
    setActioning(a => ({ ...a, [id]:true }))
    try { await action(id); toast.success(`Execution ${label}`); load() }
    catch (e) { toast.error(e.message) }
    finally { setActioning(a => ({ ...a, [id]:false })) }
  }

  const columns = [
    { key:'id', label:'Run ID', width:110, render:v => (
      <code style={{ fontSize:10, color:'var(--grey-400)', fontFamily:"'JetBrains Mono',monospace", background:'var(--grey-50)', padding:'2px 7px', borderRadius:5, border:'1px solid var(--grey-100)' }}>
        {v?.slice(0,8)}…
      </code>
    )},
    { key:'workflowName', label:'Workflow', width:190, render:(v,row) => (
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:'rgba(255,214,0,0.1)', border:'1px solid rgba(255,214,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Activity size={13} color="#A07800"/>
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'var(--grey-900)' }}>{v || '—'}</p>
          <p style={{ fontSize:10, color:'var(--grey-400)' }}>v{row.workflowVersion}</p>
        </div>
      </div>
    )},
    { key:'status', label:'Status', width:120, render:v => <Badge status={v}/> },
    { key:'triggeredByName', label:'Triggered by', width:140, render:v => (
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(99,102,241,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#6366F1', flexShrink:0 }}>
          {v?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span style={{ fontSize:12, color:'var(--grey-500)' }}>{v || '—'}</span>
      </div>
    )},
    { key:'startedAt', label:'Started', width:130, render:v => (
      <span style={{ fontSize:11, color:'var(--grey-400)' }}>
        {v ? formatDistanceToNow(new Date(v),{addSuffix:true}) : '—'}
      </span>
    )},
    { key:'_actions', label:'', width:100, render:(_,row) => (
      <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
        <IconBtn title="View details" variant="accent"  size={28} icon={<Eye size={12}/>} onClick={() => navigate(`/executions/${row.id}`)}/>
        {row.status==='failed' && (
          <IconBtn title="Retry" variant="success" size={28} icon={<RotateCcw size={12}/>}
            disabled={actioning[row.id]} onClick={() => doAction(row.id, executionApi.retry, 'retried')}/>
        )}
        {(row.status==='in_progress'||row.status==='pending') && (
          <IconBtn title="Cancel" variant="danger" size={28} icon={<XCircle size={12}/>}
            disabled={actioning[row.id]} onClick={() => doAction(row.id, executionApi.cancel, 'canceled')}/>
        )}
      </div>
    )},
  ]

  /* Status chip counts */
  const counts = data.content.reduce((a,e) => { a[e.status]=(a[e.status]||0)+1; return a }, {})

  return (
    <div className="fade-up">
      <PageHeader
        title="Executions"
        subtitle={`${data.totalElements} total run${data.totalElements!==1?'s':''}`}
        actions={<Button variant="secondary" size="sm" icon={<RefreshCw size={13}/>} onClick={load}>Refresh</Button>}
      />

      {/* Status filter chips */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {[
          { value:'',            label:'All' },
          { value:'pending',     label:'Pending',     color:'#854D0E',  bg:'#FEF9C3', border:'#FEF08A' },
          { value:'in_progress', label:'In progress', color:'#0369A1',  bg:'#E0F2FE', border:'#BAE6FD' },
          { value:'completed',   label:'Completed',   color:'#15803D',  bg:'#DCFCE7', border:'#BBF7D0' },
          { value:'failed',      label:'Failed',      color:'#991B1B',  bg:'#FEE2E2', border:'#FECACA' },
          { value:'canceled',    label:'Canceled',    color:'#736D65',  bg:'var(--grey-100)', border:'var(--grey-200)' },
        ].map(s => {
          const active = status === s.value
          return (
            <button key={s.value} onClick={() => { setStatus(s.value); setPage(0) }} style={{
              padding:'5px 14px', borderRadius:30, fontSize:12, fontWeight:700, cursor:'pointer',
              background: active ? (s.bg||'var(--grey-900)') : 'transparent',
              border: `1.5px solid ${active ? (s.border||'var(--grey-900)') : 'var(--grey-200)'}`,
              color: active ? (s.color||'#fff') : 'var(--grey-400)',
              fontFamily:'inherit', transition:'all 0.15s',
            }}>
              {s.label}
              {s.value && counts[s.value] ? <span style={{ marginLeft:5, opacity:0.7 }}>({counts[s.value]})</span> : ''}
            </button>
          )
        })}
      </div>

      <DataTable columns={columns} data={data.content} loading={loading}
        onRowClick={row => navigate(`/executions/${row.id}`)}
        emptyState={
          <EmptyState icon={<Play size={36}/>} title="No executions yet"
            description="Execute a workflow to see runs here"/>
        }
      />
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPageChange={setPage}/>
    </div>
  )
}
