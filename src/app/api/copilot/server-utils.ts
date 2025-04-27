import { createClient } from '@/utils/supabase/server';

export async function getLatestResumePdfFileNameServer(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: files, error } = await supabase.storage
    .from('user_documents')
    .list(userId, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });
  if (error || !files || files.length === 0) return null;
  const resumeFiles = files
    .filter(f => f.name.startsWith('resume_') && f.name.endsWith('.pdf'))
    .sort((a, b) => {
      const getTime = (name: string) => parseInt(name.split('_')[1]?.split('.')[0] || '0', 10);
      return getTime(b.name) - getTime(a.name);
    });
  return resumeFiles[0]?.name || null;
} 