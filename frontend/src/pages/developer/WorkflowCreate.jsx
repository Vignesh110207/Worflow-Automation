import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GitBranch, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { workflowApi } from '../../services/api'
import { Card, Button, Input, Textarea, Select, PageHeader, Toggle, Alert } from '../../components/common'

const FIELD_TYPES = [{value:'string',label:'Text'},{value:'number',label:'Number'},{value:'boolean',label:'Boolean'},{value:'email',label:'Email'},{value:'date',label:'Date'}]

export default function WorkflowCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', description:'', is_active:true })
  const [fields, setFields] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const addField = () => setFields(f => [...f, { name:'', type:'string', required:false }])
  const updateField = (i, key, val) => setFields(f => { const n=[...f]; n[i]={...n[i],[key]:val}; return n })
  const removeField = (i) => setFields(f => f.filter((_,idx)=>idx!==i))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Workflow name is required'
    for (const [i, f] of fields.entries()) {
      if (!f.name.trim()) e[`field_${i}`] = 'Field name required'
      else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f.name)) e[`field_${i}`] = 'Use letters, numbers, underscores only'
    }
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const input_schema = {
        fields,
        required: fields.filter(f => f.required).map(f => f.name),
        optional: fields.filter(f => !f.required).map(f => f.name),
      }
      const r = await workflowApi.create({ ...form, input_schema })
      toast.success('Workflow created!')
      navigate(`/workflows/${r.data.data.id}`)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-up" style={{ maxWidth:680, margin:'0 auto' }}>
      <PageHeader
        title="New workflow"
        subtitle="Design a workflow blueprint — add steps and rules after creation"
        actions={<Button variant="ghost" size="sm" icon={<ArrowLeft size={13}/>} onClick={() => navigate('/workflows')}>Back</Button>}
      />

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Basic info */}
        <Card>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:7 }}>
            <GitBranch size={14} color="var(--accent)"/> Basic information
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Input label="Workflow name" required placeholder="e.g. Expense Approval" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} error={errors.name}/>
            <Textarea label="Description" placeholder="What does this workflow automate?" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{minHeight:70}}/>
            <Toggle checked={form.isActive} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} label={form.isActive?'Active — users can execute this workflow':'Inactive — disabled for execution'}/>
          </div>
        </Card>

        {/* Input schema */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:14, fontWeight:700, display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:16 }}>⚡</span> Input schema
              </h3>
              <p style={{ fontSize:11, color:'var(--text-4)', marginTop:2 }}>Define what data users must provide when executing</p>
            </div>
            <Button variant="secondary" size="sm" icon={<Plus size={13}/>} onClick={addField}>Add field</Button>
          </div>

          {fields.length === 0 ? (
            <Alert type="info" message="No fields defined. Users will execute with empty data. Add fields to collect input." />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {fields.map((f, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 120px auto auto', gap:8, alignItems:'flex-start', padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                  <Input placeholder="field_name" value={f.name} onChange={e=>updateField(i,'name',e.target.value)} error={errors[`field_${i}`]} hint="No spaces"/>
                  <Select value={f.type} options={FIELD_TYPES} onChange={e=>updateField(i,'type',e.target.value)}/>
                  <div style={{ paddingTop:6 }}><Toggle checked={f.required} onChange={e=>updateField(i,'required',e.target.checked)} label="Required"/></div>
                  <div style={{ paddingTop:4 }}><Button variant="secondary" size="sm" danger icon={<Trash2 size={12}/>} onClick={()=>removeField(i)}/></div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display:'flex', gap:10 }}>
          <Button loading={loading} icon={<GitBranch size={14}/>} size="lg" onClick={handleSubmit}>Create workflow</Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/workflows')}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
