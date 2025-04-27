'use client';

import { useState } from 'react';
import { Bot, Settings } from 'lucide-react';

interface AgentSettings {
  tone: string;
  focusArea: string;
  detailLevel: string;
}

interface AgentProfileProps {
  onSettingsChange?: (settings: AgentSettings) => void;
}

export default function AgentProfile({ onSettingsChange }: AgentProfileProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    tone: 'professional',
    focusArea: 'technical',
    detailLevel: 'balanced'
  });
  
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  const handleSettingChange = (setting: keyof AgentSettings, value: string) => {
    const newSettings = {
      ...agentSettings,
      [setting]: value
    };
    
    setAgentSettings(newSettings);
    
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };
  
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Bot size={20} />
          </div>
          <div className="ml-3">
            <h3 className="font-medium">Your Application Copilot</h3>
            <p className="text-xs text-gray-500">Powered by GPT-4o</p>
          </div>
        </div>
        
        <button 
          onClick={toggleSettings}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <Settings size={18} />
        </button>
      </div>
      
      {showSettings && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Writing Tone</label>
            <select
              value={agentSettings.tone}
              onChange={(e) => handleSettingChange('tone', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Focus Area</label>
            <select
              value={agentSettings.focusArea}
              onChange={(e) => handleSettingChange('focusArea', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="technical">Technical Skills</option>
              <option value="soft">Soft Skills</option>
              <option value="achievements">Achievements</option>
              <option value="leadership">Leadership</option>
            </select>
          </div>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Detail Level</label>
            <select
              value={agentSettings.detailLevel}
              onChange={(e) => handleSettingChange('detailLevel', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </div>
      )}
      
      <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
        <p>
          Your agent is trained to help you tailor your resume and cover letter to match job requirements.
          {!showSettings && (
            <button
              onClick={toggleSettings}
              className="ml-1 text-blue-600 hover:underline"
            >
              Customize settings
            </button>
          )}
        </p>
      </div>
    </div>
  );
} 