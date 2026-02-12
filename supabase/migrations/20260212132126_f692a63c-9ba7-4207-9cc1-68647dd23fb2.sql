-- Allow barangay officials to view user roles (needed for registered residents list)
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role or officials can view all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'mdrrmo_admin'::app_role)
  OR has_role(auth.uid(), 'barangay_official'::app_role)
);