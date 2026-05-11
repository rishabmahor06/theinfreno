-- Member ID series: admin defines prefix + starting number,
-- new members get auto-incremented IDs from the active series.

CREATE TABLE public.member_id_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  start_number INT NOT NULL DEFAULT 1001,
  next_number INT NOT NULL DEFAULT 1001,
  padding INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.member_id_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Series readable by authenticated"
  ON public.member_id_series FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage member_id_series"
  ON public.member_id_series FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Only one active series at a time: when one is set active, deactivate others.
CREATE OR REPLACE FUNCTION public.enforce_single_active_series()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.member_id_series
       SET is_active = false, updated_at = now()
     WHERE id <> NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_single_active_series
AFTER INSERT OR UPDATE OF is_active ON public.member_id_series
FOR EACH ROW WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.enforce_single_active_series();

-- Atomically take the next member id from the active series.
CREATE OR REPLACE FUNCTION public.next_member_id_from_active_series()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s RECORD;
  num INT;
  result TEXT;
BEGIN
  SELECT * INTO s FROM public.member_id_series
   WHERE is_active = true
   ORDER BY updated_at DESC
   LIMIT 1
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  num := s.next_number;
  UPDATE public.member_id_series
     SET next_number = num + 1, updated_at = now()
   WHERE id = s.id;

  IF s.padding > 0 THEN
    result := s.prefix || LPAD(num::text, s.padding, '0');
  ELSE
    result := s.prefix || num::text;
  END IF;

  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.next_member_id_from_active_series() TO authenticated, anon, service_role;
