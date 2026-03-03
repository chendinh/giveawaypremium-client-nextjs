'use server';

import { hexToUint8Array } from '@/lib/utils';

export async function initGame() {
  const res = await fetch(
    'https://a7f9941a11102027b10324cc2b7cf98aa7c3f2d2-3000.dstack-pha-prod7.phala.network/game/0/init',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }

  return res.json();
}

export async function uploadHexString(hexString: string) {
  const uint8Array = hexToUint8Array(hexString);

  const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
  const file = new File([blob], 'quote.bin', {
    type: 'application/octet-stream',
  });

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('https://proof.t16z.com/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Upload failed');
  }
  return res.json();
}
