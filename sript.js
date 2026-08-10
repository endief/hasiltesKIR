// ==========================================
// KONFIGURASI SISTEM
// ==========================================

// MASUKKAN_SUPABASE_URL (Ganti dengan URL Project Anda dari Dashboard Supabase)
const SUPABASE_URL = "https://gantidenganurlprojectmu.supabase.co"; 

// MASUKKAN_SUPABASE_ANON_KEY (Ganti dengan anon/public key dari Dashboard Supabase)
const SUPABASE_ANON_KEY = "eyJh...gantidengankeyanonmu..."; 

// Konstanta
const BATAS_KELULUSAN = 75;
const NOMOR_SURAT = "001/KIR/SMAN1-LMH/VIII/2026";

// Inisialisasi Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// ELEMEN DOM
// ==========================================
const formSection = document.getElementById('form-section');
const resultSection = document.getElementById('result-section');
const cekForm = document.getElementById('cek-form');
const namaInput = document.getElementById('nama');
const kelasInput = document.getElementById('kelas');
const errorMessage = document.getElementById('error-message');
const btnSubmit = document.getElementById('btn-submit');
const btnText = document.getElementById('btn-text');
const btnLoading = document.getElementById('btn-loading');

const btnKembali = document.getElementById('btn-kembali');
const btnCetak = document.getElementById('btn-cetak');

// DOM Data Surat
const resNama = document.getElementById('res-nama');
const resKelas = document.getElementById('res-kelas');
const resNilai = document.getElementById('res-nilai');
const resStatusText = document.getElementById('res-status-text');
const resStatusBox = document.getElementById('res-status-box');
const resTanggal = document.getElementById('res-tanggal');
const suratNomor = document.getElementById('surat-nomor');

// Set Nomor Surat Awal
suratNomor.innerText = `Nomor: ${NOMOR_SURAT}`;

// ==========================================
// EVENT LISTENERS
// ==========================================

cekForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const inputNama = namaInput.value.trim();
    const inputKelas = kelasInput.value.trim();

    // Validasi kosong
    if (!inputNama || !inputKelas) {
        showError("Nama dan Kelas wajib diisi.");
        return;
    }

    hideError();
    setLoading(true);

    try {
        // Query ke Supabase (Pencarian Case Insensitive menggunakan .ilike)
        const { data, error } = await supabase
            .from('hasil_tes')
            .select('*')
            .ilike('nama', inputNama)
            .ilike('kelas', inputKelas)
            .limit(1)
            .single(); // Ambil 1 data saja

        if (error) {
            if (error.code === 'PGRST116') { // Kode error Supabase jika data tidak ditemukan (single() fetch)
                showError("Data siswa tidak ditemukan. Periksa kembali nama dan kelas yang Anda masukkan.");
            } else {
                console.error(error);
                showError("Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti.");
            }
        } else if (data) {
            generateSurat(data);
        }

    } catch (err) {
        console.error(err);
        showError("Terjadi kesalahan jaringan atau koneksi.");
    } finally {
        setLoading(false);
    }
});

btnKembali.addEventListener('click', () => {
    // Reset form dan tampilan
    cekForm.reset();
    hideError();
    
    resultSection.classList.remove('active');
    resultSection.classList.add('hidden');
    
    formSection.classList.remove('hidden');
    formSection.classList.add('active');
});

btnCetak.addEventListener('click', () => {
    window.print();
});

// ==========================================
// FUNGSI UTAMA
// ==========================================

function generateSurat(data) {
    // 1. Isi Data Identitas
    resNama.innerText = uppercaseWords(data.nama);
    resKelas.innerText = data.kelas.toUpperCase();
    resNilai.innerText = data.nilai;

    // 2. Logika Kelulusan Front-end
    if (data.nilai >= BATAS_KELULUSAN) {
        resStatusText.innerText = "LULUS";
        resStatusBox.className = "status-box status-lulus";
    } else {
        resStatusText.innerText = "TIDAK LULUS";
        resStatusBox.className = "status-box status-tidak-lulus";
    }

    // 3. Set Tanggal Cetak/Hari Ini
    const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const today = new Date().toLocaleDateString('id-ID', dateOptions);
    resTanggal.innerText = `Cirebon, ${today}`;

    // 4. Transisi Halaman
    formSection.classList.remove('active');
    formSection.classList.add('hidden');
    
    resultSection.classList.remove('hidden');
    resultSection.classList.add('active');
}

// Fungsi Bantuan
function showError(msg) {
    errorMessage.innerText = msg;
    errorMessage.style.display = "block";
}

function hideError() {
    errorMessage.style.display = "none";
    errorMessage.innerText = "";
}

function setLoading(isLoading) {
    btnSubmit.disabled = isLoading;
    if (isLoading) {
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

// Ubah "andi saputra" menjadi "Andi Saputra" agar rapi di surat
function uppercaseWords(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
