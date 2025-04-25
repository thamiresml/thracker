// src/app/applications/ApplicationsFunnel.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Bookmark, Send, ClipboardCheck, Users, Award, Ban, Ghost } from 'lucide-react';
import { Application } from '@/types/common';

interface PipelineStage {
  id: string;
  label: string;
  color: string;
  icon: React.ElementType;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'Saved', label: 'Saved', color: 'text-indigo-600', icon: Bookmark },
  { id: 'Applied', label: 'Applied', color: 'text-indigo-600', icon: Send },
  { id: 'Assessment', label: 'Assessment', color: 'text-indigo-600', icon: ClipboardCheck },
  { id: 'Interview', label: 'Interview', color: 'text-indigo-600', icon: Users },
  { id: 'Offer', label: 'Offer', color: 'text-green-600', icon: Award },
  { id: 'Not Selected', label: 'Not Selected', color: 'text-red-600', icon: Ban },
  { id: 'No Response 👻', label: 'No Response', color: 'text-gray-600', icon: Ghost }
];

const STATUS_MAPPING: Record<string, string> = {
  'Bookmarked': 'Saved',
  'Applying': 'Applied',
  'Interviewing': 'Interview',
  'Negotiating': 'Offer',
  'Accepted': 'Offer',
  'I Withdrew': 'Not Selected',
  'Rejected': 'Not Selected',
  'Archived': 'No Response 👻',
  'No Response 🔊': 'No Response 👻'
};

interface ApplicationsFunnelProps {
  applications: Application[];
}

export default function ApplicationsFunnel({ applications = [] }: ApplicationsFunnelProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [stageStats, setStageStats] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const stats: Record<string, number> = {};
    PIPELINE_STAGES.forEach(stage => (stats[stage.id] = 0));

    applications.forEach(app => {
      if (!app) return;
      const rawStatus = app.status || 'No Response 👻';
      const mappedStatus = STATUS_MAPPING[rawStatus] || rawStatus;
      if (stats[mappedStatus] !== undefined) {
        stats[mappedStatus]++;
      } else {
        stats['No Response 👻']++;
      }
    });

    setStageStats(stats);
    const submittedCount = applications.filter(app => app?.status !== 'Saved').length;
    setTotalCount(submittedCount);
  }, [applications]);

  const handleClick = (stageId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (stageId === 'All') {
      params.delete('status');
    } else {
      params.set('status', stageId);
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (totalCount === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No applications data to display. Start by adding applications.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-7 gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const count = stageStats[stage.id] || 0;
          const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
          const Icon = stage.icon;
          const isActive = searchParams.get('status') === stage.id;

          return (
            <div
              key={stage.id}
              onClick={() => handleClick(stage.id)}
              className={`bg-white border p-4 rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${
                isActive ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center">
                <Icon className={`h-5 w-5 mb-2 ${stage.color}`} />
                <div className="text-2xl font-semibold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 mt-1">{stage.label}</div>
                <div className="text-xs text-gray-400">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div>
          <span className="text-sm font-medium text-gray-700">Total: {totalCount} applications</span>
        </div>
        <div className="text-sm text-gray-700 text-center">
          <span className="font-semibold">{stageStats['Interview'] || 0}</span> interviewing, 
          <span className="font-semibold ml-1">{stageStats['Offer'] || 0}</span> with offers
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-gray-700">
            Success rate: <span className="font-bold text-green-600">
              {totalCount > 0 
                ? `${Math.round((stageStats['Offer'] || 0) / totalCount * 100)}%` 
                : '0%'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}