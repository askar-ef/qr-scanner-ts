// Import Supabase client
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fungsi untuk mendapatkan data Orders hari ini
async function fetchOrdersToday() {
  try {
    // Dapatkan tanggal hari ini dalam format ISO (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    // Query ke Supabase untuk mendapatkan data Orders hari ini
    const { data, error } = await supabase
      .from("orders") // Nama tabel
      .select("*")
      .gte("created_at", `${today}T00:00:00Z`) // Greater than or equal to mulai hari ini
      .lte("created_at", `${today}T23:59:59Z`); // Less than or equal to akhir hari ini

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Fungsi untuk menampilkan data Orders di halaman HTML
// Fungsi untuk menampilkan data Orders di halaman HTML
function displayOrders(orders: any[]) {
  const tableBody = document.querySelector("#orders-table tbody");
  if (!tableBody) return;

  // Bersihkan isi tabel sebelumnya
  tableBody.innerHTML = "";

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" class="no-data">Tidak ada pesanan hari ini.</td>
      </tr>
    `;
    return;
  }

  // Tambahkan baris untuk setiap pesanan
  orders.forEach((order, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${order.telegram_id || "-"}</td>
      <td>${order.menu || "-"}</td>
      <td>${order.minum || "-"}</td>
      <td>${order.level || "-"}</td>
      <td>Rp. ${order.totals || "0"}</td>
      <td>${order.status || "-"}</td>
      <td>${order.payment || "-"}</td>
      <td>${new Date(order.created_at).toLocaleString()}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Main function
async function main() {
  const orders = await fetchOrdersToday();
  displayOrders(orders);
}

// Jalankan main function
main();
