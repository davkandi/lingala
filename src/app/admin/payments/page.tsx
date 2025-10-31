'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Payment {
  id: number;
  userId: string;
  stripePaymentIntentId: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch('/api/admin/payments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        calculateStats(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentData: Payment[]) => {
    const totalRevenue = paymentData
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const successfulPayments = paymentData.filter(p => p.status === 'succeeded').length;
    const failedPayments = paymentData.filter(p => p.status === 'failed').length;

    setStats({
      totalRevenue,
      totalPayments: paymentData.length,
      successfulPayments,
      failedPayments,
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-2">Loading payment data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight">Payments & Revenue</h1>
        <p className="text-muted-foreground">Monitor your payment activity and revenue</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue.toString())}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
            <CreditCard className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.successfulPayments}</div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.failedPayments}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>
              Latest payment transactions from your courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.stripePaymentIntentId?.substring(0, 20)}...
                      </TableCell>
                      <TableCell>{payment.userId}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
                <p className="text-muted-foreground">
                  Payments will appear here once users start enrolling in courses.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}