import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getProjectColumns, Project, useCustomFieldColumns } from './projects/columns'
import { DataTable } from './projects/data-table'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useUser } from '@clerk/clerk-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CustomFieldsRenderer } from '@/components/custom-fields/CustomFieldsRenderer'
import { Separator } from '@/components/ui/separator'
import { ColumnDef } from '@tanstack/react-table'

export default function ProjectsPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', id: '' })
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  
  // Get custom field columns
  const customFieldColumns = useCustomFieldColumns('project')
  
  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line
  }, [])

  async function fetchProjects() {
    setLoading(true)
    
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
      
      if (projectsError) throw projectsError
      
      if (!projectsData) {
        setProjects([])
        setLoading(false)
        return
      }
      
      // Fetch all custom field definitions
      const { data: fieldDefinitions, error: fieldDefError } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('entity_type', 'project')
        .eq('project_id', 'global')
      
      if (fieldDefError) {
        console.error('Error fetching field definitions:', fieldDefError)
        setProjects(projectsData)
        setLoading(false)
        return
      }
      
      // If we have custom fields defined, fetch their values for all projects
      if (fieldDefinitions && fieldDefinitions.length > 0) {
        const projectIds = projectsData.map(p => p.id)
        
        // Fetch all field values for these projects
        const { data: fieldValues, error: fieldValuesError } = await supabase
          .from('custom_field_values')
          .select('*')
          .in('entity_id', projectIds)
          .in(
            'field_definition_id', 
            fieldDefinitions.map(def => def.id)
          )
        
        if (fieldValuesError) {
          console.error('Error fetching field values:', fieldValuesError)
          setProjects(projectsData)
          setLoading(false)
          return
        }
        
        // Map field values to their respective projects
        const projectsWithCustomFields = projectsData.map(project => {
          const projectCustomFields = fieldValues
            ? fieldValues.filter(v => v.entity_id === project.id)
            : []
          
          // Create a map of custom field values for this project
          const customFields: Record<string, any> = {}
          
          projectCustomFields.forEach(fieldValue => {
            const fieldDef = fieldDefinitions.find(def => def.id === fieldValue.field_definition_id)
            if (!fieldDef) return
            
            const fieldId = `custom_${fieldValue.field_definition_id}`
            
            // Extract the value based on field type
            switch (fieldDef.field_type) {
              case 'text':
              case 'select':
              case 'user_id':
                customFields[fieldId] = fieldValue.text_value
                break
              case 'number':
                customFields[fieldId] = fieldValue.number_value
                break
              case 'date':
                customFields[fieldId] = fieldValue.date_value
                break
              case 'boolean':
                customFields[fieldId] = fieldValue.boolean_value
                break
              case 'multi_select':
                customFields[fieldId] = fieldValue.json_value
                break
            }
          })
          
          // Return project with custom fields
          return {
            ...project,
            ...customFields
          }
        })
        
        setProjects(projectsWithCustomFields)
      } else {
        setProjects(projectsData)
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setForm({ name: '', description: '', id: '' })
    setEditMode(false)
    setShowSheet(true)
    setError(null)
    setCustomFieldValues({})
  }
  
  function openEdit(project: Project) {
    setForm({ name: project.name, description: project.description, id: project.id })
    setEditMode(true)
    setShowSheet(true)
    setError(null)
    setCustomFieldValues({})
  }
  
  async function handleDelete(project: Project) {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await supabase.from('projects').delete().eq('id', project.id)
      fetchProjects()
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!user) {
      setError('User not found. Please sign in again.')
      return
    }
    
    try {
      let projectId = form.id;
      
      if (editMode) {
        await supabase
          .from('projects')
          .update({ name: form.name, description: form.description })
          .eq('id', form.id)
        
        projectId = form.id
      } else {
        const { data, error: insertError } = await supabase
          .from('projects')
          .insert({ name: form.name, description: form.description, user_id: user.id })
          .select()
        
        if (insertError) {
          setError(insertError.message)
          return
        }
        
        if (data && data[0]) {
          projectId = data[0].id
        }
      }
      
      setShowSheet(false)
      fetchProjects()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
  }

  // Combine base columns with custom field columns
  const baseColumns = getProjectColumns({ onEdit: openEdit, onDelete: handleDelete })
  const columns = useMemo(() => {
    return [...baseColumns, ...(customFieldColumns as ColumnDef<Project, any>[])]
  }, [baseColumns, customFieldColumns])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <Sheet open={showSheet} onOpenChange={setShowSheet}>
          <SheetTrigger asChild>
            <Button onClick={openAdd}>Add New Project</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editMode ? 'Edit Project' : 'Add Project'}</SheetTitle>
              <SheetDescription>
                {editMode ? 'Update your project details.' : 'Add a new project to your list.'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <Input
                required
                placeholder="Project Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              
              {/* Custom Fields Section */}
              {(editMode || !form.id) && (
                <>
                  <Separator className="my-2" />
                  <h3 className="text-sm font-medium">Custom Fields</h3>
                  
                  <CustomFieldsRenderer 
                    entityId={form.id}
                    entityType="project"
                    projectId="global"
                    onChange={setCustomFieldValues}
                    disabled={false}
                  />
                </>
              )}
              
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex gap-2 mt-2">
                <Button type="submit">{editMode ? 'Save Changes' : 'Add Project'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowSheet(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable columns={columns} data={projects} />
      )}
    </div>
  )
} 