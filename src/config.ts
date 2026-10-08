import type { CartItem } from './context/CartContext';

export const WHATSAPP_NUMBER = '918610866523';
export const INSTAGRAM_HANDLE = 'gokul_sjg47';
export const INSTAGRAM_URL = 'https://www.instagram.com/gokul_sjg47/';

export function getWhatsAppProductLink(name: string, size: string): string {
  const text = encodeURIComponent(`Hi! I'd like to order ${name} - ${size}. Please share payment details.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function getWhatsAppComboLink(comboName: string, items: string[]): string {
  const text = encodeURIComponent(`Hi! I'd like to order the ${comboName} containing: ${items.join(', ')}. Please share payment details.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function getWhatsAppCartLink(cart: CartItem[], total: number): string {
  const itemsText = cart.map(item => `${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ''}`).join('\n');
  const text = encodeURIComponent(`Hi! I'd like to place an order from my cart:\n\n*Items:*\n${itemsText}\n\n*Total:* ₹${total.toLocaleString('en-IN')}\n\nPlease share payment details.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

