import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, GitBranch, Edit2, Trash2, Play, RefreshCw, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowApi } from '../../services/api'
import { Badge, Button, Input, PageHeader, EmptyState, DataTable, Pagination, ConfirmDialog, IconBtn } from '../../components/common'
import { formatDistanceToNow } from 'date-fns'

const STEP_TYPE_DOT = { task:'#6366F1', approval:'#F59E0B', notification:'#22C55E' }

export default function WorkflowList() {
  const navigate = useNavigate()
  const [data, setData]     = useState({ content:[], totalElements:0, totalPages:0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(0)
  const [delTarget, setDelTarget] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    workflowApi.list(page, 10, search)
      .then(r => setData(r.data.data || { content:[], totalElements:0, totalPages:0 }))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    setDeleting(true)
    try { await workflowApi.delete(delTarget.id); toast.success('Workflow deleted'); setDelTarget(null); load() }
    catch (e) { toast.error(e.message) }
    finally { setDeleting(false) }
  }

  const columns = [
    { key:'name', label:'Workflow', render:(v,row) => (
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,214,0,0.12)', border:'1.5px solid rgba(255,214,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <GitBranch size={15} color="#A07800"/>
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'var(--grey-900)' }}>{v}</p>
          {row.description && <p style={{ fontSize:11, color:'var(--grey-400)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.description}</p>}
        </div>
      </div>
    )},
    { key:'stepCount', label:'Steps', width:70, render:v => (
      <span style={{ fontSize:13, fontWeight:800, color:'var(--grey-700)' }}>{v ?? 0}</span>
    )},
    { key:'version', label:'Version', width:80, render:v => (
      <code style={{ fontSize:11, background:'var(--grey-50)', padding:'2px 8px', borderRadius:6, border:'1.5px solid var(--grey-100)', color:'var(--grey-600,#736D65)', fontFamily:"'JetBrains Mono',monospace" }}>v{v}</code>
    )},
    { key:'isActive', label:'Status', width:100, render:v => <Badge status={v?'Active':'Inactive'}/> },
    { key:'createdByName', label:'Creator', width:130, render:v => (
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#6366F1', flexShrink:0 }}>
          {v?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span style={{ fontSize:12, color:'var(--grey-500)' }}>{v || '—'}</span>
      </div>
    )},
    { key:'createdAt', label:'Created', width:130, render:v => (
      <span style={{ fontSize:11, color:'var(--grey-400)' }}>{v ? formatDistanceToNow(new Date(v),{addSuffix:true}) : '—'}</span>
    )},
    { key:'_actions', label:'', width:110, render:(_,row) => (
      <div style={{ display:'flex', gap:5 }} onClick={e => e.stopPropagation()}>
        <IconBtn title="Execute" variant="success" size={30} icon={<Play size={12}/>}   onClick={() => navigate(`/workflows/${row.id}?tab=execute`)}/>
        <IconBtn title="Edit"    variant="accent"  size={30} icon={<Edit2 size={12}/>}  onClick={() => navigate(`/workflows/${row.id}`)}/>
        <IconBtn title="Delete"  variant="danger"  size={30} icon={<Trash2 size={12}/>} onClick={() => setDelTarget(row)}/>
      </div>
    )},
  ]

  return (
    <div className="fade-up">
      <PageHeader
        title="Workflows"
        subtitle={`${data.totalElements} workflow${data.totalElements!==1?'s':''} defined`}
        actions={<>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13}/>} onClick={load}>Refresh</Button>
          <Button size="sm" icon={<Plus size={14}/>} onClick={() => navigate('/workflows/new')}>New workflow</Button>
        </>}
      />

      <div style={{ marginBottom:16 }}>
        <Input placeholder="Search workflows…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          icon={<Search size={14}/>} containerStyle={{ maxWidth:320 }}/>
      </div>

      <DataTable columns={columns} data={data.content} loading={loading}
        onRowClick={row => navigate(`/workflows/${row.id}`)}
        emptyState={
          <EmptyState
            icon={<GitBranch size={36}/>}
            title="No workflows found"
            description={search ? 'Try different search terms' : 'Create your first workflow to get started'}
            action={!search && <Button size="sm" icon={<Plus size={13}/>} onClick={() => navigate('/workflows/new')}>New workflow</Button>}
          />
        }
      />
      <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} size={10} onPageChange={setPage}/>

      <ConfirmDialog open={!!delTarget} onClose={() => setDelTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete workflow"
        message={`Permanently delete "${delTarget?.name}"? All steps, rules, and execution history will be removed.`}
      />
    </div>
  )
}
