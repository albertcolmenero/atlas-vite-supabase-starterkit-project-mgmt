import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
import { CustomFieldsRenderer } from '@/components/custom-fields/CustomFieldsRenderer';
import { useUser } from '@clerk/clerk-react';
import { useProjects } from '@/hooks/useProjects';
// import { Sparkles } from 'lucide-react';
// import { PremiumBadge, UpgradeButton } from '@/components/premium';

export default function CustomFieldsPage() {
  const { user } = useUser();
  const { projects, isLoading } = useProjects();
  const [activeTab, setActiveTab] = useState('project');

  // For premium features - this would come from a subscription check
  const isPremiumEnabled = true; // Changed to true since we're removing the premium block
  
  // Use a dummy global ID for all fields
  const globalProjectId = 'global';
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        
      {/* Premium Banner - Commented out as requested 
      {!isPremiumEnabled && (
        <Card className="mb-6 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-amber-800">Premium Feature</CardTitle>
              </div>
              <PremiumBadge message="Limited in free plan" />
            </div>
            <CardDescription className="text-amber-700">
              Custom fields allow you to capture additional data for your projects and tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div>
                <h4 className="font-medium mb-2 text-amber-800">Free Plan Limits:</h4>
                <ul className="list-disc list-inside text-amber-700 space-y-1">
                  <li>Maximum 3 custom fields per entity type</li>
                  <li>Basic field types only</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-amber-800">Premium Features:</h4>
                <ul className="list-disc list-inside text-amber-700 space-y-1">
                  <li>Unlimited custom fields</li>
                  <li>Advanced field types including multi-select and user assignment</li>
                  <li>Field validation rules</li>
                  <li>Custom field templates</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <UpgradeButton />
          </CardFooter>
        </Card>
      )} */}
      
      {/* Project Selector - Removed as fields will be global */}
      
      <Tabs defaultValue="project" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="project">Project Fields</TabsTrigger>
          <TabsTrigger value="task">Task Fields</TabsTrigger>
        </TabsList>
        
        <TabsContent value="project" className="space-y-6">
        <CustomFieldsManager 
                projectId={globalProjectId}
                entityType="project"
                isPremiumEnabled={isPremiumEnabled}
              />
          
          
        </TabsContent>
        
        <TabsContent value="task" className="space-y-6">
              <CustomFieldsManager 
                projectId={globalProjectId}
                entityType="task"
                isPremiumEnabled={isPremiumEnabled}
              />
          
          
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 