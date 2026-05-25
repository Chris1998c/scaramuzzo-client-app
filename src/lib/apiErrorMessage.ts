import { CustomerApiError } from '@/types/customerApi';

const NETWORK_FALLBACK =
  'Connessione non disponibile. Controlla la rete e riprova.';

function isNetworkMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network error') ||
    lower.includes('connessione non disponibile')
  );
}

/** Messaggio UI per errori API/rete senza loggare in console. */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof CustomerApiError) {
    if (error.status === 0 || isNetworkMessage(error.message)) {
      return error.message || NETWORK_FALLBACK;
    }

    if (error.message.includes('protezione Vercel') || error.message.includes('non è raggiungibile')) {
      return error.message;
    }

    if (error.status === 401) {
      return 'Sessione scaduta. Esci e accedi di nuovo.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    if (isNetworkMessage(error.message)) {
      return NETWORK_FALLBACK;
    }

    return error.message;
  }

  return 'Si è verificato un errore imprevisto.';
}
