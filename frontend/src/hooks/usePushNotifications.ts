'use client';

import { useEffect, useState } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS } from '@/lib/constants/contracts';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        setSubscription(sub);
      }
      setPermission(Notification.permission);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const subscribeToPush = async () => {
    if (!isSupported) return;
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        // In a real app, you'd use a VAPID public key and save the subscription to your backend
        // For this frontend-only dApp, we will trigger local notifications from the service worker via the watch hook
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  // Listen for the MegaYieldThreshold event and trigger a local notification
  useWatchContractEvent({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    eventName: 'MegaYieldThreshold',
    onLogs(logs) {
      logs.forEach(log => {
        const args = log.args as any;
        if (args && args.amount) {
          triggerLocalNotification('MEGA YIELD ALERT!', `The prize pool has accumulated massive yield! Head to the arena now!`);
        }
      });
    },
  });

  const triggerLocalNotification = async (title: string, body: string) => {
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body,
        icon: '/paynpass-logo.png',
        badge: '/paynpass-logo.png',
        vibrate: [200, 100, 200],
        data: { url: '/' }
      });
    }
  };

  return {
    isSupported,
    permission,
    subscribeToPush,
    triggerLocalNotification
  };
}
