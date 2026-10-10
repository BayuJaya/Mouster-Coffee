document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  // === KONFIGURASI API (PASTE URL WEB APP APPS SCRIPT DI SINI) ===
  const API_URL = "https://script.google.com/macros/s/AKfycbx4L1McEbCWzouMRnQS_cDhBoEfiw9U4w8h3NqhaghuYykABWB1GbsckgmK4zCsEkvn0Q/exec"; 

  // Element Selectors Utama
  const loginScreen = document.getElementById("login-screen");
  const mainApp = document.getElementById("main-app");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const btnLogin = document.getElementById("btn-login");
  const btnRefresh = document.getElementById("btn-refresh");
  const navButtons = document.querySelectorAll(".nav-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const filterBar = document.getElementById("filter-bar");
  const filterButtons = document.querySelectorAll(".filter-btn");
  // State Caching Data Lokal dari GitHub
  let appData = {
    menu: [],
    bahan: [],
    resep: [],
    transaksi: [],
    belanja: []
  };

  // Cek Sesi Login Sebelumnya
  if (localStorage.getItem("mouster_session") === "active") {
    loginScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    loadAllDashboardData();
  }

  // ============================================
  // 1. SISTEM LOGIN
  // ============================================
// Proses Submit Login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;
    
    // 1. UBAH TOMBOL JADI ANIMASI LOADING DI SINI
    btnLogin.innerHTML = `<span class="spinner-sm"></span> <span class="loading-dots">Memeriksa</span>`;
    btnLogin.disabled = true;
    btnLogin.style.opacity = "0.7"; // Bikin tombol agak pudar saat loading
    loginError.classList.add("hidden");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "login", username: user, password: pass }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });

      const result = await response.json();

      if (result.status === "success") {
        localStorage.setItem("mouster_session", "active");
        loginScreen.classList.add("hidden");
        mainApp.classList.remove("hidden");
        loadAllDashboardData();
      } else {
        loginError.innerText = result.message || "Username atau Password salah!";
        loginError.classList.remove("hidden");
      }
    } catch (error) {
      loginError.innerText = "Gagal terhubung. Pastikan link Web App benar.";
      loginError.classList.remove("hidden");
    } finally {
      // 2. KEMBALIKAN TOMBOL KE SEMULA JIKA GAGAL/SELESAI
      btnLogin.innerHTML = "Login Dashboard";
      btnLogin.disabled = false;
      btnLogin.style.opacity = "1";
    }
  });

  // ============================================
  // 2. FETCH DATA UTAMA (GITHUB API VIA APPS SCRIPT)
  // ============================================
  async function loadAllDashboardData(callback = null) {
    setInlineLoadingState(true);

    try {
      const res = await fetch(`${API_URL}?action=get_all_data`);
      const data = await res.json();

      if (data.status === "success") {
        appData.menu = data.menu || [];
        appData.bahan = data.bahan || [];
        appData.resep = data.resep || [];
        appData.transaksi = data.transaksi || [];
        appData.belanja = data.belanja || [];

        // Render data ke tampilan web
        renderLaporanPage();
        renderStokPage();
        renderMenuPage();
        renderDatalistSaran();
        updateSelectOptions();
      } else {
        alert("Gagal memuat data dari GitHub.");
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setInlineLoadingState(false);
      if (callback) callback();
    }
  }

  // Tampilan Loading di Dalam Kontainer Tab
  function setInlineLoadingState(isLoading) {
    if (isLoading) {
      document.querySelectorAll(".list-container").forEach(el => {
        el.innerHTML = `
          <div class="tab-loading-state" style="text-align: center; padding: 30px; color: var(--text-muted);">
            <div class="spinner-sm"></div>
            <p style="margin-top: 8px; font-size: 12px;">Memuat data dari GitHub<span class="loading-dots"></span></p>
          </div>`;
      });
    }
  }

  // ============================================
  // 3. RENDER TAMPILAN DASHBOARD
  // ============================================

  // Render Tab 1: Laporan
  function renderLaporanPage() {
    let totalOmset = 0;
    let totalHPP = 0;
    let totalCups = 0;

    appData.transaksi.forEach(t => {
      totalOmset += Number(t.Total_Revenue || t.total_revenue || 0);
      totalHPP += Number(t.Total_HPP || t.total_hpp || 0);
      totalCups += Number(t.Total_Cups || t.total_cups || 0);
    });

    const omsetEl = document.querySelector("#tab-laporan .stat-value");
    const hppEl = document.querySelector("#tab-laporan .stat-value-sm.text-red");
    const profitEl = document.querySelector("#tab-laporan .stat-value-sm.text-green");
    const cupsEl = document.querySelector("#tab-laporan .stat-desc");

    if (omsetEl) omsetEl.innerText = `Rp ${totalOmset.toLocaleString("id-ID")}`;
    if (hppEl) hppEl.innerText = `Rp ${totalHPP.toLocaleString("id-ID")}`;
    if (profitEl) profitEl.innerText = `Rp ${(totalOmset - totalHPP).toLocaleString("id-ID")}`;
    if (cupsEl) cupsEl.innerText = `${totalCups} Cups Terjual`;

    // Render Menu Terlaris di Tab Laporan
    const containerLaporanList = document.querySelector("#tab-laporan .list-container");
    if (containerLaporanList) {
      if (appData.menu.length === 0) {
        containerLaporanList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 12px;">Belum ada data penjualan.</p>`;
      } else {
        containerLaporanList.innerHTML = appData.menu.slice(0, 5).map(m => `
          <div class="list-item">
            <div>
              <p class="item-name">${m.Nama_Menu}</p>
              <p class="item-sub">${m.Kategori || 'Coffee'}</p>
            </div>
            <span class="item-price">Rp ${Number(m.Harga_Jual).toLocaleString("id-ID")}</span>
          </div>
        `).join("");
      }
    }
  }

  // Render Tab 2: Stok Bahan Baku
  function renderStokPage() {
    const container = document.querySelector("#tab-stok .list-container");
    if (!container) return;

    if (appData.bahan.length === 0) {
      container.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px;">Belum ada bahan baku di database GitHub.</p>`;
      return;
    }

    container.innerHTML = appData.bahan.map(item => {
      const stokVal = Number(item.Stok || 0);
      
      // Logika deteksi stok 0
      let statusBadge = '';
      if (stokVal === 0) {
        statusBadge = `<span class="badge badge-warning" style="background-color: var(--danger-color); color: white;">Habis</span>`;
      } else if (stokVal > 1000) {
        statusBadge = `<span class="badge badge-success">Aman</span>`;
      } else {
        statusBadge = `<span class="badge badge-warning">Menipis</span>`;
      }

      return `
        <div class="card list-card">
          <div class="list-item-header">
            <span class="item-name">${item.Nama_Bahan}</span>
            ${statusBadge}
          </div>
          <div class="stok-info">
            <p>Stok: <b>${stokVal.toLocaleString("id-ID")} ${item.Satuan || 'gram'}</b></p>
            <p>Harga/${item.Satuan || 'unit'}: <b>Rp ${Number(item.Harga_Per_Satuan || 0).toLocaleString("id-ID")}</b></p>
          </div>
        </div>
      `;
    }).join("");
  }

  // Render Tab 3: Menu & Resep (HPP)
  function renderMenuPage() {
    const container = document.querySelector("#tab-resep .list-container");
    if (!container) return;

    if (appData.menu.length === 0) {
      container.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px;">Belum ada menu tersimpan di GitHub.</p>`;
      return;
    }

    container.innerHTML = appData.menu.map(menu => {
      // Hitung HPP berdasarkan komposisi di resep
      const menuResep = appData.resep.filter(r => r.ID_Menu === menu.ID_Menu);
      let totalHPP = 0;

      const resepListHtml = menuResep.map(r => {
        const bahanInfo = appData.bahan.find(b => b.Nama_Bahan.toLowerCase() === r.Nama_Bahan.toLowerCase());
        const hargaBahan = bahanInfo ? Number(bahanInfo.Harga_Per_Satuan || 0) : 0;
        const subtotal = hargaBahan * Number(r.Qty || 0);
        totalHPP += subtotal;
        return `<li>${r.Nama_Bahan}: ${r.Qty} (Rp ${subtotal.toLocaleString("id-ID")})</li>`;
      }).join("");

      const margin = Number(menu.Harga_Jual || 0) - totalHPP;

      return `
        <div class="card list-card">
          <div class="list-item-header">
            <span class="item-name">${menu.Nama_Menu}</span>
            <span class="item-price">Rp ${Number(menu.Harga_Jual).toLocaleString("id-ID")}</span>
          </div>
          <div class="hpp-box">
            <p>Estimasi HPP: <b class="text-red">Rp ${totalHPP.toLocaleString("id-ID")}</b></p>
            <p>Margin Profit: <b class="text-green">Rp ${margin.toLocaleString("id-ID")}</b></p>
          </div>
          <details class="resep-detail">
            <summary>Lihat Resep / Komposisi</summary>
            <ul>${resepListHtml || "<li>Belum ada rincian resep.</li>"}</ul>
          </details>
        </div>
      `;
    }).join("");
  }

  // Dynamic Datalist & Dropdown Select Options
  function renderDatalistSaran() {
    let listBahan = document.getElementById("list-bahan");
    if (!listBahan) {
      listBahan = document.createElement("datalist");
      listBahan.id = "list-bahan";
      document.body.appendChild(listBahan);
    }
    listBahan.innerHTML = appData.bahan.map(b => `<option value="${b.Nama_Bahan}">`).join("");
  }

  function updateSelectOptions() {
    // Buat format HTML untuk daftar pilihan (options)
    let optionsHTML = '<option value="">-- Pilih Bahan --</option>';
    if (appData.bahan.length > 0) {
      optionsHTML += appData.bahan.map(b => `<option value="${b.Nama_Bahan}">${b.Nama_Bahan}</option>`).join("");
    } else {
      optionsHTML = `<option value="">Belum ada bahan baku</option>`;
    }

    // 1. Masukkan ke dropdown di Tab Belanja
    const selectBelanja = document.querySelector("#form-belanja select");
    if (selectBelanja) selectBelanja.innerHTML = optionsHTML;

    // 2. Masukkan ke dropdown baris pertama di Modal Tambah Resep
    const selectResep = document.querySelector("#area-bahan-baku select.input-bahan");
    if (selectResep) selectResep.innerHTML = optionsHTML;
  }

  // ============================================
  // 4. HANDLER EVENT & POP-UP MODAL
  // ============================================

  // Refresh Button
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      const icon = btnRefresh.querySelector("svg") || btnRefresh.querySelector("i");
      if (icon) icon.classList.add("spin-icon");
      loadAllDashboardData(() => {
        if (icon) icon.classList.remove("spin-icon");
      });
    });
  }

  // Navigation Tabs
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      navButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === targetTab) content.classList.add("active");
      });

      if (filterBar) {
        filterBar.style.display = targetTab === "tab-laporan" ? "flex" : "none";
      }
    });
  });

  // Filter Periode
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Modal Resep Open & Close
  const modalResep = document.getElementById("modal-resep");
  const btnOpenResep = document.getElementById("btn-open-modal-resep");
  const btnCloseResep = document.getElementById("btn-close-modal");

  if (btnOpenResep) {
    btnOpenResep.addEventListener("click", () => modalResep.classList.remove("hidden"));
  }
  if (btnCloseResep) {
    btnCloseResep.addEventListener("click", () => modalResep.classList.add("hidden"));
  }

  // Tambah Baris Bahan Baku Dinamis di Resep
  const btnTambahBahan = document.getElementById("btn-tambah-bahan");
  const areaBahanBaku = document.getElementById("area-bahan-baku");

  if (btnTambahBahan && areaBahanBaku) {
    btnTambahBahan.addEventListener("click", () => {
      const rowBaru = document.createElement("div");
      rowBaru.classList.add("bahan-row");
      
      // Susun ulang daftar pilihan dari data GitHub
      let optionsHTML = '<option value="">-- Pilih Bahan --</option>';
      if (appData.bahan.length > 0) {
        optionsHTML += appData.bahan.map(b => `<option value="${b.Nama_Bahan}">${b.Nama_Bahan}</option>`).join("");
      }

      rowBaru.innerHTML = `
        <select class="form-input input-bahan" required>
          ${optionsHTML}
        </select>
        <input type="number" class="form-input input-qty" placeholder="Qty" required>
        <button type="button" class="close-btn text-red" onclick="this.parentElement.remove()">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      `;
      areaBahanBaku.appendChild(rowBaru);
      lucide.createIcons();
    });
  }

  // Submit Menu & Resep Baru -> Ke GitHub
  const formTambahResep = document.getElementById("form-tambah-resep");
  if (formTambahResep) {
    formTambahResep.addEventListener("submit", async (e) => {
      e.preventDefault();

      const namaMenu = document.getElementById("input-nama-menu").value;
      const kategori = document.getElementById("input-kategori").value;
      const harga = document.getElementById("input-harga").value;
      const fileInput = document.getElementById("input-foto-menu");

      const komposisi = [];
      document.querySelectorAll("#area-bahan-baku .bahan-row").forEach(row => {
        const namaBahan = row.querySelector(".input-bahan, select")?.value;
        const qty = row.querySelector(".input-qty")?.value;
        if (namaBahan && qty) {
          komposisi.push({ nama_bahan: namaBahan, qty: Number(qty) });
        }
      });

      // Fungsi Kompres Gambar
      const compressAndGetBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              const maxWidth = 800;
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              let encoded = dataUrl.replace(/^data:(.*,)?/, '');
              if ((encoded.length % 4) > 0) {
                encoded += '='.repeat(4 - (encoded.length % 4));
              }

              const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              resolve({ base64: encoded, name: cleanName + ".jpg" });
            };
            img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
        });
      };

      let base64Image = "";
      let fileName = "";
      if (fileInput && fileInput.files.length > 0) {
        const compressed = await compressAndGetBase64(fileInput.files[0]);
        base64Image = compressed.base64;
        fileName = compressed.name;
      }

      // TUTUP MODAL SEKALIGUS (User bisa langsung ketik menu lain tanpa nunggu server!)
      formTambahResep.reset();
      if (modalResep) modalResep.classList.add("hidden");

      // MASUK KE ANTREAN BACKGROUND DI KANAN BAWAH
      enqueueRequest(async () => {
        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "tambah_resep",
            nama_menu: namaMenu,
            kategori: kategori,
            harga: Number(harga),
            komposisi: komposisi,
            file_name: fileName,
            file_base64: base64Image
          }),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        const result = await res.json();
        if (result.status === "success") {
          loadAllDashboardData();
        } else {
          throw new Error(result.message);
        }
      }, `Mengupload menu "${namaMenu}"...`);
    });
  }

  // Submit Form Belanja Bahan -> Ke GitHub
  const formBelanja = document.getElementById("form-belanja");
  if (formBelanja) {
    formBelanja.addEventListener("submit", async (e) => {
      e.preventDefault();
      const selectBahan = formBelanja.querySelector("select");
      const inputs = formBelanja.querySelectorAll("input");
      
      const namaBahan = selectBahan ? selectBahan.value : "";
      const qty = inputs[0] ? inputs[0].value : 0;
      const totalBiaya = inputs[1] ? inputs[1].value : 0;

      // === TAMBAHKAN VALIDASI INI AGAR TIDAK BISA KOSONG ===
      if (!namaBahan) {
        createToastNotification("Silakan pilih bahan baku terlebih dahulu!", "error");
        return;
      }
      if (!qty || Number(qty) <= 0) {
        createToastNotification("Jumlah beli (Qty) harus diisi dengan benar!", "error");
        return;
      }
      if (!totalBiaya || Number(totalBiaya) < 0) {
        createToastNotification("Total biaya harus diisi!", "error");
        return;
      }
      // ====================================================

      formBelanja.reset();

      enqueueRequest(async () => {
        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "tambah_stok",
            nama_bahan: namaBahan,
            qty: Number(qty),
            satuan: "gram",
            total_biaya: Number(totalBiaya)
          }),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        const result = await res.json();
        if (result.status === "success") {
          loadAllDashboardData();
        } else {
          throw new Error(result.message);
        }
      }, `Menyimpan belanja "${namaBahan}"...`);
    });
  }

  // ============================================
  // LOGIKA MODAL TAMBAH STOK / BAHAN
  // ============================================
  const modalStok = document.getElementById("modal-stok");
  const btnOpenStok = document.getElementById("btn-open-modal-stok");
  const btnCloseStok = document.getElementById("btn-close-modal-stok");
  const formTambahStok = document.getElementById("form-tambah-stok");

  // Buka & Tutup Modal
  if (btnOpenStok && modalStok) {
    btnOpenStok.addEventListener("click", () => modalStok.classList.remove("hidden"));
  }
  if (btnCloseStok && modalStok) {
    btnCloseStok.addEventListener("click", () => modalStok.classList.add("hidden"));
  }

  // Submit Form Tambah Bahan -> Ke GitHub via Apps Script
