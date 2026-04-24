import random

RESPONSES = {
    "GREETING": [
        "Hai selamat datang di Jojo Assistant. Mau pesan apa hari ini? 😊",
        "Siap! Mau pesan apa hari ini? Jojo bantu ya!",
        "Halo! Jojo di sini. Lagi butuh bantuan layanan apa nih?",
        "Gas! Pilih layanan dulu yuk untuk lanjut 👇"
    ],
    "CHOOSE_SERVICE": [
        "Ketik angka pilihannya ya:\n1. Ojek 🏍️\n2. Delivery 🏠\n3. Kurir 📦\n4. Gift Order 🎁\n5. JojoSehat 🏥\n6. Belanja 🛒",
        "Silakan pilih layanan di bawah:\n1. Ojek\n2. Delivery\n3. Kurir\n4. Gift\n5. Sehat\n6. Belanja"
    ],
    "ASK_PICKUP": [
        "Lokasi jemputnya di mana kak?",
        "Jemput di mana nih? Kasih alamat lengkap ya.",
        "Oke, lokasi jemputnya di mana?"
    ],
    "ASK_DROP": [
        "Mau diantar ke mana?",
        "Ke alamat mana tujuannya?",
        "Antar ke mana nih? Info alamat lengkapnya ya."
    ],
    "ASK_ITEMS": [
        "Apa saja yang mau dibelikan/dipesan? (Sebutkan item & qty)",
        "Daftar pesanannya apa saja? Tulis semua di sini ya.",
        "Mau titip beli apa saja?"
    ],
    "ASK_RECIPIENT_NAME": [
        "Nama penerimanya siapa?",
        "Atas nama siapa paketnya dikirim?",
        "Siapa nama penerimanya di sana?"
    ],
    "ASK_RECIPIENT_PHONE": [
        "Berapa nomor HP/WhatsApp penerimanya?",
        "Minta nomor kontak penerimanya ya kak.",
        "Boleh minta nomor HP penerima?"
    ],
    "ASK_ITEM_TYPE": [
        "Jenis barangnya apa?",
        "Mau kirim kado/barang apa?",
        "Barangnya berupa apa kak?"
    ],
    "ASK_PRICE": [
        "Berapa harga barangnya?",
        "Info harga barangnya ya kak (untuk asuransi/pencatatan).",
        "Harganya kira-kira berapa?"
    ],
    "ASK_STOPS": [
        "Berapa titik pengantaran? (ketik angka, misal: 1, 2, 3, dll)\n\nBiaya service per titik:\n• Titik 1: Rp 1.000\n• Titik 2: Rp 1.000\n• Titik 3: Rp 2.000\n• Titik 4: Rp 3.000\n• Titik 5+: Rp 3.000/titik",
        "Mau berapa titik pengantaran? Ketik angkanya ya.\n\nInfo biaya service tiap titik:\n1→Rp1.000, 2→Rp1.000, 3→Rp2.000, 4→Rp3.000, 5+→Rp3.000",
        "Ada berapa titik tujuan? (1, 2, 3, dst)\nService fee dihitung akumulatif per titik."
    ],
    "ASK_ADD_STOP": [
        "Apakah ingin menambahkan titik tujuan lain?\n\n1. Ya\n2. Tidak",
        "Kalau mau tambah titik, ketik 1. Kalau tidak, ketik 2."
    ],
    "ASK_STOP_COUNT": [
        "Berapa titik tambahan? Ketik angka 1-5, misal 1 untuk satu titik tambahan.",
        "Masukkan jumlah titik tambahan yang ingin ditambahkan (1-5)."
    ],
    "ASK_STOP_INPUT": [
        "Masukkan alamat titik ke-{n}:",
        "Alamat titik tambahan ke-{n}:"
    ],
    "CONFIRMATION": [
        "Oke, ini ringkasan pesanan kamu ya. Sudah bener?",
        "Siap, cek dulu ya detailnya sebelum Jojo buatkan ordernya.",
        "Ringkasannya sudah sesuai? Ketik *ya* untuk konfirmasi."
    ],
    "ORDER_CREATED": [
        "✅ Mantap! Order berhasil dibuat. Jojo lagi cari driver ya.",
        "✅ Sip! Pesanan diproses. Admin bakal buatkan grup chat segera.",
        "✅ Berhasil! Order kamu sudah masuk sistem."
    ],
    "CANCELLED": [
        "Yah.. Order dibatalkan ❌ Ada lagi yang bisa Jojo bantu?",
        "Oke, dibatalkan ya. Sampai jumpa lagi!",
        "Siap, dibatalkan. Kalau butuh apa-apa chat Jojo lagi ya."
    ],
    "UNKNOWN": [
        "Jojo kurang paham maksudnya 😅 Ketik 'menu' untuk mulai dari awal ya.",
        "Aduh, Jojo bingung. Bisa diulangi atau ketik 'menu'?",
        "Coba lagi ya, atau ketik 'batal' untuk berhenti."
    ]
}

def get_msg(key):
    """Mengambil pesan random dari RESPONSES"""
    options = RESPONSES.get(key, ["Jojo sedang memikirkan jawabannya..."])
    return random.choice(options)
