-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow individual access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete access" ON storage.objects;

-- Create policy to allow users to view their own files
CREATE POLICY "Allow users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  -- Extract the user ID from the path
  -- Path format is: userId/type/filename
  (auth.uid()::text = SPLIT_PART(name, '/', 1))
);

-- Create policy to allow users to upload their own files
CREATE POLICY "Allow users to upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if the path starts with the user's ID
  (auth.uid()::text = SPLIT_PART(name, '/', 1))
);

-- Create policy to allow users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (auth.uid()::text = SPLIT_PART(name, '/', 1))
);

-- Create policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (auth.uid()::text = SPLIT_PART(name, '/', 1))
);

-- Create policy to allow admins full access (optional)
-- Uncomment if you have an admin role
/*
CREATE POLICY "Allow admin full access"
ON storage.objects
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
*/ 