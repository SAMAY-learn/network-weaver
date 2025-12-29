import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNetworkGraph, NetworkNode, NetworkEdge } from '@/hooks/useNetworkGraph';
import { Skeleton } from '@/components/ui/skeleton';

const getNodeColor = (type: NetworkNode['type'], threat: NetworkNode['threat']) => {
  const colors = {
    suspect: {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#22c55e',
    },
    sim: {
      high: '#ec4899',
      medium: '#a855f7',
      low: '#8b5cf6',
    },
    device: {
      high: '#f97316',
      medium: '#fb923c',
      low: '#fdba74',
    },
    account: {
      high: '#dc2626',
      medium: '#ea580c',
      low: '#65a30d',
    },
    ip: {
      high: '#be123c',
      medium: '#4f46e5',
      low: '#0891b2',
    },
  };
  return colors[type][threat];
};

const getNodeIcon = (type: NetworkNode['type']) => {
  switch (type) {
    case 'suspect': return '👤';
    case 'sim': return '📱';
    case 'device': return '💻';
    case 'account': return '💰';
    case 'ip': return '🌐';
  }
};

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

const NetworkGraph = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: networkData, isLoading } = useNetworkGraph();
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const animationRef = useRef<number>();

  // Use real data if available, otherwise use mock data
  const nodes = networkData?.nodes.length ? networkData.nodes : mockNodes;
  const edges = networkData?.edges.length ? networkData.edges : mockEdges;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    
    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw edges with animation
      edges.forEach((edge, index) => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;

        const scaleX = canvas.width / 900;
        const scaleY = canvas.height / 600;

        const x1 = fromNode.x * scaleX;
        const y1 = fromNode.y * scaleY;
        const x2 = toNode.x * scaleX;
        const y2 = toNode.y * scaleY;

        // Animated gradient along edge
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        const pulseOffset = (Math.sin(time * 2 + index * 0.5) + 1) / 2;
        
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.1)');
        gradient.addColorStop(pulseOffset, 'rgba(14, 165, 233, 0.6)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0.1)');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated data packet
        const packetPos = (time * 0.3 + index * 0.1) % 1;
        const packetX = x1 + (x2 - x1) * packetPos;
        const packetY = y1 + (y2 - y1) * packetPos;

        ctx.beginPath();
        ctx.arc(packetX, packetY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(14, 233, 233, 0.8)';
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((node) => {
        const scaleX = canvas.width / 900;
        const scaleY = canvas.height / 600;
        const x = node.x * scaleX;
        const y = node.y * scaleY;
        
        const baseSize = node.type === 'suspect' ? 25 : 18;
        const size = baseSize + Math.sin(time * 2 + node.x) * 3;
        
        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        const color = getNodeColor(node.type, node.threat);
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color + 'cc';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Threat ring for high-threat nodes
        if (node.threat === 'high') {
          ctx.beginPath();
          ctx.arc(x, y, size + 8 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = canvas.width / 900;
    const scaleY = canvas.height / 600;

    const clickedNode = nodes.find(node => {
      const nodeX = node.x * scaleX;
      const nodeY = node.y * scaleY;
      const dist = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      return dist < 30;
    });

    setSelectedNode(clickedNode || null);
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
    <div className="relative w-full h-full min-h-[500px] network-grid rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-pointer"
      />
      
      {/* Node Labels Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.random() * 0.5 }}
            className="absolute transform -translate-x-1/2 flex flex-col items-center"
            style={{ 
              left: `${(node.x / 900) * 100}%`, 
              top: `${(node.y / 600) * 100}%`,
              marginTop: node.type === 'suspect' ? '-50px' : '-40px'
            }}
          >
            <span className="text-lg">{getNodeIcon(node.type)}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              node.threat === 'high' ? 'bg-destructive/30 text-destructive' :
              node.threat === 'medium' ? 'bg-warning/30 text-warning' :
              'bg-success/30 text-success'
            }`}>
              {node.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-3 rounded-lg">
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
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 glass-card p-4 rounded-xl w-64"
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
    </div>
  );
};

export default NetworkGraph;
