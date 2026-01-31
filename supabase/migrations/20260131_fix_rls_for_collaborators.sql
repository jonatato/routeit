-- Fix RLS to allow owner AND collaborators to update itineraries
-- This replaces the restrictive itineraries_write policy

-- Helper function to check collaborator role without triggering recursive RLS
CREATE OR REPLACE FUNCTION public.is_itinerary_editor(itinerary_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.itinerary_collaborators ic
    WHERE ic.itinerary_id = itinerary_uuid
    AND ic.user_id = auth.uid()
    AND ic.role IN ('editor', 'owner')
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "itineraries_write" ON public.itineraries;
DROP POLICY IF EXISTS "itineraries_read" ON public.itineraries;
DROP POLICY IF EXISTS "itineraries_insert" ON public.itineraries;
DROP POLICY IF EXISTS "itineraries_update" ON public.itineraries;
DROP POLICY IF EXISTS "itineraries_delete" ON public.itineraries;

-- Read policy (SELECT)
CREATE POLICY "itineraries_read" ON public.itineraries
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  OR
  is_itinerary_editor(id)
);

-- Insert policy
CREATE POLICY "itineraries_insert" ON public.itineraries
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

-- Update policy
CREATE POLICY "itineraries_update" ON public.itineraries
FOR UPDATE
TO public
USING (
  auth.uid() = user_id
  OR
  is_itinerary_editor(id)
)
WITH CHECK (
  auth.uid() = user_id
  OR
  is_itinerary_editor(id)
);

-- Delete policy
CREATE POLICY "itineraries_delete" ON public.itineraries
FOR DELETE
TO public
USING (
  auth.uid() = user_id
  OR
  is_itinerary_editor(id)
);
