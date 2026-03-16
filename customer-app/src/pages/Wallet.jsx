import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentAPI } from '../services/api';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import Spinner from '../components/common/Spinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

const Wallet = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: () => paymentAPI.getHistory({ page: 1, limit: 20 }),
  });

  const payments = data?.data?.data?.payments || [];

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <Navbar />
      <div className="max-w-md mx-auto px-4 pt-20">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-6 mb-6 shadow-2xl">
          <p className="text-white/80 text-sm mb-1">Thara Wallet</p>
          <h2 className="text-4xl font-bold text-white mb-4">₹0.00</h2>
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-white/20 rounded-2xl py-2.5 text-white font-medium">
              <Plus size={16} /> Add Money
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-white/20 rounded-2xl py-2.5 text-white font-medium">
              <ArrowUpRight size={16} /> Transfer
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <h3 className="font-semibold text-lg mb-4">Payment History</h3>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💳</div>
            <p className="text-white/60">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment._id} className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  payment.status === 'captured' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {payment.status === 'captured'
                    ? <ArrowUpRight size={18} className="text-green-400" />
                    : <ArrowDownLeft size={18} className="text-red-400" />
                  }
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">{payment.method} payment</p>
                  <p className="text-sm text-white/50">{formatDate(payment.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-400">{formatCurrency(payment.amount)}</p>
                  <p className={`text-xs capitalize ${
                    payment.status === 'captured' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Wallet;