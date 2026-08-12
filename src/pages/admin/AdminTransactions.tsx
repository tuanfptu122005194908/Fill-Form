import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function AdminTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadTxns(); }, [user]);

  const loadTxns = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke('orders', {
      body: { action: 'admin_get_transactions', admin_id: user.user_id },
    });
    setTransactions(data?.transactions || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? transactions : transactions.filter((t: any) => t.type === filter);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold">Tất cả giao dịch</h1>

      <div className="flex gap-2">
        {['all', 'credit', 'debit'].map((f) => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
            className={`rounded-lg ${filter === f ? 'gradient-primary text-primary-foreground' : ''}`}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'Tất cả' : f === 'credit' ? 'Nạp' : 'Trừ'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Chưa có giao dịch</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((txn: any) => (
            <Card key={txn.txn_id} className="glass-strong border-0 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${txn.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {txn.type === 'credit' ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{txn.description || (txn.type === 'credit' ? 'Nạp' : 'Trừ')}</p>
                    <p className="text-xs text-muted-foreground">{txn.users?.email || `User #${txn.user_id}`} • {new Date(txn.created_at).toLocaleString('vi-VN')}</p>
                    <p className="text-xs text-muted-foreground">{txn.balance_before} → {txn.balance_after}</p>
                  </div>
                </div>
                <span className={`font-bold ${txn.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                  {txn.type === 'credit' ? '+' : '-'}{txn.amount}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
