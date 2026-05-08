CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view admin directory"
ON public.admin_users
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage admin directory"
ON public.admin_users
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_admin_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_users_set_updated_at ON public.admin_users;

CREATE TRIGGER admin_users_set_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.touch_admin_users_updated_at();

INSERT INTO public.admin_users (user_id, login_id, email)
SELECT
  user_roles.user_id,
  'ADM-' || UPPER(SUBSTR(REPLACE(user_roles.user_id::text, '-', ''), 1, 8)),
  LOWER(auth_users.email)
FROM public.user_roles AS user_roles
JOIN auth.users AS auth_users ON auth_users.id = user_roles.user_id
WHERE user_roles.role = 'admin'
  AND auth_users.email IS NOT NULL
ON CONFLICT (user_id) DO UPDATE
SET
  email = EXCLUDED.email,
  updated_at = now();
