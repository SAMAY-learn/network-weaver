import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, CollectionReturnValue } from 'cytoscape';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkGraph, NetworkNode, NetworkEdge } from '@/hooks/useNetworkGraph';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, X, Route, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for when database is empty
const mockNodes: NetworkNode[] = [
  { id: 'K1', type: 'suspect', label: 'KINGPIN-001', x: 400, y: 300, threat: 'high', connections: 12 },
  { id: 'K2', type: 'suspect', label: 'KINGPIN-002', x: 600, y: 250, threat: 'high', connections: 9 },
  { id: 'S1', type: 'suspect', label: 'SUSPECT-A', x: 250, y: 200, threat: 'medium', connections: 5 },
  { id: 'S2', type: 'suspect', label: 'SUSPECT-B', x: 550, y: 400, threat: 'medium', connections: 4 },
  { id: 'S3', type: 'suspect', label: 'SUSPECT-C', x: 700, y: 350, threat: 'low', connections: 3 },
  { id: 'S4', type: 'suspect', label: 'SUSPECT-D', x: 300, y: 420, threat: 'medium', connections: 6 },
  { id: 'SIM1', type: 'sim', label: '+91-XXX-4521', x: 180, y: 300, threat: 'medium', connections: 3 },
  { id: 'SIM2', type: 'sim', label: '+91-XXX-8834', x: 480, y: 180, threat: 'high', connections: 4 },
  { id: 'SIM3', type: 'sim', label: '+91-XXX-2290', x: 720, y: 220, threat: 'medium', connections: 2 },
  { id: 'SIM4', type: 'sim', label: '+91-XXX-6671', x: 350, y: 150, threat: 'low', connections: 2 },
  { id: 'D1', type: 'device', label: 'IMEI-8821', x: 150, y: 400, threat: 'medium', connections: 3 },
  { id: 'D2', type: 'device', label: 'IMEI-3394', x: 500, y: 480, threat: 'high', connections: 5 },
  { id: 'D3', type: 'device', label: 'IMEI-7756', x: 650, y: 150, threat: 'low', connections: 2 },
  { id: 'A1', type: 'account', label: 'MULE-ACC-01', x: 200, y: 480, threat: 'high', connections: 4 },
  { id: 'A2', type: 'account', label: 'MULE-ACC-02', x: 420, y: 520, threat: 'high', connections: 3 },
  { id: 'A3', type: 'account', label: 'MULE-ACC-03', x: 750, y: 420, threat: 'medium', connections: 2 },
  { id: 'IP1', type: 'ip', label: '192.168.X.X', x: 100, y: 250, threat: 'medium', connections: 2 },
  { id: 'IP2', type: 'ip', label: '10.0.X.X', x: 780, y: 300, threat: 'low', connections: 2 },
];

const mockEdges: NetworkEdge[] = [
  { from: 'K1', to: 'S1', type: 'call' },
  { from: 'K1', to: 'S2', type: 'call' },
  { from: 'K1', to: 'S4', type: 'call' },
  { from: 'K1', to: 'SIM2', type: 'shared_device' },
  { from: 'K1', to: 'A1', type: 'transaction' },
  { from: 'K1', to: 'A2', type: 'transaction' },
  { from: 'K2', to: 'S2', type: 'call' },
  { from: 'K2', to: 'S3', type: 'call' },
  { from: 'K2', to: 'SIM3', type: 'shared_device' },
  { from: 'K2', to: 'D3', type: 'shared_device' },
  { from: 'K2', to: 'A3', type: 'transaction' },
  { from: 'S1', to: 'SIM1', type: 'shared_device' },
  { from: 'S1', to: 'SIM4', type: 'shared_device' },
  { from: 'S1', to: 'D1', type: 'shared_device' },
  { from: 'S1', to: 'IP1', type: 'shared_ip' },
  { from: 'S2', to: 'D2', type: 'shared_device' },
  { from: 'S2', to: 'A2', type: 'transaction' },
  { from: 'S3', to: 'IP2', type: 'shared_ip' },
  { from: 'S4', to: 'D1', type: 'shared_device' },
  { from: 'S4', to: 'A1', type: 'transaction' },
  { from: 'SIM1', to: 'D1', type: 'shared_device' },
  { from: 'SIM2', to: 'D2', type: 'shared_device' },
  { from: 'D2', to: 'A2', type: 'transaction' },
];

