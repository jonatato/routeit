-- Fix RLS policy to allow updating cover_image column
-- The issue is that RLS policies might be blocking updates to new columns

-- Drop existing UPDATE policy if it exists (we'll recreate it properly)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON itineraries;

-- Create a comprehensive UPDATE policy that allows all columns
CREATE POLICY "Users can update their own itineraries" ON itineraries
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure collaborators can update if they have permission
CREATE POLICY "Collaborators can update shared itineraries" ON itineraries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM itinerary_collaborators
    WHERE itinerary_collaborators.itinerary_id = itineraries.id
    AND itinerary_collaborators.user_id = auth.uid()
    AND itinerary_collaborators.role IN ('editor', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM itinerary_collaborators
    WHERE itinerary_collaborators.itinerary_id = itineraries.id
    AND itinerary_collaborators.user_id = auth.uid()
    AND itinerary_collaborators.role IN ('editor', 'owner')
  )
);
