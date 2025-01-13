import { Html5Qrcode } from 'html5-qrcode';
import { createClient } from '@supabase/supabase-js';
import type { Order } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const html5QrCode = new Html5Qrcode("reader");
const resultDiv = document.getElementById('result') as HTMLDivElement;

const qrConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusClass = (status: string): string => {
  return status.toLowerCase() === 'selesai' ? 'status-selesai' : 'status-pending';
};

const updateStatus = async (id: string): Promise<void> => {
  try {
    const button = document.querySelector('button');
    if (button) {
      button.disabled = true;
      button.textContent = 'Mengupdate...';
    }

    const { error } = await supabase
      .from('ordersx')
      .update({ status: 'Selesai' })
      .eq('id', id);

    if (error) throw error;
    
    const statusElement = document.querySelector('.status');
    if (statusElement) {
      statusElement.textContent = 'Selesai';
      statusElement.className = 'status status-selesai';
    }

    if (button) {
      button.style.display = 'none';
    }

    resultDiv.innerHTML += `
      <div style="margin-top: 15px; padding: 10px; background: #4CAF50; color: white; border-radius: 5px;">
        ✅ Status berhasil diupdate menjadi Selesai!
      </div>
    `;
  } catch (error) {
    if (error instanceof Error) {
      resultDiv.innerHTML += `
        <div style="margin-top: 15px; padding: 10px; background: #ff5252; color: white; border-radius: 5px;">
          ❌ Error: ${error.message}
        </div>
      `;
    }
  }
};

declare global {
  interface Window {
    updateStatus: (id: string) => Promise<void>;
  }
}
window.updateStatus = updateStatus;

const onScanSuccess = async (decodedText: string): Promise<void> => {
  try {
    await html5QrCode.stop();
    
    // Ekstrak ID dari format "ID Pesanan: #109"
    const idMatch = decodedText.match(/ID Pesanan: #(\d+)/);
    if (!idMatch) {
      throw new Error('Format QR code tidak valid. ID Pesanan tidak ditemukan.');
    }
    const id = idMatch[1]; // Mengambil angka setelah #
    
    resultDiv.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div class="loading">Mengambil data pesanan...</div>
      </div>
    `;

    console.log('Mencari pesanan dengan ID:', id); // Debug log

    const { data, error } = await supabase
      .from('ordersx')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      throw new Error(`Pesanan dengan ID ${id} tidak ditemukan`);
    }

    const order = data as Order;
    // ... rest of the code remains the same

    resultDiv.innerHTML = `
      <div class="order-details">
        <h3>Detail Pesanan:</h3>
        <p><strong>ID Pesanan:</strong> ${order.id}</p>
        <p><strong>Menu:</strong> ${order.menu}</p>
        <p><strong>Level:</strong> ${order.level}</p>
        <p><strong>Minum:</strong> ${order.minum}</p>
        <p><strong>Status:</strong> <span class="status ${getStatusClass(order.status)}">${order.status}</span></p>
        <div class="timestamp">
          <p>Dibuat pada: ${formatDate(order.created_at)}</p>
        </div>
        ${order.status.toLowerCase() !== 'selesai' ? 
          `<button onclick="updateStatus('${order.id}')">Update Status ➜ Selesai</button>` : 
          '<p style="text-align: center; color: #4CAF50;">✅ Pesanan telah selesai</p>'
        }
      </div>
    `;
  } catch (error) {
    if (error instanceof Error) {
      resultDiv.innerHTML = `
        <div style="padding: 15px; background: #fff3cd; color: #856404; border-radius: 5px;">
          ⚠️ Error: ${error.message}
        </div>
      `;
    }
  }
};

const onScanError = (error: string): void => {
  console.error(error);
};

html5QrCode.start(
  { facingMode: "environment" },
  qrConfig,
  onScanSuccess,
  onScanError
);