const getNodeColor = (type: NetworkNode['type'], threat: NetworkNode['threat']) => {
  const colors = {
    suspect: { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' },
    sim: { high: '#ec4899', medium: '#a855f7', low: '#8b5cf6' },
    device: { high: '#f97316', medium: '#fb923c', low: '#fdba74' },
    account: { high: '#dc2626', medium: '#ea580c', low: '#65a30d' },
    ip: { high: '#be123c', medium: '#4f46e5', low: '#0891b2' },
  };
  return colors[type][threat];
};

const getNodeShape = (type: NetworkNode['type']) => {
  switch (type) {
    case 'suspect': return 'ellipse';
    case 'sim': return 'diamond';
    case 'device': return 'rectangle';
    case 'account': return 'hexagon';
    case 'ip': return 'triangle';
    default: return 'ellipse';
  }
};

const getEdgeColor = (type: NetworkEdge['type']) => {
  switch (type) {
    case 'call': return '#0ea5e9';
    case 'transaction': return '#f59e0b';
    case 'shared_device': return '#a855f7';
    case 'shared_ip': return '#22c55e';
    default: return '#64748b';
  }
};

interface SelectedNodeInfo {
  id: string;
  label: string;
  type: NetworkNode['type'];
  threat: NetworkNode['threat'];
  connections: number;
}

interface PathNode {
  id: string;
  label: string;
}

const CytoscapeGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { data: networkData, isLoading } = useNetworkGraph();
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<PathNode | null>(null);
  const [pathEnd, setPathEnd] = useState<PathNode | null>(null);
  const [pathFound, setPathFound] = useState<boolean | null>(null);
  const [pathLength, setPathLength] = useState<number>(0);

  const nodes = networkData?.nodes.length ? networkData.nodes : mockNodes;
  const edges = networkData?.edges.length ? networkData.edges : mockEdges;

  useEffect(() => {
    if (!containerRef.current || isLoading) return;

    // Convert data to Cytoscape format
    const elements = [
      ...nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          threat: node.threat,
          connections: node.connections,
        },
        position: { x: node.x, y: node.y },
      })),
      ...edges.map((edge, index) => ({
        data: {
          id: `edge-${index}`,
          source: edge.from,
          target: edge.to,
          edgeType: edge.type,
        },
      })),
    ];

    // Initialize Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: NodeSingular) => getNodeColor(ele.data('type'), ele.data('threat')),
            'shape': (ele: NodeSingular) => getNodeShape(ele.data('type')) as any,
            'width': (ele: NodeSingular) => ele.data('type') === 'suspect' ? 50 : 35,
            'height': (ele: NodeSingular) => ele.data('type') === 'suspect' ? 50 : 35,
            'label': 'data(label)',
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'color': '#e2e8f0',
            'text-valign': 'bottom',
            'text-margin-y': 8,
            'border-width': 3,
            'border-color': (ele: NodeSingular) => getNodeColor(ele.data('type'), ele.data('threat')),
            'border-opacity': 0.5,
            'background-opacity': 0.85,
            'text-background-color': '#0f172a',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
          } as any,
        },
        {
          selector: 'node[threat = "high"]',
          style: {
            'border-width': 4,
            'shadow-blur': 20,
            'shadow-color': '#ef4444',
            'shadow-opacity': 0.6,
          } as any,
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': (ele: any) => getEdgeColor(ele.data('edgeType')),
            'target-arrow-color': (ele: any) => getEdgeColor(ele.data('edgeType')),
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7,
          } as any,
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 5,
            'border-color': '#0ea5e9',
            'shadow-blur': 30,
            'shadow-color': '#0ea5e9',
            'shadow-opacity': 0.8,
          } as any,
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 4,
            'opacity': 1,
          },
        },
        {
          selector: '.path-highlighted',
          style: {
            'background-color': '#06b6d4',
            'border-color': '#06b6d4',
            'border-width': 5,
            'shadow-blur': 30,
            'shadow-color': '#06b6d4',
            'shadow-opacity': 0.9,
            'z-index': 999,
          } as any,
        },
        {
          selector: '.path-edge-highlighted',
          style: {
            'width': 5,
            'line-color': '#06b6d4',
            'target-arrow-color': '#06b6d4',
            'opacity': 1,
            'z-index': 999,
          } as any,
        },
        {
          selector: '.path-start',
          style: {
            'background-color': '#22c55e',
            'border-color': '#22c55e',
            'border-width': 6,
            'shadow-blur': 35,
            'shadow-color': '#22c55e',
            'shadow-opacity': 1,
          } as any,
        },
        {
          selector: '.path-end',
          style: {
            'background-color': '#ef4444',
            'border-color': '#ef4444',
            'border-width': 6,
            'shadow-blur': 35,
            'shadow-color': '#ef4444',
            'shadow-opacity': 1,
          } as any,
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15,
          } as any,
        },
      ],
      layout: {
        name: 'preset',
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      wheelSensitivity: 0.3,
      minZoom: 0.3,
      maxZoom: 3,
    });

    // Node click handler
    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
        threat: node.data('threat'),
        connections: node.data('connections'),
      });
    });

    // Background click to deselect
    cyRef.current.on('tap', (evt) => {
      if (evt.target === cyRef.current) {
        setSelectedNode(null);
      }
    });

    // Fit graph to container
    cyRef.current.fit(undefined, 50);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [nodes, edges, isLoading]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.3);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.3);
    }
  };

  const handleFit = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
    }
  }, []);

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.reset();
      cyRef.current.fit(undefined, 50);
    }
  };

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Path finding function
  const findAndHighlightPath = useCallback((startId: string, endId: string) => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    
    // Clear previous highlighting
    cy.elements().removeClass('path-highlighted path-edge-highlighted path-start path-end dimmed');
    
    // Use Dijkstra's algorithm to find shortest path
    const dijkstra = cy.elements().dijkstra({
      root: `#${startId}`,
      directed: false,
    });
    
    const pathToTarget = dijkstra.pathTo(cy.$(`#${endId}`));
    
    if (pathToTarget.length > 0) {
      // Dim all elements first
      cy.elements().addClass('dimmed');
      
      // Highlight the path
      pathToTarget.removeClass('dimmed');
      pathToTarget.nodes().addClass('path-highlighted');
      pathToTarget.edges().addClass('path-edge-highlighted');
      
      // Mark start and end
      cy.$(`#${startId}`).addClass('path-start').removeClass('path-highlighted');
      cy.$(`#${endId}`).addClass('path-end').removeClass('path-highlighted');
      
      // Fit to path with padding
      cy.fit(pathToTarget, 80);
      
      setPathFound(true);
      setPathLength(pathToTarget.nodes().length);
    } else {
      setPathFound(false);
      setPathLength(0);
    }
  }, []);

  // Clear path highlighting
  const clearPath = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass('path-highlighted path-edge-highlighted path-start path-end dimmed');
    }
    setPathStart(null);
    setPathEnd(null);
    setPathFound(null);
    setPathLength(0);
  }, []);

  // Toggle path mode
  const togglePathMode = useCallback(() => {
    if (pathMode) {
      clearPath();
    }
    setPathMode(prev => !prev);
  }, [pathMode, clearPath]);

  // Handle node click for path selection
  useEffect(() => {
    if (!cyRef.current || !pathMode) return;

    const handleNodeClick = (evt: any) => {
      const node = evt.target;
      const nodeInfo: PathNode = {
        id: node.id(),
        label: node.data('label'),
      };

      if (!pathStart) {
        setPathStart(nodeInfo);
        node.addClass('path-start');
      } else if (!pathEnd && node.id() !== pathStart.id) {
        setPathEnd(nodeInfo);
        findAndHighlightPath(pathStart.id, node.id());
      }
    };

    cyRef.current.on('tap', 'node', handleNodeClick);

    return () => {
      cyRef.current?.off('tap', 'node', handleNodeClick);
    };
  }, [pathMode, pathStart, pathEnd, findAndHighlightPath]);

  // Handle ESC key to exit fullscreen or path mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pathMode) {
          clearPath();
          setPathMode(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, pathMode, clearPath]);

  const getNodeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'suspect': return '👤';
      case 'sim': return '📱';
      case 'device': return '💻';
      case 'account': return '💰';
      case 'ip': return '🌐';
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-full min-h-[500px] network-grid rounded-xl overflow-hidden flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        className={`${
          isFullscreen 
            ? 'fixed inset-0 z-50 bg-background' 
            : 'relative w-full h-full min-h-[500px]'
        } network-grid rounded-xl overflow-hidden`}
        layout
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Cytoscape container */}
        <div ref={containerRef} className="absolute inset-0" />

        {/* Fullscreen close button */}
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10"
          >
            <Button 
              variant="glass" 
              size="sm" 
              onClick={toggleFullscreen}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Exit Fullscreen (ESC)
            </Button>
          </motion.div>
        )}

        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button variant="glass" size="icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="glass" size="icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant={pathMode ? "default" : "glass"} 
            size="icon" 
            onClick={togglePathMode} 
            title="Trace Path Between Nodes"
            className={pathMode ? "bg-cyan-500 hover:bg-cyan-600" : ""}
          >
            <Route className="w-4 h-4" />
          </Button>
          <Button 
            variant="glass" 
            size="icon" 
            onClick={toggleFullscreen} 
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="glass" size="icon" onClick={handleReset} title="Reset View">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Path Mode UI */}
        {pathMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 glass-card p-4 rounded-xl w-72 z-10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-foreground">Path Tracing</span>
              </div>
              <Button variant="ghost" size="icon" onClick={togglePathMode} className="h-6 w-6">
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <span className="text-muted-foreground">Start:</span>
                <span className="text-foreground font-mono truncate">
                  {pathStart?.label || 'Click a node...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-muted-foreground">End:</span>
                <span className="text-foreground font-mono truncate">
                  {pathEnd?.label || 'Click another node...'}
                </span>
              </div>
            </div>

            {pathFound !== null && (
              <div className={`mt-3 p-2 rounded-lg ${pathFound ? 'bg-cyan-500/20' : 'bg-destructive/20'}`}>
                {pathFound ? (
                  <div className="text-xs text-cyan-400">
                    <span className="font-semibold">Path found!</span>
                    <span className="ml-2">{pathLength} nodes connected</span>
                  </div>
                ) : (
                  <div className="text-xs text-destructive">No path exists between nodes</div>
                )}
              </div>
            )}

            {(pathStart || pathEnd) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearPath}
                className="w-full mt-3 text-xs"
              >
                Clear Selection
              </Button>
            )}
          </motion.div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-card p-3 rounded-lg z-10">
          <div className="text-xs font-semibold text-muted-foreground mb-2">NODE TYPES</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span>👤</span>
              <span className="text-muted-foreground">Suspect</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>📱</span>
              <span className="text-muted-foreground">SIM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>💻</span>
              <span className="text-muted-foreground">Device</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>💰</span>
              <span className="text-muted-foreground">Account</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🌐</span>
              <span className="text-muted-foreground">IP</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground mt-3 mb-2">EDGE TYPES</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#0ea5e9]" />
              <span className="text-muted-foreground">Call</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#f59e0b]" />
              <span className="text-muted-foreground">Transaction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#a855f7]" />
              <span className="text-muted-foreground">Shared Device</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 bg-[#22c55e]" />
              <span className="text-muted-foreground">Shared IP</span>
            </div>
          </div>
        </div>

        {/* Selected Node Info - only show when not in path mode */}
        {selectedNode && !pathMode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 glass-card p-4 rounded-xl w-64 z-10"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{getNodeIcon(selectedNode.type)}</span>
              <span className={`text-xs font-mono px-2 py-1 rounded ${
                selectedNode.threat === 'high' ? 'threat-badge-high' :
                selectedNode.threat === 'medium' ? 'threat-badge-medium' :
                'threat-badge-low'
              }`}>
                {selectedNode.threat.toUpperCase()} THREAT
              </span>
            </div>
            <div className="font-mono text-sm text-primary mb-2">{selectedNode.label}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Type: <span className="text-foreground capitalize">{selectedNode.type}</span></div>
              <div>Connections: <span className="text-foreground">{selectedNode.connections}</span></div>
              <div>ID: <span className="text-foreground">{selectedNode.id.slice(0, 8)}...</span></div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CytoscapeGraph;
