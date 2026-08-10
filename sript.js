// ============================================================
// KONFIGURASI — GANTI BAGIAN INI DENGAN DATA SUPABASE ANDA
// ============================================================
// PENTING: Hanya gunakan Project URL dan ANON/PUBLIC KEY di sini.
// JANGAN PERNAH menaruh Service Role Key di file frontend manapun.
const SUPABASE_URL = "MASUKKAN_SUPABASE_URL";           // contoh: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "MASUKKAN_SUPABASE_ANON_KEY";  // key yang diawali "eyJhbGciOi..."

// Batas nilai kelulusan — ubah di sini jika kebijakan sekolah berubah.
const BATAS_KELULUSAN = 75;

// Nomor surat — struktur mudah diubah, bukan nomor resmi otomatis.
const NOMOR_SURAT = "001/KIR/SMAN1-LMH/VIII/2026";

// Nama ketua ekstrakurikuler yang tercantum di surat.
const KETUA_NAMA = "AHMAD AL-GHAZALI";

// ============================================================
// INISIALISASI SUPABASE CLIENT
// ============================================================
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// REFERENSI ELEMEN DOM
// ============================================================
const checkView = document.getElementById("checkView");
const notfoundView = document.getElementById("notfoundView");
const letterView = document.getElementById("letterView");

const checkForm = document.getElementById("checkForm");
const inputNama = document.getElementById("inputNama");
const inputKelas = document.getElementById("inputKelas");
const errNama = document.getElementById("errNama");
const errKelas = document.getElementById("errKelas");
const errGeneral = document.getElementById("errGeneral");

const btnCek = document.getElementById("btnCek");
const btnSpinner = document.getElementById("btnSpinner");
const loadingText = document.getElementById("loadingText");

const btnBackFromNotfound = document.getElementById("btnBackFromNotfound");
const btnBackFromLetter = document.getElementById("btnBackFromLetter");
const btnPrint = document.getElementById("btnPrint");

const letterNomor = document.getElementById("letterNomor");
const letterNama = document.getElementById("letterNama");
const letterKelas = document.getElementById("letterKelas");
const letterNilai = document.getElementById("letterNilai");
const letterStatus = document.getElementById("letterStatus");
const letterTanggal = document.getElementById("letterTanggal");

// ============================================================
// UTIL: TAMPILKAN SATU VIEW, SEMBUNYIKAN YANG LAIN
// ============================================================
function showView(view) {
  [checkView, notfoundView, letterView].forEach((el) => {
    el.hidden = el !== view;
  });
  if (view !== letterView) window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// UTIL: FORMAT TANGGAL INDONESIA, mis. "Cirebon, 10 Agustus 2026"
// Menggunakan tanggal saat surat dilihat. Kota "Cirebon" mengikuti
// lokasi sekolah — ubah CITY_NAME jika diperlukan.
// ============================================================
const CITY_NAME = "Cirebon";
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
function formatTanggalIndonesia(date) {
  const d = date.getDate();
  const m = NAMA_BULAN[date.getMonth()];
  const y = date.getFullYear();
  return `${CITY_NAME}, ${d} ${m} ${y}`;
}

// ============================================================
// UTIL: RESET FORM & PESAN ERROR
// ============================================================
function resetForm() {
  checkForm.reset();
  errNama.textContent = "";
  errKelas.textContent = "";
  errGeneral.textContent = "";
  inputNama.classList.remove("field--invalid");
  inputKelas.classList.remove("field--invalid");
}

// ============================================================
// UTIL: SET STATE LOADING PADA TOMBOL "CEK HASIL"
// ============================================================
function setLoading(isLoading) {
  btnCek.disabled = isLoading;
  btnSpinner.hidden = !isLoading;
  loadingText.hidden = !isLoading;
}

// ============================================================
// VALIDASI INPUT
// ============================================================
function validateInput(nama, kelas) {
  let valid = true;
  errNama.textContent = "";
  errKelas.textContent = "";
  errGeneral.textContent = "";
  inputNama.classList.remove("field--invalid");
  inputKelas.classList.remove("field--invalid");

  if (!nama) {
    errNama.textContent = "Nama lengkap wajib diisi.";
    inputNama.classList.add("field--invalid");
    valid = false;
  }
  if (!kelas) {
    errKelas.textContent = "Kelas wajib diisi.";
    inputKelas.classList.add("field--invalid");
    valid = false;
  }
  return valid;
}

// ============================================================
// RENDER SURAT HASIL TES BERDASARKAN DATA DARI SUPABASE
// ============================================================
function renderLetter(data) {
  const nilai = Number(data.nilai);
  const lulus = nilai >= BATAS_KELULUSAN;

  letterNomor.textContent = NOMOR_SURAT;
  letterNama.textContent = data.nama;
  letterKelas.textContent = data.kelas;
  letterNilai.textContent = String(nilai);
  letterTanggal.textContent = formatTanggalIndonesia(new Date());

  letterStatus.innerHTML = "";
  const statusSpan = document.createElement("span");
  statusSpan.className = lulus
    ? "status-text status-text--pass"
    : "status-text status-text--fail";
  statusSpan.textContent = lulus ? "LULUS" : "TIDAK LULUS";
  letterStatus.appendChild(statusSpan);

  showView(letterView);
}

// ============================================================
// AMBIL DATA DARI SUPABASE MELALUI RPC "get_hasil_tes"
// (Bukan SELECT langsung — lihat supabase-setup.sql untuk alasannya)
// ============================================================
async function cekHasilTes(nama, kelas) {
  setLoading(true);
  try {
    const { data, error } = await supabaseClient.rpc("get_hasil_tes", {
      p_nama: nama,
      p_kelas: kelas,
    });

    if (error) {
      console.error("Supabase error:", error);
      errGeneral.textContent =
        "Terjadi kesalahan saat mengambil data. Silakan coba lagi beberapa saat kemudian.";
      return;
    }

    // RPC mengembalikan array (bisa kosong jika tidak ditemukan)
    const row = Array.isArray(data) ? data[0] : data;

    if (!row) {
      showView(notfoundView);
      return;
    }

    if (row.nilai === null || row.nilai === undefined || isNaN(Number(row.nilai))) {
      errGeneral.textContent =
        "Terjadi kesalahan saat mengambil data. Silakan coba lagi beberapa saat kemudian.";
      return;
    }

    renderLetter(row);
  } catch (err) {
    console.error("Network/unexpected error:", err);
    errGeneral.textContent =
      "Terjadi kesalahan saat mengambil data. Silakan coba lagi beberapa saat kemudian.";
  } finally {
    setLoading(false);
  }
}

// ============================================================
// EVENT: SUBMIT FORM PENGECEKAN
// ============================================================
checkForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const nama = inputNama.value.trim().replace(/\s+/g, " ");
  const kelas = inputKelas.value.trim().replace(/\s+/g, " ");

  if (!validateInput(nama, kelas)) return;

  cekHasilTes(nama, kelas);
});

// ============================================================
// EVENT: TOMBOL KEMBALI
// ============================================================
btnBackFromNotfound.addEventListener("click", () => {
  resetForm();
  showView(checkView);
});

btnBackFromLetter.addEventListener("click", () => {
  resetForm();
  showView(checkView);
});

// ============================================================
// EVENT: CETAK / SIMPAN PDF
// ============================================================
btnPrint.addEventListener("click", () => {
  window.print();
});

// ============================================================
// STATE AWAL: hanya tampilkan form pengecekan
// ============================================================
showView(checkView);
