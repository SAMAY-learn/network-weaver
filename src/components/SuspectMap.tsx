import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Suspect } from '@/hooks/useSuspects';
import { MapPin, AlertTriangle, Loader2, X, RefreshCw, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

// Jharkhand district coordinates
const JHARKHAND_LOCATIONS: Record<string, [number, number]> = {
  'Jamtara': [86.8013, 23.9577],
  'Deoghar': [86.6925, 24.4854],
  'Dumka': [87.2480, 24.2651],
  'Ranchi': [85.3096, 23.3441],
  'Jamshedpur': [86.1833, 22.8046],
  'Dhanbad': [86.4305, 23.7957],
  'Bokaro': [86.1511, 23.6693],
  'Hazaribagh': [85.3569, 23.9921],
  'Giridih': [86.3039, 24.1941],
  'Godda': [87.2127, 24.8271],
  'Sahebganj': [87.6438, 25.2518],
  'Pakur': [87.8395, 24.6358],
  'Koderma': [85.5944, 24.4676],
  'Chatra': [84.8699, 24.2057],
  'Palamu': [84.0730, 24.0269],
  'Garhwa': [83.8047, 24.1577],
  'Latehar': [84.5138, 23.7407],
  'Lohardaga': [84.6836, 23.4327],
  'Gumla': [84.5420, 23.0449],
  'Simdega': [84.5051, 22.6152],
  'Khunti': [85.2786, 23.0715],
  'Ramgarh': [85.5619, 23.6302],
  'Seraikela': [85.8325, 22.6100],
  'West Singhbhum': [85.8245, 22.3615],
  'East Singhbhum': [86.1833, 22.8046],
};

// Jharkhand center coordinates
const JHARKHAND_CENTER: [number, number] = [85.5, 23.6];

interface SuspectMapProps {
  suspects: Suspect[];
  onSuspectClick?: (suspectId: string) => void;
  onClose?: () => void;
}

const SuspectMap: React.FC<SuspectMapProps> = ({ suspects, onSuspectClick, onClose }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Mapbox token from database
  const fetchToken = async (isRetry = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const { data, error: dbError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'MAPBOX_PUBLIC_TOKEN')
        .maybeSingle();
      
      if (dbError) {
        console.error('Error fetching Mapbox token:', dbError);
        setError('Failed to load map configuration');
        return;
      }
      
      if (data?.value) {
        setMapboxToken(data.value);
      }
    } catch (err) {
      console.error('Error fetching Mapbox token:', err);
      setError('Failed to load map configuration');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  // Save token to database
  const saveToken = async () => {
    if (!tokenInput.trim()) {
      toast.error('Please enter a valid Mapbox token');
      return;
    }

    setIsSaving(true);
    try {
      const { error: upsertError } = await supabase
        .from('app_settings')
        .upsert(
          { key: 'MAPBOX_PUBLIC_TOKEN', value: tokenInput.trim() },
          { onConflict: 'key' }
        );

      if (upsertError) {
        console.error('Error saving token:', upsertError);
        toast.error('Failed to save token');
        return;
      }

      toast.success('Mapbox token saved successfully');
      setMapboxToken(tokenInput.trim());
      setTokenInput('');
    } catch (err) {
      console.error('Error saving token:', err);
      toast.error('Failed to save token');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  // Group suspects by location with coordinates
  const suspectsByLocation = React.useMemo(() => {
    const grouped: Record<string, { 
      coords: [number, number]; 
      suspects: Suspect[];
      threatCounts: { high: number; medium: number; low: number };
    }> = {};

    suspects.forEach(suspect => {
      if (!suspect.location) return;
      
      // Find matching location
      const locationKey = Object.keys(JHARKHAND_LOCATIONS).find(
        loc => suspect.location?.toLowerCase().includes(loc.toLowerCase())
      );

      if (locationKey) {
        if (!grouped[locationKey]) {
          grouped[locationKey] = {
            coords: JHARKHAND_LOCATIONS[locationKey],
            suspects: [],
            threatCounts: { high: 0, medium: 0, low: 0 },
          };
        }
        grouped[locationKey].suspects.push(suspect);
        const level = suspect.threat_level || 'low';
        grouped[locationKey].threatCounts[level]++;
      }
    });

    return grouped;
  }, [suspects]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: JHARKHAND_CENTER,
        zoom: 7,
        pitch: 30,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapReady(true);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        const mapError = e.error as { status?: number; message?: string } | undefined;
        if (mapError?.status === 401 || mapError?.status === 403) {
          setError('Invalid Mapbox token. Please update the token in Cloud secrets.');
        }
      });

      return () => {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        map.current?.remove();
        map.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to initialize map');
    }
  }, [mapboxToken]);

  // Add markers when map is ready
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    Object.entries(suspectsByLocation).forEach(([location, data]) => {
      const { coords, suspects: locationSuspects, threatCounts } = data;
      
      // Determine marker color based on threat levels
      const dominantThreat = threatCounts.high > 0 ? 'high' : 
                             threatCounts.medium > 0 ? 'medium' : 'low';
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'suspect-marker';
      
      const size = Math.min(24 + locationSuspects.length * 4, 48);
      const colors = {
        high: '#ef4444',
        medium: '#f59e0b', 
        low: '#22c55e',
      };
      
      el.innerHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${colors[dominantThreat]}40;
          border: 2px solid ${colors[dominantThreat]};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 0 0 20px ${colors[dominantThreat]}60;
        ">
          <span style="
            color: ${colors[dominantThreat]};
            font-weight: bold;
            font-size: ${Math.max(12, size / 3)}px;
          ">${locationSuspects.length}</span>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.querySelector('div')!.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.querySelector('div')!.style.transform = 'scale(1)';
      });

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="
            background: #1a1a2e;
            padding: 12px;
            border-radius: 8px;
            min-width: 180px;
          ">
            <h3 style="
              color: #fff;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span style="color: ${colors[dominantThreat]}">●</span>
              ${location}
            </h3>
            <div style="color: #a0aec0; font-size: 12px; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Suspects:</span>
                <span style="color: #fff; font-weight: 500;">${locationSuspects.length}</span>
              </div>
              ${threatCounts.high > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #ef4444;">High Risk:</span>
                  <span style="color: #ef4444; font-weight: 500;">${threatCounts.high}</span>
                </div>
              ` : ''}
              ${threatCounts.medium > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #f59e0b;">Medium Risk:</span>
                  <span style="color: #f59e0b; font-weight: 500;">${threatCounts.medium}</span>
                </div>
              ` : ''}
              ${threatCounts.low > 0 ? `
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #22c55e;">Low Risk:</span>
                  <span style="color: #22c55e; font-weight: 500;">${threatCounts.low}</span>
                </div>
              ` : ''}
            </div>
            <div style="
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #2d3748;
              font-size: 11px;
              color: #718096;
            ">
              Click to view suspects
            </div>
          </div>
        `);

      el.addEventListener('click', () => {
        // If there's only one suspect, open their detail
        if (locationSuspects.length === 1 && onSuspectClick) {
          onSuspectClick(locationSuspects[0].id);
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [suspectsByLocation, isMapReady, onSuspectClick]);

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl border border-border/50 flex items-center justify-center h-[400px]"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl border border-border/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">Map Configuration Error</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchToken(true)}
              disabled={isRetrying}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // No token state - show input form
  if (!mapboxToken) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-xl border border-border/50"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-foreground">Mapbox Token Required</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your Mapbox public token to display the map.
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Token input form */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 font-mono text-sm"
              onKeyDown={(e) => e.key === 'Enter' && saveToken()}
            />
            <Button 
              onClick={saveToken}
              disabled={isSaving || !tokenInput.trim()}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Token
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">How to get your Mapbox token:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">mapbox.com</a> and create an account</li>
              <li>Navigate to your Account → Tokens page</li>
              <li>Copy your default public token (starts with <span className="font-mono bg-background px-1 rounded">pk.</span>)</li>
              <li>Paste it above and click "Save Token"</li>
            </ol>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl border border-border/50 overflow-hidden"
    >
      {/* Map Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Suspect Locations - Jharkhand</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">High</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-[400px]" />
      
      {/* Stats Footer */}
      <div className="flex items-center justify-between p-3 border-t border-border/30 bg-secondary/20">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            {Object.keys(suspectsByLocation).length} locations • {suspects.filter(s => s.location).length} mapped suspects
          </span>
        </div>
        {suspects.filter(s => !s.location || !Object.keys(JHARKHAND_LOCATIONS).some(
          loc => s.location?.toLowerCase().includes(loc.toLowerCase())
        )).length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3" />
            {suspects.filter(s => !s.location || !Object.keys(JHARKHAND_LOCATIONS).some(
              loc => s.location?.toLowerCase().includes(loc.toLowerCase())
            )).length} suspects without mappable location
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SuspectMap;
