-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('alert', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT, -- 'suspect', 'sim_card', 'device', 'mule_account', 'fraud_cluster'
  entity_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications - users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to generate notification when high-threat suspect is added
CREATE OR REPLACE FUNCTION public.notify_on_high_threat_suspect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only notify for high threat suspects
  IF NEW.threat_level = 'high' THEN
    INSERT INTO public.notifications (type, title, message, entity_type, entity_id)
    VALUES (
      'alert',
      'High Threat Detected',
      'New high-threat suspect identified: ' || NEW.name || COALESCE(' (' || NEW.alias || ')', '') || ' in ' || COALESCE(NEW.location, 'Unknown location'),
      'suspect',
      NEW.id
    );
  ELSIF NEW.threat_level = 'medium' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (type, title, message, entity_type, entity_id)
    VALUES (
      'warning',
      'New Suspect Added',
      'Medium-threat suspect added: ' || NEW.name || COALESCE(' in ' || NEW.location, ''),
      'suspect',
      NEW.id
    );
  END IF;
  
  -- Notify on threat level upgrade
  IF TG_OP = 'UPDATE' AND OLD.threat_level != 'high' AND NEW.threat_level = 'high' THEN
    INSERT INTO public.notifications (type, title, message, entity_type, entity_id)
    VALUES (
      'alert',
      'Threat Level Upgraded',
      'Suspect ' || NEW.name || ' threat level upgraded to HIGH',
      'suspect',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for suspects
CREATE TRIGGER on_suspect_change
AFTER INSERT OR UPDATE ON public.suspects
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_high_threat_suspect();

-- Create function to notify on new SIM cards linked to suspects
CREATE OR REPLACE FUNCTION public.notify_on_sim_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  suspect_name TEXT;
  sim_count INT;
BEGIN
  IF NEW.suspect_id IS NOT NULL THEN
    -- Get suspect name
    SELECT name INTO suspect_name FROM public.suspects WHERE id = NEW.suspect_id;
    
    -- Count SIMs for this suspect
    SELECT COUNT(*) INTO sim_count FROM public.sim_cards WHERE suspect_id = NEW.suspect_id;
    
    -- Notify if suspect has multiple SIMs
    IF sim_count >= 3 THEN
      INSERT INTO public.notifications (type, title, message, entity_type, entity_id)
      VALUES (
        'warning',
        'Suspicious SIM Activity',
        sim_count || ' SIM cards now linked to suspect ' || COALESCE(suspect_name, 'Unknown'),
        'sim_card',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for SIM cards
CREATE TRIGGER on_sim_card_added
AFTER INSERT ON public.sim_cards
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_sim_activity();

-- Create function to notify on large fraud amounts
CREATE OR REPLACE FUNCTION public.notify_on_fraud_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Notify on significant fraud amount updates
  IF NEW.fraud_amount >= 1000000 AND (OLD.fraud_amount IS NULL OR OLD.fraud_amount < 1000000) THEN
    INSERT INTO public.notifications (type, title, message, entity_type, entity_id)
    VALUES (
      'alert',
      'Large Fraud Amount Detected',
      'Suspect ' || NEW.name || ' has fraud amount exceeding ₹10L',
      'suspect',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for fraud amounts
CREATE TRIGGER on_fraud_amount_update
AFTER UPDATE ON public.suspects
FOR EACH ROW
WHEN (OLD.fraud_amount IS DISTINCT FROM NEW.fraud_amount)
EXECUTE FUNCTION public.notify_on_fraud_amount();