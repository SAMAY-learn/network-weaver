-- Create watchlist table
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suspect_id UUID NOT NULL REFERENCES public.suspects(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create review_flags table
CREATE TABLE public.review_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suspect_id UUID NOT NULL REFERENCES public.suspects(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on watchlist
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for watchlist
CREATE POLICY "Authenticated users can view watchlist"
ON public.watchlist FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert to watchlist"
ON public.watchlist FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update watchlist"
ON public.watchlist FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete from watchlist"
ON public.watchlist FOR DELETE USING (true);

-- Enable RLS on review_flags
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_flags
CREATE POLICY "Authenticated users can view review_flags"
ON public.review_flags FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert review_flags"
ON public.review_flags FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update review_flags"
ON public.review_flags FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete review_flags"
ON public.review_flags FOR DELETE USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_flags;