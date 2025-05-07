import { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CustomFieldsManager } from './CustomFieldsManager';
import { CustomFieldsRenderer } from './CustomFieldsRenderer';
import { supabase } from '@/lib/supabaseClient';
import { PremiumBadge } from '@/components/premium/PremiumBadge';

interface CustomFieldsTabProps {
  projectId: string;
  isPremiumEnabled?: boolean;
}

export function CustomFieldsTab({ projectId, isPremiumEnabled = false }: CustomFieldsTabProps) {
  const [activeTab, setActiveTab] = useState('project');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Custom Fields</CardTitle>
          {!isPremiumEnabled && (
            <PremiumBadge message="Upgrade to Premium for unlimited custom fields" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-2 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}
        
        <Tabs defaultValue="project" onValueChange={handleTabChange}>
          <TabList className="grid grid-cols-2 mb-6">
            <Tab value="project">Project Fields</Tab>
            <Tab value="task">Task Fields</Tab>
          </TabList>
          
          <TabPanel value="project">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Manage Project Fields</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Define custom fields to store additional information about your projects.
                </p>
                <CustomFieldsManager 
                  projectId={projectId} 
                  entityType="project"
                  isPremiumEnabled={isPremiumEnabled}
                />
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Project Fields Preview</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  This is how your custom fields will appear on the project form.
                </p>
                <Card>
                  <CardContent className="p-4">
                    <CustomFieldsRenderer
                      entityId={projectId}
                      entityType="project"
                      projectId={projectId}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabPanel>
          
          <TabPanel value="task">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Manage Task Fields</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Define custom fields that will be available on all tasks within this project.
                </p>
                <CustomFieldsManager 
                  projectId={projectId} 
                  entityType="task"
                  isPremiumEnabled={isPremiumEnabled}
                />
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Task Fields Preview</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  This is how your custom fields will appear on task forms.
                </p>
                <Card>
                  <CardContent className="p-4">
                    <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                      Task fields will appear on task forms when creating or editing tasks.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </CardContent>
    </Card>
  );
} 