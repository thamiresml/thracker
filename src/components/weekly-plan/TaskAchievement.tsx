// src/components/weekly-plan/TaskAchievement.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import AchievementBadge from '@/app/weekly-plan/AchievementBadge';

interface TaskAchievementProps {
  userId: string;
  onNewAchievement?: (type: string) => void;
}

interface Achievement {
  id: number;
  achievement_type: string;
  description: string;
  date_achieved: string;
  metadata?: {
    title?: string;
  };
}

export default function TaskAchievement({ userId, onNewAchievement }: TaskAchievementProps) {
  const supabase = createClient();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [showBadge, setShowBadge] = useState(false);
  
  // Check for new achievements whenever component renders
  useEffect(() => {
    const checkAchievements = async () => {
      try {
        // First check metrics
        await checkTaskMetrics();
        
        // Then look for any unseen achievements
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .eq('seen', false)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCurrentAchievement(data[0]);
          setShowBadge(true);
          
          // Mark as seen
          await supabase
            .from('achievements')
            .update({ seen: true })
            .eq('id', data[0].id);
            
          if (onNewAchievement) {
            onNewAchievement(data[0].achievement_type);
          }
        }
      } catch (err) {
        console.error('Error checking achievements:', err);
      }
    };
    
    // Only run if we have a userId
    if (userId) {
      checkAchievements();
    }
    
    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      if (userId) {
        checkAchievements();
      }
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [userId, supabase, onNewAchievement]);
  
  // Check for task-based achievements
  const checkTaskMetrics = async () => {
    try {
      // Get task counts
      const { count: totalTasksCount, error: countError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (countError) throw countError;
      
      // Get completed tasks count
      const { count: completedTasksCount, error: completedError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'done');
      
      if (completedError) throw completedError;
      
      // Achievement conditions
      const achievements = [
        {
          type: 'first_task_complete',
          condition: completedTasksCount === 1,
          title: 'First Task Complete!',
          description: 'You completed your first task. Keep up the good work!'
        },
        {
          type: 'task_master_10',
          condition: completedTasksCount === 10,
          title: 'Task Master!',
          description: 'You\'ve completed 10 tasks. You\'re getting things done!'
        },
        {
          type: 'task_master_25',
          condition: completedTasksCount === 25,
          title: 'Task Expert!',
          description: 'You\'ve completed 25 tasks. Your productivity is impressive!'
        },
        {
          type: 'task_master_50',
          condition: completedTasksCount === 50,
          title: 'Task Wizard!',
          description: 'You\'ve completed 50 tasks. You\'re on fire!'
        },
        {
          type: 'task_master_100',
          condition: completedTasksCount === 100,
          title: 'Task Guru!',
          description: 'You\'ve completed 100 tasks. You\'re a productivity legend!'
        }
      ];
      
      // Check each achievement
      for (const achievement of achievements) {
        if (achievement.condition) {
          // Check if already earned
          const { count, error } = await supabase
            .from('achievements')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('achievement_type', achievement.type);
            
          if (error) throw error;
          
          // If not already earned, award it
          if (count === 0) {
            const { error: insertError } = await supabase
              .from('achievements')
              .insert({
                user_id: userId,
                achievement_type: achievement.type,
                description: achievement.description,
                date_achieved: new Date().toISOString().split('T')[0],
                metadata: { title: achievement.title },
                seen: false
              });
              
            if (insertError) throw insertError;
          }
        }
      }
    } catch (err) {
      console.error('Error checking task metrics:', err);
    }
  };
  
  // Handle badge close
  const handleCloseBadge = () => {
    setShowBadge(false);
    setCurrentAchievement(null);
  };
  
  if (!showBadge || !currentAchievement) {
    return null;
  }
  
  return (
    <AchievementBadge
      title={currentAchievement.metadata?.title || 'Achievement Unlocked!'}
      message={currentAchievement.description}
      type={currentAchievement.achievement_type.includes('warning') ? 'warning' : 'milestone'}
      onClose={handleCloseBadge}
    />
  );
}