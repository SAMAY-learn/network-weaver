import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  AlertTriangle,
  Users,
  IndianRupee,
  MapPin,
  Scale,
  Shield,
  Briefcase,
  PieChart,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useReportsData } from '@/hooks/useReportsData';
import { exportToCSV, exportToExcel, printPDFReport, formatINR } from '@/lib/exportUtils';
import { useToast } from '@/hooks/use-toast';

const THREAT_COLORS = {
  high: 'hsl(var(--destructive))',
  medium: 'hsl(var(--warning))',
  low: 'hsl(var(--success))',
};

const ReportsPanel = () => {
  const { cases, metrics, locations, exportData, isLoading } = useReportsData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const handleExportCSV = (type: 'suspects' | 'cases' | 'clusters') => {
    if (!exportData) return;
    const data = exportData[type];
    if (data.length === 0) {
      toast({
        title: 'No data to export',
        description: `There are no ${type} records to export.`,
        variant: 'destructive',
      });
      return;
    }
    exportToCSV(data, `crimenet_${type}`);
    toast({
      title: 'Export successful',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} data exported to CSV.`,
    });
  };

  const handleExportExcel = () => {
    if (!exportData) return;
    if (
      exportData.suspects.length === 0 &&
      exportData.cases.length === 0 &&
      exportData.clusters.length === 0
    ) {
      toast({
        title: 'No data to export',
        description: 'There are no records to export.',
        variant: 'destructive',
      });
      return;
    }
    exportToExcel(exportData, 'crimenet_intelligence_report');
    toast({
      title: 'Export successful',
      description: 'Full intelligence report exported to Excel.',
    });
  };

  const handlePrintPDF = () => {
    if (!exportData || !metrics) return;
    printPDFReport(exportData, metrics);
    toast({
      title: 'Report generated',
      description: 'PDF report opened in new window for printing.',
    });
  };

  const threatDistribution = metrics
    ? [
        { name: 'High', value: metrics.highThreat, color: THREAT_COLORS.high },
        { name: 'Medium', value: metrics.mediumThreat, color: THREAT_COLORS.medium },
        { name: 'Low', value: metrics.lowThreat, color: THREAT_COLORS.low },
      ]
    : [];

  const locationChartData = locations.map((l) => ({
    name: l.location.length > 15 ? l.location.substring(0, 15) + '...' : l.location,
    suspects: l.count,
    fraud: l.fraudAmount / 100000, // Convert to Lakhs
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Intelligence Reports
          </h2>
          <p className="text-muted-foreground text-sm">
            Generated reports and threat analysis dashboards
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExportCSV('suspects')}>
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
          <Button variant="cyber" size="sm" onClick={handlePrintPDF}>
            <Printer className="w-4 h-4" />
            PDF Report
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20">
            <PieChart className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cases" className="data-[state=active]:bg-primary/20">
            <Briefcase className="w-4 h-4 mr-2" />
            Cases
          </TabsTrigger>
          <TabsTrigger value="threats" className="data-[state=active]:bg-primary/20">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Threat Analysis
          </TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-primary/20">
            <MapPin className="w-4 h-4 mr-2" />
            Geographic
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-card border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Suspects</p>
                      <p className="text-3xl font-bold text-foreground">{metrics?.totalSuspects || 0}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">High Threat</p>
                      <p className="text-3xl font-bold text-destructive">{metrics?.highThreat || 0}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-destructive/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Cases</p>
                      <p className="text-3xl font-bold text-warning">{metrics?.activeCases || 0}</p>
                    </div>
                    <Briefcase className="w-10 h-10 text-warning/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fraud</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatINR(metrics?.totalFraudAmount || 0)}
                      </p>
                    </div>
                    <IndianRupee className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Threat Distribution Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-primary" />
                    Threat Level Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={threatDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {threatDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Location Bar Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card border-border/50 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Suspects by Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={locationChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="suspects" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Quick Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Frozen Accounts</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{metrics?.frozenAccounts || 0}</span>
                      <Scale className="w-5 h-5 text-success" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Active Devices</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{metrics?.activeDevices || 0}</span>
                      <Badge variant="outline">Monitored</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Threat Coverage</p>
                    <Progress
                      value={
                        metrics?.totalSuspects
                          ? ((metrics.highThreat + metrics.mediumThreat) / metrics.totalSuspects) * 100
                          : 0
                      }
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {metrics?.totalSuspects
                        ? Math.round(
                            ((metrics.highThreat + metrics.mediumThreat) / metrics.totalSuspects) * 100
                          )
                        : 0}
                      % identified as medium/high threat
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Cases</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{cases.length}</span>
                      <Badge variant="secondary">{metrics?.activeCases || 0} Active</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-6 mt-6">
          <Card className="glass-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Case Summary Reports
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExportCSV('cases')}>
                <Download className="w-4 h-4 mr-2" />
                Export Cases
              </Button>
            </CardHeader>
            <CardContent>
              {cases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No cases found in the database.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case Number</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Suspects</TableHead>
                      <TableHead>Fraud Amount</TableHead>
                      <TableHead>Victims</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm">{c.case_number}</TableCell>
                        <TableCell className="font-medium">{c.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.status === 'active'
                                ? 'destructive'
                                : c.status === 'monitoring'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {c.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{c.location || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.suspect_count}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{formatINR(c.fraud_amount)}</TableCell>
                        <TableCell>{c.victim_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* High Threat Card */}
            <Card className="glass-card border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  High Threat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-destructive mb-2">
                  {metrics?.highThreat || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Suspects requiring immediate attention
                </p>
                <Progress
                  value={
                    metrics?.totalSuspects
                      ? (metrics.highThreat / metrics.totalSuspects) * 100
                      : 0
                  }
                  className="mt-4 h-2 bg-destructive/20"
                />
              </CardContent>
            </Card>

            {/* Medium Threat Card */}
            <Card className="glass-card border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Shield className="w-5 h-5" />
                  Medium Threat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-warning mb-2">
                  {metrics?.mediumThreat || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Suspects under monitoring
                </p>
                <Progress
                  value={
                    metrics?.totalSuspects
                      ? (metrics.mediumThreat / metrics.totalSuspects) * 100
                      : 0
                  }
                  className="mt-4 h-2 bg-warning/20"
                />
              </CardContent>
            </Card>

            {/* Low Threat Card */}
            <Card className="glass-card border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <Users className="w-5 h-5" />
                  Low Threat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-success mb-2">
                  {metrics?.lowThreat || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Suspects with minimal risk
                </p>
                <Progress
                  value={
                    metrics?.totalSuspects
                      ? (metrics.lowThreat / metrics.totalSuspects) * 100
                      : 0
                  }
                  className="mt-4 h-2 bg-success/20"
                />
              </CardContent>
            </Card>
          </div>

          {/* Threat Breakdown Chart */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Threat Level Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={threatDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {threatDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="locations" className="space-y-6 mt-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No location data available.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Suspect Count</TableHead>
                      <TableHead>Fraud Amount</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {loc.location}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{loc.count}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{formatINR(loc.fraudAmount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              loc.count >= 5
                                ? 'destructive'
                                : loc.count >= 3
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {loc.count >= 5 ? 'High' : loc.count >= 3 ? 'Medium' : 'Low'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Location Fraud Chart */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                Fraud Amount by Location (in Lakhs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toFixed(2)}L`, 'Fraud Amount']}
                  />
                  <Bar dataKey="fraud" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPanel;
