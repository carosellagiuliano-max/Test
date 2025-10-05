'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase configuration - in real app, these would come from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RealtimeEvent {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
  subscribe: (table: string, callback: (event: RealtimeEvent) => void) => () => void;
  unsubscribe: (table: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [subscriptions, setSubscriptions] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    // Initialize Supabase realtime connection
    setConnectionStatus('connecting');

    // In a real implementation, you would set up Supabase realtime subscriptions here
    // For now, we'll simulate the connection
    const timer = setTimeout(() => {
      setIsConnected(true);
      setConnectionStatus('connected');
    }, 1000);

    return () => {
      clearTimeout(timer);
      // Clean up subscriptions
      subscriptions.forEach((subscription) => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
    };
  }, []);

  const subscribe = (table: string, callback: (event: RealtimeEvent) => void) => {
    if (subscriptions.has(table)) {
      // Already subscribed to this table
      return () => unsubscribe(table);
    }

    try {
      // In a real implementation, this would be:
      const channel = supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            const event: RealtimeEvent = {
              id: `${Date.now()}-${Math.random()}`,
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: table,
              record: payload.new,
              old_record: payload.old,
              timestamp: new Date().toISOString(),
            };

            setLastEvent(event);
            callback(event);
          }
        )
        .subscribe();

      // For demo purposes, simulate some events
      const interval = setInterval(() => {
        if (Math.random() > 0.95) { // 5% chance every second
          const mockEvent: RealtimeEvent = {
            id: `mock-${Date.now()}`,
            type: ['INSERT', 'UPDATE', 'DELETE'][Math.floor(Math.random() * 3)] as any,
            table: table,
            record: { id: `mock-${Date.now()}`, updated_at: new Date().toISOString() },
            timestamp: new Date().toISOString(),
          };
          setLastEvent(mockEvent);
          callback(mockEvent);
        }
      }, 1000);

      setSubscriptions(prev => new Map(prev.set(table, { channel, interval })));

      return () => {
        clearInterval(interval);
        channel.unsubscribe();
        unsubscribe(table);
      };
    } catch (error) {
      console.error('Failed to subscribe to table:', table, error);
      setConnectionStatus('error');
      return () => {};
    }
  };

  const unsubscribe = (table: string) => {
    const subscription = subscriptions.get(table);
    if (subscription) {
      if (subscription.interval) {
        clearInterval(subscription.interval);
      }
      if (subscription.channel) {
        subscription.channel.unsubscribe();
      }
      setSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(table);
        return newMap;
      });
    }
  };

  const value: RealtimeContextType = {
    isConnected,
    lastEvent,
    subscribe,
    unsubscribe,
    connectionStatus,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Hook for specific table subscriptions
export function useTableSubscription(
  table: string,
  callback: (event: RealtimeEvent) => void,
  enabled: boolean = true
) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribeFn = subscribe(table, callback);
    return unsubscribeFn;
  }, [table, callback, enabled, subscribe]);
}

// Hook for appointment updates
export function useAppointmentUpdates(callback: (event: RealtimeEvent) => void) {
  useTableSubscription('appointments', callback);
}

// Hook for payment updates
export function usePaymentUpdates(callback: (event: RealtimeEvent) => void) {
  useTableSubscription('payments', callback);
}

// Hook for customer updates
export function useCustomerUpdates(callback: (event: RealtimeEvent) => void) {
  useTableSubscription('customers', callback);
}

// Hook for staff updates
export function useStaffUpdates(callback: (event: RealtimeEvent) => void) {
  useTableSubscription('staff', callback);
}

// Connection status component
export function RealtimeStatus() {
  const { connectionStatus, isConnected, lastEvent } = useRealtime();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-gray-600">{getStatusText()}</span>
      {lastEvent && (
        <span className="text-gray-400">
          Last update: {new Date(lastEvent.timestamp).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Toast notification hook for realtime events
export function useRealtimeNotifications() {
  const { lastEvent } = useRealtime();

  useEffect(() => {
    if (!lastEvent) return;

    // In a real app, you would show toast notifications here
    console.log('Realtime event:', lastEvent);

    // Example: Show different notifications based on event type
    switch (lastEvent.type) {
      case 'INSERT':
        console.log(`New ${lastEvent.table.slice(0, -1)} created`);
        break;
      case 'UPDATE':
        console.log(`${lastEvent.table.slice(0, -1)} updated`);
        break;
      case 'DELETE':
        console.log(`${lastEvent.table.slice(0, -1)} deleted`);
        break;
    }
  }, [lastEvent]);
}