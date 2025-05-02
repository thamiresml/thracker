'use client';

import { Loader2 } from 'lucide-react';

interface CompatibilityScoreProps {
  score: number;
  loading: boolean;
  scoringBreakdown?: {
    requiredExperience?: number;
    technicalSkills?: number;
    educationRequirements?: number;
    industryKnowledge?: number;
    additionalRequirements?: number;
  };
}

export default function CompatibilityScore({ score, loading, scoringBreakdown }: CompatibilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[var(--success)]';
    if (score >= 70) return 'text-[var(--warning)]';
    return 'text-[var(--denied)]';
  };

  const getScoreText = (score: number) => {
    if (score >= 85) return 'Strong Match';
    if (score >= 70) return 'Good Match';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Calculating match...
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h3 className="font-semibold mb-4 text-lg text-[var(--foreground)]">Match Score</h3>
      
      <div className="relative inline-block">
        <svg className="w-32 h-32" viewBox="0 0 36 36">
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="var(--border)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${score}, 100`}
            className={getScoreColor(score)}
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </div>
          <div className="text-xs text-[var(--muted)]">
            {getScoreText(score)}
          </div>
        </div>
      </div>
      
      {scoringBreakdown && (
        <div className="mt-6 space-y-2 text-left">
          <div className="text-sm font-medium text-[var(--foreground)] mb-3">Score Breakdown</div>
          {scoringBreakdown.requiredExperience !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Experience</span>
              <span className="text-sm font-medium">{scoringBreakdown.requiredExperience}/30</span>
            </div>
          )}
          {scoringBreakdown.technicalSkills !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Technical Skills</span>
              <span className="text-sm font-medium">{scoringBreakdown.technicalSkills}/30</span>
            </div>
          )}
          {scoringBreakdown.educationRequirements !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Education</span>
              <span className="text-sm font-medium">{scoringBreakdown.educationRequirements}/15</span>
            </div>
          )}
          {scoringBreakdown.industryKnowledge !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Industry Knowledge</span>
              <span className="text-sm font-medium">{scoringBreakdown.industryKnowledge}/15</span>
            </div>
          )}
          {scoringBreakdown.additionalRequirements !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--muted)]">Additional Reqs</span>
              <span className="text-sm font-medium">{scoringBreakdown.additionalRequirements}/10</span>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-[var(--muted)]">
        Based on job requirements match
      </div>
    </div>
  );
} 