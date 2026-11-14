import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';

import { GlassCard } from '@/components/ui/GlassCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { customerFetch } from '@/services/customerApi';
import { colors } from '@/theme/colors';

function decodeVapidPublicKey(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
  const bytes = atob(padded);
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) result[i] = bytes.charCodeAt(i);
  return result;
}

export function PushReminderCard() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.getRegistration('/app-clienti/')
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => setEnabled(Boolean(subscription)))
      .catch(() => { /* il pulsante può ancora chiedere il permesso */ });
  }, []);

  if (Platform.OS !== 'web') return null;

  const supported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  async function enable() {
    if (!supported) return;
    setBusy(true);
    setMessage('');
    try {
      // Chiedere il permesso direttamente dal tap (requisito iOS Home Screen).
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setMessage('Permesso notifiche non concesso. Controlla le impostazioni del telefono.');
        return;
      }
      const { publicKey } = await customerFetch<{ publicKey: string }>('/api/customer/v1/push-subscription');
      const registration = await navigator.serviceWorker.register('/app-clienti/sw.js', {
        scope: '/app-clienti/',
      });
      const subscription = await registration.pushManager.getSubscription() ??
        await registration.pushManager.subscribe({
          userVisibleOnly: true, applicationServerKey: decodeVapidPublicKey(publicKey),
        });
      const json = subscription.toJSON();
      await customerFetch('/api/customer/v1/push-subscription', {
        method: 'POST', body: JSON.stringify(json),
      });
      setEnabled(true);
      setMessage('Promemoria attivi su questo dispositivo.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Impossibile attivare i promemoria.');
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    setMessage('');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/app-clienti/');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await customerFetch('/api/customer/v1/push-subscription', {
          method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage('Promemoria disattivati su questo dispositivo.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Impossibile disattivare i promemoria.');
    } finally { setBusy(false); }
  }

  return (
    <GlassCard>
      <Text style={styles.title}>Promemoria appuntamenti</Text>
      <Text style={styles.body}>
        {supported
          ? 'Ricevi una notifica circa un giorno prima degli appuntamenti. Puoi disattivarla quando vuoi.'
          : 'Su iPhone apri l’app dalla schermata Home per attivare le notifiche.'}
      </Text>
      {supported ? (
        <PrimaryButton disabled={busy} label={enabled ? 'Disattiva promemoria' : 'Attiva promemoria'}
          variant={enabled ? 'secondary' : undefined} onPress={() => void (enabled ? disable() : enable())} />
      ) : null}
      {message ? <Text style={styles.body}>{message}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 19, fontWeight: '600' },
  body: { color: colors.text, opacity: 0.85, fontSize: 14, lineHeight: 21 },
});
