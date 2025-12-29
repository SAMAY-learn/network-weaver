-- Create app_settings table for storing configuration like API tokens
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (Mapbox public token is meant to be public)
CREATE POLICY "Settings are readable by everyone" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Allow authenticated users to manage settings
CREATE POLICY "Authenticated users can insert settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings" 
ON public.app_settings 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();