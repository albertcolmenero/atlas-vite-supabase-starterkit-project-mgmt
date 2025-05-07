import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@clerk/clerk-react';

export interface Project {
  id: string;
  name: string;
  description: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoaded) return;
    
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // TEMPORARY SOLUTION: Fetch all projects for testing
        // Will be replaced once project_members table is created
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .limit(10); // Limiting to 10 for safety
          
        if (projectsError) {
          throw new Error(`Error fetching projects: ${JSON.stringify(projectsError)}`);
        }
        
        setProjects(projects || []);
      } catch (err) {
        console.error('Error in useProjects:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching projects');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [isUserLoaded, user]);

  return { projects, isLoading, error };
}; 