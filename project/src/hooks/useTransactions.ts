import { useState, useEffect } from 'react';
import { Transaction, OfflineAction } from '../types';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'urbanit_transactions';
const OFFLINE_QUEUE_KEY = 'urbanit_offline_queue';

// Mock initial data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'inflow',
    amount: 5000,
    description: 'Python Training Course - ABC Corp',
    category: 'training',
    date: '2024-01-15',
    createdBy: '1',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    type: 'outflow',
    amount: 1200,
    description: 'New Development Laptops',
    category: 'equipment',
    date: '2024-01-10',
    createdBy: '1',
    createdAt: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    type: 'inflow',
    amount: 3500,
    description: 'React Consulting - XYZ Ltd',
    category: 'consulting',
    date: '2024-01-20',
    createdBy: '1',
    createdAt: '2024-01-20T09:15:00Z'
  },
  {
    id: '4',
    type: 'outflow',
    amount: 800,
    description: 'Training Materials and Books',
    category: 'training',
    date: '2024-01-25',
    createdBy: '1',
    createdAt: '2024-01-25T16:45:00Z'
  },
  {
    id: '5',
    type: 'inflow',
    amount: 4200,
    description: 'JavaScript Advanced Training - DEF Inc',
    category: 'training',
    date: '2024-02-05',
    createdBy: '1',
    createdAt: '2024-02-05T11:20:00Z'
  }
];

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);

  useEffect(() => {
    loadTransactions();
    loadOfflineQueue();
  }, []);

  const loadTransactions = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTransactions(JSON.parse(stored));
      } else {
        // First time, load mock data
        setTransactions(mockTransactions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTransactions));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions(mockTransactions);
    }
  };

  const loadOfflineQueue = () => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        setOfflineQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  };

  const saveTransactions = (newTransactions: Transaction[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
    setTransactions(newTransactions);
  };

  const saveOfflineAction = (action: OfflineAction) => {
    const updatedQueue = [...offlineQueue, action];
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    setOfflineQueue(updatedQueue);
  };

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    setLoading(true);
    try {
      const newTransaction: Transaction = {
        ...transactionData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedTransactions = [...transactions, newTransaction];
      saveTransactions(updatedTransactions);

      // Simulate offline queue
      if (!navigator.onLine) {
        saveOfflineAction({
          id: Date.now().toString(),
          type: 'create',
          data: newTransaction,
          timestamp: new Date().toISOString()
        });
        toast.success('Transaction saved offline');
      } else {
        toast.success('Transaction created successfully');
      }

      return newTransaction;
    } catch (error) {
      toast.error('Failed to create transaction');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setLoading(true);
    try {
      const updatedTransactions = transactions.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      saveTransactions(updatedTransactions);

      if (!navigator.onLine) {
        saveOfflineAction({
          id: Date.now().toString(),
          type: 'update',
          data: { id, updates },
          timestamp: new Date().toISOString()
        });
        toast.success('Transaction updated offline');
      } else {
        toast.success('Transaction updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update transaction');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      saveTransactions(updatedTransactions);

      if (!navigator.onLine) {
        saveOfflineAction({
          id: Date.now().toString(),
          type: 'delete',
          data: { id },
          timestamp: new Date().toISOString()
        });
        toast.success('Transaction deleted offline');
      } else {
        toast.success('Transaction deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete transaction');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineActions = async () => {
    // In a real app, this would sync with the backend
    setOfflineQueue([]);
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    toast.success('Offline actions synced');
  };

  return {
    transactions,
    loading,
    offlineQueue,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    syncOfflineActions,
    refetch: loadTransactions
  };
};