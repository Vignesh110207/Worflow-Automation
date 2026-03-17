import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Eye, RotateCcw, XCircle, Play, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { executionApi } from '../../services/api'
import { Card, Badge, Button, Select, PageHeader, EmptyState, DataTable, Pagination, IconBtn } from '../../components/common'
import { formatDistanceToNow, format } from 'date-fns'

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
    setActioning(a => ({ ...a, [id]: true }))
    try { await action(id); toast.success(`Execution ${label}`); load() }
    catch (e) { toast.error(e.message) }
    finally { setActioning(a => ({ ...a, [id]: false })) }
  }

  const columns = [
    { key:'id', label:'ID', width:110, render:v => <code style={{ fontSize:10, color:'var(--text-4)', fontFamily:"'JetBrains Mono',monospace", background:'var(--bg-elevated)', padding:'2px 6px', borderRadius:4 }}>{v?.slice(0,8)}…</code> },
    { key:'workflowName', label:'Workflow', width:180, render:v => <span style={{ fontSize:13, fontWeight:600 }}>{v || '—'}</span> },
    { key:'workflowVersion', label:'Ver', width:60, render:v => <code style={{ fontSize:11, background:'var(--bg-elevated)', padding:'1px 6px', borderRadius:4, border:'1px solid var(--border)', color:'var(--text-2)' }}>v{v}</code> },
    { key:'status', label:'Status', width:110, render:v => <Badge status={v}/> },
    { key:'triggeredByName', label:'Triggered by', width:130, render:v => <span style={{ fontSize:12, color:'var(--text-3)' }}>{v || '—'}</span> },
    { key:'startedAt', label:'Started', width:130, render:v => <span style={{ fontSize:11, color:'var(--text-4)' }}>{v ? formatDistanceToNow(new Date(v),{addSuffix:true}) : '—'}</span> },
    { key:'_actions', label:'Actions', width:120, render:(_,row) => (
      <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
        <IconBtn title="View" variant="accent" size={28} icon={<Eye size={12}/>} onClick={()=>navigate(`/executions/${row.id}`)}/>
        {row.status==='failed' && <IconBtn title="Retry" variant="success" size={28} icon={<RotateCcw size={12}/>} disabled={actioning[row.id]} onClick={()=>doAction(row.id, executionApi.retry, 'retried')}/>}
        {(row.status==='in_progress'||row.status==='pending') && <IconBtn title="Cancel" variant="danger" size={28} icon={<XCircle size={12}/>} disabled={actioning[row.id]} onClick={()=>doAction(row.id, executionApi.cancel, 'canceled')}/>}
      </div>
    )},
  ]

  return (
    <div className="fade-up">
      <PageHeader title="Executions" subtitle={`${data.totalElements} total run${data.totalElements!==1?'s':''}`}
        actions={<Button variant="secondary" size="sm" icon={<RefreshCw size={13}/>} onClick={load}>Refresh</Button>} />

      <div style={{ marginBottom:14 }}>
        <Select value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}} containerStyle={{ maxWidth:200 }}
          options={[{value:'',label:'All statuses'},{value:'pending',label:'Pending'},{value:'in_progress',label:'In progress'},{value:'completed',label:'Completed'},{value:'failed',label:'Failed'},{value:'canceled',label:'Canceled'}]}/>
      </div>

      <DataTable columns={columns} data={data.content} loading={loading} onRowClick={row=>navigate(`/executions/${row.id}`)}
        emptyState={<EmptyState icon={<Play size={36} color="var(--text-5)"/>} title="No executions yet" description="Execute a workflow to see runs here"/>}/>
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPageChange={setPage}/>
    </div>
  )
}
