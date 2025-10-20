-- Allow AMA creators to view messages from their own AMAs (including private ones)
CREATE POLICY "AMA creators can view their own messages"
ON ama_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM amas 
    WHERE amas.id = ama_messages.ama_id 
    AND amas.creator_address = auth.jwt() ->> 'sub'
  )
);