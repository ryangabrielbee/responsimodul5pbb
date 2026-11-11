// App State
let currentPage = 'home';
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let profile = JSON.parse(localStorage.getItem('profile')) || {
  nama: 'Nama Mahasiswa',
  nim: 'NIM123456',
  kelompok: 'Kelompok A'
};
let editingId = null;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
  });
});

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  renderPage();
}

function renderPage() {
  const app = document.getElementById('app');
  switch (currentPage) {
    case 'home':
      app.innerHTML = renderHome();
      break;
    case 'notes':
      app.innerHTML = renderNotes();
      attachNotesEvents();
      break;
    case 'profile':
      app.innerHTML = renderProfile();
      attachProfileEvents();
      break;
  }
}

// Home Page
function renderHome() {
  const recentNotes = notes.slice(-3).reverse();
  return `
    <div class="page active">
      <h1>Selamat Datang</h1>
      <div class="card">
        <h2>Halo, ${profile.nama}!</h2>
        <p>Ini adalah aplikasi Catatan Mahasiswa Progressive Web App.</p>
        <p style="margin-top: 0.8rem;">Anda memiliki <strong>${notes.length}</strong> catatan tersimpan.</p>
        <button class="btn" style="margin-top: 1rem;" onclick="navigateTo('notes')">Lihat Semua Catatan</button>
      </div>
      ${recentNotes.length > 0 ? `
        <h2>Catatan Terbaru</h2>
        ${recentNotes.map(note => `
          <div class="card">
            <h3>${escapeHtml(note.title)}</h3>
            <p class="note-meta">${new Date(note.date).toLocaleString('id-ID')}</p>
            <p>${escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
          </div>
        `).join('')}
      ` : '<div class="card empty-state">Belum ada catatan. Yuk buat yang pertama!</div>'}
    </div>
  `;
}

// Notes CRUD Page
function renderNotes() {
  return `
    <div class="page active">
      <h1>Manajemen Catatan</h1>
      
      <div class="card">
        <h2 id="form-title">${editingId ? 'Edit Catatan' : 'Tambah Catatan Baru'}</h2>
        <form id="note-form">
          <div class="form-group">
            <label for="title">Judul</label>
            <input type="text" id="title" required placeholder="Judul catatan...">
          </div>
          <div class="form-group">
            <label for="content">Isi Catatan</label>
            <textarea id="content" required placeholder="Tulis catatan Anda di sini..."></textarea>
          </div>
          <button type="submit" class="btn">${editingId ? 'Update' : 'Simpan'}</button>
          ${editingId ? '<button type="button" class="btn btn-secondary" id="cancel-edit" style="margin-left: 0.5rem;">Batal</button>' : ''}
        </form>
      </div>

      <h2>Daftar Catatan (${notes.length})</h2>
      <div id="notes-list">
        ${notes.length === 0 
          ? '<div class="card empty-state">Belum ada catatan. Tambahkan catatan pertama Anda!</div>'
          : notes.slice().reverse().map(note => `
            <div class="note-item" data-id="${note.id}">
              <h3>${escapeHtml(note.title)}</h3>
              <p class="note-meta">${new Date(note.date).toLocaleString('id-ID')}</p>
              <p>${escapeHtml(note.content)}</p>
              <div class="note-actions">
                <button class="btn btn-secondary edit-btn" data-id="${note.id}">Edit</button>
                <button class="btn btn-danger delete-btn" data-id="${note.id}">Hapus</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}

function attachNotesEvents() {
  const form = document.getElementById('note-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value.trim();
      const content = document.getElementById('content').value.trim();
      
      if (editingId) {
        // Update
        const index = notes.findIndex(n => n.id === editingId);
        if (index !== -1) {
          notes[index].title = title;
          notes[index].content = content;
          notes[index].date = new Date().toISOString();
        }
        editingId = null;
      } else {
        // Create
        notes.push({
          id: Date.now(),
          title,
          content,
          date: new Date().toISOString()
        });
      }
      
      saveNotes();
      renderPage();
    });
  }

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const note = notes.find(n => n.id === id);
      if (note) {
        editingId = id;
        renderPage();
        setTimeout(() => {
          document.getElementById('title').value = note.title;
          document.getElementById('content').value = note.content;
        }, 50);
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Yakin ingin menghapus catatan ini?')) {
        const id = parseInt(btn.dataset.id);
        notes = notes.filter(n => n.id !== id);
        saveNotes();
        renderPage();
      }
    });
  });

  const cancelBtn = document.getElementById('cancel-edit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      renderPage();
    });
  }
}

// Profile Page
function renderProfile() {
  return `
    <div class="page active">
      <h1>Profil Mahasiswa</h1>
      <div class="card">
        <form id="profile-form">
          <div class="form-group">
            <label for="nama">Nama Lengkap</label>
            <input type="text" id="nama" value="${escapeHtml(profile.nama)}" required>
          </div>
          <div class="form-group">
            <label for="nim">NIM</label>
            <input type="text" id="nim" value="${escapeHtml(profile.nim)}" required>
          </div>
          <div class="form-group">
            <label for="kelompok">Kelompok</label>
            <input type="text" id="kelompok" value="${escapeHtml(profile.kelompok)}" required>
          </div>
          <button type="submit" class="btn">Simpan Profil</button>
        </form>
        <div id="profile-saved" style="margin-top: 1rem; color: #38a169; display: none;">
          Profil berhasil disimpan!
        </div>
      </div>
      
      <div class="card">
        <h2>Informasi Tersimpan</h2>
        <p><strong>Nama:</strong> ${escapeHtml(profile.nama)}</p>
        <p><strong>NIM:</strong> ${escapeHtml(profile.nim)}</p>
        <p><strong>Kelompok:</strong> ${escapeHtml(profile.kelompok)}</p>
      </div>
    </div>
  `;
}

function attachProfileEvents() {
  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      profile.nama = document.getElementById('nama').value.trim();
      profile.nim = document.getElementById('nim').value.trim();
      profile.kelompok = document.getElementById('kelompok').value.trim();
      localStorage.setItem('profile', JSON.stringify(profile));
      
      const savedMsg = document.getElementById('profile-saved');
      if (savedMsg) {
        savedMsg.style.display = 'block';
        setTimeout(() => savedMsg.style.display = 'none', 2000);
      }
      renderPage();
    });
  }
}

// Helpers
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Init
navigateTo('home');
