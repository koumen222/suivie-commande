import { Order } from '../../../types/order';

const formatPhoneNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return raw;
  }
  return digits
    .split('')
    .reduce<string[]>((acc, digit, index) => {
      if (index % 2 === 0) {
        acc.push(digit);
      } else {
        acc[acc.length - 1] = `${acc[acc.length - 1]}${digit}`;
      }
      return acc;
    }, [])
    .join(' ');
};

const formatDateLabel = (value?: string) => {
  if (!value) {
    return 'À planifier';
  }
  try {
    const date = new Date(value);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'À planifier';
  }
};

const formatTimeLabel = (value?: string) => {
  if (!value) {
    return 'À définir';
  }
  try {
    const date = new Date(value);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return 'À définir';
  }
};

export const formatOrderForZendo = (order: Order) => {
  const montant = `${order.subtotal.toLocaleString('fr-FR')} FCFA`;

  return `Zendo\n\nNom du client : ${order.firstName || '—'}\nVille : ${order.city || '—'}\nLieu de la livraison : ${order.address1 || '—'}\nJour de livraison : ${formatDateLabel(
    order.createdDate
  )}\nNuméro : ${formatPhoneNumber(order.phone)}\nHeure de livraison : ${formatTimeLabel(order.createdDate)}\nArticle : ${order.productName}\nQuantité : ${order.productQuantity}\nMontant : ${montant}`;
};
