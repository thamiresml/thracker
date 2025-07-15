'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import CustomSelect from '@/components/ui/CustomSelect'; 
import { getLocalDateString } from '@/lib/utils';

interface InlineStatusEditorProps {
  applicationId: number;
  currentStatus: string;
  onStatusChange: (status: string) => void;
  onCancel: () => void;
}

const statusOptions = [
  { value: 'Saved', label: 'Saved' },
  { value: 'Applied', label: 'Applied' },
  { value: 'Assessment', label: 'Assessment' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Offer', label: 'Offer' },
  { value: 'Not Selected', label: 'Not Selected' },
  { value: 'No Response 👻', label: 'No Response 👻' },
];

const InlineStatusEditor: React.FC<InlineStatusEditorProps> = ({ 
  applicationId, 
  currentStatus, 
  onStatusChange, 
  onCancel 
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSelectOption = async (optionValue: string | null) => {
    if (!optionValue) {
      onCancel();
      return;
    }
    
    console.log('Status change initiated:', { applicationId, from: currentStatus, to: optionValue });
    setSelectedStatus(optionValue);
    
    if (optionValue === currentStatus) {
      onCancel();
      return;
    }

    setIsUpdating(true);
    try {
      // First check if the application has an applied_date
      const { data: application, error: fetchError } = await supabase
        .from('applications')
        .select('applied_date, status')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        console.error('Error fetching application:', fetchError);
        throw fetchError;
      }

      console.log('Current application data:', application);

      const updateData: { status: string; applied_date?: string | null } = { status: optionValue };

      // Scenarios where applied_date should be set to today
      const shouldSetDate =
        // 1. Moving from 'Saved' to 'Applied'
        (currentStatus === 'Saved' && optionValue === 'Applied') ||
        // 2. Moving to any non-'Saved' status if date doesn't exist
        (optionValue !== 'Saved' && !application?.applied_date);

      if (shouldSetDate) {
        const todayString = getLocalDateString(new Date());
        updateData.applied_date = todayString;
        console.log('Setting applied_date to:', todayString);
      }
      // Clear applied_date when moving to Saved
      else if (optionValue === 'Saved') {
        updateData.applied_date = null;
        console.log('Clearing applied_date for move to Saved');
      }

      console.log('Updating application with data:', updateData);

      const { error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating application:', updateError);
        throw updateError;
      }

      console.log('Successfully updated application status');
      onStatusChange(optionValue);
      
      // Force a hard refresh to ensure all data is updated
      router.refresh();
    } catch (error) {
      console.error('Error in status update process:', error);
      // Revert to original status on error
      setSelectedStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative" style={{ minWidth: '150px' }}>
      <CustomSelect
        value={selectedStatus}
        onChange={handleSelectOption}
        options={statusOptions}
        placeholder="Select status"
        disabled={isUpdating}
      />
    </div>
  );
};

export default InlineStatusEditor; 