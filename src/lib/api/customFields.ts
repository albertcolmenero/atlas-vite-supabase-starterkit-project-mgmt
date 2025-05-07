import { supabase } from '../supabaseClient';
import { FieldType, EntityType, CustomFieldDefinition } from '@/components/custom-fields/CustomFieldsManager';

export interface CustomFieldValue {
  id?: string;
  field_definition_id: string;
  entity_id: string;
  text_value?: string | null;
  number_value?: number | null;
  date_value?: string | null;
  boolean_value?: boolean | null;
  json_value?: any | null;
}

/**
 * Fetches all custom field definitions for a project and entity type
 */
export async function getCustomFieldDefinitions(
  projectId: string,
  entityType: EntityType
): Promise<CustomFieldDefinition[]> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('project_id', projectId)
    .eq('entity_type', entityType)
    .order('position');

  if (error) {
    console.error('Error fetching custom field definitions:', error);
    throw new Error(`Failed to fetch custom field definitions: ${error.message}`);
  }

  return data || [];
}

/**
 * Creates a new custom field definition
 */
export async function createCustomFieldDefinition(
  definition: Omit<CustomFieldDefinition, 'id'>
): Promise<CustomFieldDefinition> {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert(definition)
    .select()
    .single();

  if (error) {
    console.error('Error creating custom field definition:', error);
    throw new Error(`Failed to create custom field definition: ${error.message}`);
  }

  return data;
}

/**
 * Updates an existing custom field definition
 */
export async function updateCustomFieldDefinition(
  id: string,
  updates: Partial<CustomFieldDefinition>
): Promise<void> {
  const { error } = await supabase
    .from('custom_field_definitions')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating custom field definition:', error);
    throw new Error(`Failed to update custom field definition: ${error.message}`);
  }
}

/**
 * Deletes a custom field definition
 */
export async function deleteCustomFieldDefinition(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_field_definitions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting custom field definition:', error);
    throw new Error(`Failed to delete custom field definition: ${error.message}`);
  }
}

/**
 * Reorders custom field definitions by updating their positions
 */
export async function reorderCustomFieldDefinitions(
  orderedIds: string[]
): Promise<void> {
  // Create a batch of update operations
  const updates = orderedIds.map((id, index) => ({
    id,
    position: index,
  }));

  // Execute updates one by one (Supabase doesn't support true batch updates)
  for (const update of updates) {
    const { error } = await supabase
      .from('custom_field_definitions')
      .update({ position: update.position })
      .eq('id', update.id);

    if (error) {
      console.error('Error reordering custom field definition:', error);
      throw new Error(`Failed to reorder custom field definitions: ${error.message}`);
    }
  }
}

/**
 * Gets all custom field values for a specific entity
 */
export async function getCustomFieldValues(
  entityId: string,
  fieldDefinitionIds: string[]
): Promise<Record<string, CustomFieldValue>> {
  if (!fieldDefinitionIds.length) return {};

  const { data, error } = await supabase
    .from('custom_field_values')
    .select('*')
    .eq('entity_id', entityId)
    .in('field_definition_id', fieldDefinitionIds);

  if (error) {
    console.error('Error fetching custom field values:', error);
    throw new Error(`Failed to fetch custom field values: ${error.message}`);
  }

  // Convert array to object keyed by field_definition_id
  return (data || []).reduce((acc, value) => {
    acc[value.field_definition_id] = value;
    return acc;
  }, {} as Record<string, CustomFieldValue>);
}

/**
 * Sets a custom field value for an entity
 */
export async function setCustomFieldValue(
  fieldDefinitionId: string,
  entityId: string,
  value: any,
  fieldType: FieldType
): Promise<CustomFieldValue> {
  // First check if a value already exists
  const { data: existingValues } = await supabase
    .from('custom_field_values')
    .select('id')
    .eq('field_definition_id', fieldDefinitionId)
    .eq('entity_id', entityId);

  const existingId = existingValues?.[0]?.id;

  // Prepare the value object based on field type
  const fieldValue: Partial<CustomFieldValue> = {
    field_definition_id: fieldDefinitionId,
    entity_id: entityId,
  };

  // Set the appropriate value field based on type
  switch (fieldType) {
    case 'text':
    case 'select':
    case 'user_id':
      fieldValue.text_value = value;
      break;
    case 'number':
      fieldValue.number_value = typeof value === 'number' ? value : parseFloat(value);
      break;
    case 'date':
      fieldValue.date_value = value ? new Date(value).toISOString() : null;
      break;
    case 'boolean':
      fieldValue.boolean_value = !!value;
      break;
    case 'multi_select':
      fieldValue.json_value = value;
      break;
  }

  if (existingId) {
    // Update existing
    const { data, error } = await supabase
      .from('custom_field_values')
      .update(fieldValue)
      .eq('id', existingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating custom field value:', error);
      throw new Error(`Failed to update custom field value: ${error.message}`);
    }

    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('custom_field_values')
      .insert(fieldValue)
      .select()
      .single();

    if (error) {
      console.error('Error creating custom field value:', error);
      throw new Error(`Failed to create custom field value: ${error.message}`);
    }

    return data;
  }
}

/**
 * Bulk update multiple custom field values at once for an entity
 */
export async function bulkUpdateCustomFieldValues(
  entityId: string,
  values: Record<string, { value: any; fieldType: FieldType }>
): Promise<void> {
  const fieldIds = Object.keys(values);
  
  if (!fieldIds.length) return;

  // Process fields one by one
  for (const fieldId of fieldIds) {
    const { value, fieldType } = values[fieldId];
    try {
      await setCustomFieldValue(fieldId, entityId, value, fieldType);
    } catch (error) {
      console.error(`Error updating field ${fieldId}:`, error);
      throw error;
    }
  }
}

/**
 * Gets all custom field definitions and their values for an entity
 */
export async function getCustomFieldsWithValues(
  projectId: string,
  entityId: string,
  entityType: EntityType
): Promise<{ definition: CustomFieldDefinition; value: CustomFieldValue | null }[]> {
  try {
    // Get field definitions
    const definitions = await getCustomFieldDefinitions(projectId, entityType);
    
    if (!definitions.length) return [];
    
    // Get field values
    const values = await getCustomFieldValues(
      entityId,
      definitions.map((def) => def.id)
    );
    
    // Combine definitions with values
    return definitions.map((definition) => ({
      definition,
      value: values[definition.id] || null,
    }));
  } catch (error) {
    console.error('Error fetching custom fields with values:', error);
    throw error;
  }
} 