// Submit Form Tambah Bahan (Master) -> Ke GitHub via Apps Script
  if (formTambahStok) {
    formTambahStok.addEventListener("submit", async (e) => {
      e.preventDefault();
      const namaBahan = document.getElementById("input-nama-stok").value;
      const satuan = document.getElementById("input-satuan-stok").value;

      formTambahStok.reset();
      modalStok.classList.add("hidden");

      enqueueRequest(async () => {
        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "tambah_stok",
            nama_bahan: namaBahan,
            qty: 0,
            satuan: satuan,
            total_biaya: 0
          }),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });

        const result = await res.json();
        if (result.status === "success") {
          loadAllDashboardData();
        } else {
          throw new Error(result.message);
        }
      }, `Mendaftarkan bahan "${namaBahan}"...`);
    });
  }

  // ============================================
  // SISTEM TOAST NOTIFICATION & QUEUE MANAGER
  // ============================================
  let requestQueue = [];
  let isProcessingQueue = false;

  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `custom-toast ${type}`;
    
    let iconHtml = type === "success" 
      ? `<i data-lucide="check-circle" style="color: #34c759; width: 20px; height: 20px; flex-shrink: 0;"></i>` 
      : `<i data-lucide="alert-circle" style="color: #ff3b30; width: 20px; height: 20px; flex-shrink: 0;"></i>`;

    toast.innerHTML = `
      ${iconHtml}
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Hilang otomatis setelah 3.5 detik dengan animasi
    setTimeout(() => {
      toast.style.animation = "fadeOutRight 0.3s ease forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }


  // Fungsi membuat Pop-up Loading Kecil / Toast di Kanan Bawah
  function createToastNotification(message, type = "loading") {
    const container = document.getElementById("toast-container");
    if (!container) return null;

    const toast = document.createElement("div");
    toast.className = `custom-toast ${type}`;
    
    let iconHtml = '';
    if (type === "loading") {
      iconHtml = `<div class="spinner-sm" style="width: 18px; height: 18px; border-width: 2px; flex-shrink: 0;"></div>`;
    } else if (type === "success") {
      iconHtml = `<i data-lucide="check-circle" style="color: #34c759; width: 20px; height: 20px; flex-shrink: 0;"></i>`;
    } else {
      iconHtml = `<i data-lucide="alert-circle" style="color: #ff3b30; width: 20px; height: 20px; flex-shrink: 0;"></i>`;
    }

    toast.innerHTML = `
      ${iconHtml}
      <div style="flex: 1; font-size: 12px; line-height: 1.4;">${message}</div>
    `;

    container.appendChild(toast);
    lucide.createIcons();
    return toast;
  }

  async function enqueueRequest(taskFunction, loadingMsg = "Mengupload data...") {
    return new Promise((resolve, reject) => {
      requestQueue.push({ taskFunction, loadingMsg, resolve, reject });
      processQueue();
    });
  }

  async function processQueue() {
    if (isProcessingQueue || requestQueue.length === 0) return;
    isProcessingQueue = true;

    const currentTask = requestQueue[0];
    
    // Munculkan pop-up loading kecil di kanan bawah khusus task ini (bisa bertumpuk jika ada > 1)
    const toastElement = createToastNotification(currentTask.loadingMsg, "loading");

    try {
      const result = await currentTask.taskFunction();
      if (toastElement) {
        toastElement.className = "custom-toast success";
        toastElement.innerHTML = `<i data-lucide="check-circle" style="color: #34c759; width: 20px; height: 20px; flex-shrink: 0;"></i><div style="flex: 1; font-size: 12px;">Data berhasil disimpan!</div>`;
        lucide.createIcons();

        setTimeout(() => {
          toastElement.style.animation = "fadeOutRight 0.3s ease forwards";
          setTimeout(() => toastElement.remove(), 300);
        }, 3000);
      }
      currentTask.resolve(result);
    } catch (error) {
      if (toastElement) {
        toastElement.className = "custom-toast error";
        
        // AMBIL PESAN ERROR SPESIFIK DARI SERVER (misal: nama kembar)
        const pesanError = error.message || "Gagal menyimpan data!";
        
        toastElement.innerHTML = `<i data-lucide="alert-circle" style="color: #ff3b30; width: 20px; height: 20px; flex-shrink: 0;"></i><div style="flex: 1; font-size: 12px;">${pesanError}</div>`;
        lucide.createIcons();

        setTimeout(() => {
          toastElement.style.animation = "fadeOutRight 0.3s ease forwards";
          setTimeout(() => toastElement.remove(), 300);
        }, 4000); // Durasi agak lama dikit (4 detik) agar sempat dibaca owner
      }
      currentTask.reject(error);
    } finally {
      requestQueue.shift();
      isProcessingQueue = false;
      
      // Lanjut otomatis ke antrean berikutnya secara bertahap
      if (requestQueue.length > 0) {
        processQueue();
      }
    }
  }

  // ============================================
  // PERINGATAN SAAT MENUTUP WEB/TAB (BEFOREUNLOAD)
  // ============================================
  window.addEventListener("beforeunload", (e) => {
    // Jika antrean request masih ada yang berjalan/belum kelar
    if (requestQueue.length > 0) {
      e.preventDefault();
      e.returnValue = "Masih ada data yang sedang di-upload ke server. Yakin ingin menutup halaman?";
      return e.returnValue;
    }
  });
});
