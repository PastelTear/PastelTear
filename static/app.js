// Инициализация PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// Текущий пользователь и состояние
let currentUser = {
    name: "Анжелика Каткова",
    joinDate: "04.04.2025",
    files: [],
    notes: {},
    storage_used: 0,
    storage_limit: 1073741824, // 1GB
    get storage_percent() {
        return Math.round((this.storage_used / this.storage_limit) * 100);
    }
};

let currentPdf = null;
let currentPdfId = null; // Добавлена инициализация
let currentPage = 1;
let totalPages = 1;
let uploadedFiles = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Показать главную страницу для авторизованных пользователей
    if ({{ user.is_authenticated|yesno:"true,false" }}) {
        navigate('main');
    } else {
        navigate('login');
    }

    initMainPage();
    updateUserInfo();
    loadSamplePdfFiles();
    loadUserNotes();
});

// Обновление информации о пользователе
function updateUserInfo() {
    document.getElementById('username').textContent = currentUser.name;
    document.getElementById('join-date').textContent = currentUser.joinDate;
    document.getElementById('user-avatar').textContent = currentUser.name.split(' ').map(n => n[0]).join('');
    document.getElementById('user-files-count').textContent = currentUser.files.length;
    document.getElementById('user-notes-count').textContent = Object.keys(currentUser.notes).length;
}

// Навигация по страницам
function navigate(page) {
    if (!{{ user.is_authenticated|yesno:"true,false" }} && page !== 'login' && page !== 'register') {
        page = 'login';
    }

    const pages = ['main', 'catalog', 'account', 'login', 'register'];
    pages.forEach(p => document.getElementById(p + '-page').style.display = 'none');

    const pageElement = document.getElementById(page + '-page');
    if (pageElement) pageElement.style.display = 'block';

    // Обновление активного меню
    document.querySelectorAll('.sidebar-menu li a').forEach(item => {
        item.classList.remove('active');
    });
    const activeLink = document.querySelector(`.sidebar-menu li a[onclick*="${page}"]`);
    if (activeLink) activeLink.classList.add('active');
}

// Функция для получения CSRF токена
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Загрузка PDF
function handlePdfUpload(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }

    fetch('/upload/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser.files.push({
                id: data.pdf_id,
                name: data.title,
                url: data.url
            });
            updateUserInfo();
            loadUserPdfFiles();
        }
    });
}

// Инициализация главной страницы
function initMainPage() {
    const uploadArea = document.getElementById('upload-area');
    const pdfUpload = document.getElementById('pdf-upload');

    // Обработка перетаскивания файлов
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f9ff';
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.backgroundColor = '';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';

        if (e.dataTransfer.files.length) {
            handlePdfUpload(e.dataTransfer.files);
        }
    });

    pdfUpload.addEventListener('change', function() {
        if (pdfUpload.files.length) {
            handlePdfUpload(pdfUpload.files);
        }
    });

    // Навигация по PDF
    document.getElementById('prev-page').addEventListener('click', prevPage);
    document.getElementById('next-page').addEventListener('click', nextPage);
    document.getElementById('close-pdf').addEventListener('click', closePdf);
}

// Открытие PDF
function openPdf(file) {
    const url = URL.createObjectURL(file);

    pdfjsLib.getDocument(url).promise.then(function(pdf) {
        currentPdf = pdf;
        totalPages = pdf.numPages;
        currentPage = 1;

        document.getElementById('pdf-controls').style.display = 'flex';
        renderPage(currentPage);
    });
}

// Рендеринг страницы PDF
function renderPage(pageNum) {
    if (!currentPdf) return;

    currentPdf.getPage(pageNum).then(function(page) {
        const viewer = document.getElementById('pdf-viewer');
        viewer.innerHTML = '';

        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        viewer.appendChild(canvas);

        page.render({
            canvasContext: context,
            viewport: viewport
        });

        document.getElementById('page-num').textContent =
            `Страница ${pageNum} из ${totalPages}`;
    });
}

// Навигация по страницам PDF
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
    }
}

// Закрытие PDF
function closePdf() {
    currentPdf = null;
    document.getElementById('pdf-viewer').innerHTML = '';
    document.getElementById('pdf-controls').style.display = 'none';

    const placeholder = document.createElement('div');
    placeholder.className = 'pdf-placeholder';
    placeholder.id = 'pdf-placeholder';
    placeholder.innerHTML = `
        <i class="fas fa-file-pdf fa-4x"></i>
        <h3>Загрузите PDF-файл</h3>
        <p>Перетащите файл в эту область или нажмите кнопку "Выберите файлы"</p>
    `;
    document.getElementById('pdf-viewer').appendChild(placeholder);

    if (uploadedFiles.length === 0) {
        document.getElementById('upload-area').style.display = 'block';
    }
}

// Загрузка тестовых PDF файлов в каталог
function loadSamplePdfFiles() {
    const pdfCatalog = document.getElementById('pdf-catalog');
    pdfCatalog.innerHTML = '';

    const sampleFiles = [
        { id: 1, title: "Введение в программирование", date: "15.10.2023" },
        { id: 2, title: "Основы дизайна", date: "10.10.2023" },
        { id: 3, title: "История искусств", date: "05.10.2023" },
        { id: 4, title: "Финансы для начинающих", date: "01.10.2023" }
    ];

    sampleFiles.forEach(file => {
        createPdfCard(file, pdfCatalog);
    });
}

// Создание карточки PDF
function createPdfCard(file, container) {
    const pdfCard = document.createElement('div');
    pdfCard.className = 'pdf-card';
    pdfCard.innerHTML = `
        <div class="pdf-preview">
            <canvas></canvas>
        </div>
        <div class="pdf-info">
            <h3>${file.title}</h3>
            <div class="pdf-meta">
                <span>${new Date(file.date).toLocaleDateString()}</span>
            </div>
            <div class="pdf-actions">
                <button class="btn btn-sm btn-primary view-btn" onclick="viewSamplePdf(${file.id})">
                    <i class="fas fa-eye me-1"></i>Просмотр
                </button>
            </div>
        </div>
    `;

    const canvas = pdfCard.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#7fc7ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#005a9e';
    ctx.font = '16px Arial';
    ctx.fillText(file.title, 10, 30);

    container.appendChild(pdfCard);
}

// Просмотр примера PDF (заглушка)
function viewSamplePdf(id) {
    alert(`Открываем PDF с ID: ${id}`);
}

// Загрузка PDF файлов пользователя
function loadUserPdfFiles() {
    const userPdfFiles = document.getElementById('user-pdf-files');
    userPdfFiles.innerHTML = '';

    currentUser.files.forEach(file => {
        const pdfCard = document.createElement('div');
        pdfCard.className = 'pdf-card';
        pdfCard.innerHTML = `
            <div class="pdf-preview">
                <canvas></canvas>
            </div>
            <div class="pdf-info">
                <h3>${file.name}</h3>
                <div class="pdf-actions">
                    <button class="btn btn-sm btn-primary view-btn" onclick="viewUserPdf('${file.url}')">
                        <i class="fas fa-eye me-1"></i>Просмотр
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" onclick="deleteUserFile('${file.id}')">
                        <i class="fas fa-trash me-1"></i>Удалить
                    </button>
                </div>
            </div>
        `;

        const canvas = pdfCard.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#7fc7ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#005a9e';
        ctx.font = '16px Arial';
        ctx.fillText(file.name, 10, 30);

        userPdfFiles.appendChild(pdfCard);
    });
}

// Удаление PDF пользователя
function deleteUserFile(fileId) {
    if (confirm(`Удалить файл?`)) {
        currentUser.files = currentUser.files.filter(file => file.id !== fileId);
        updateUserInfo();
        loadUserPdfFiles();
    }
}

// Работа с заметками
function saveNote() {
    const text = document.getElementById('note-text').value.trim();
    const pageNumber = document.getElementById('note-page').value || 1;

    if (!text || !currentPdfId) return;

    const noteId = Date.now();
    currentUser.notes[noteId] = {
        text: text,
        date: new Date().toISOString(),
        page: pageNumber,
        pdfId: currentPdfId
    };

    addNoteToUI(text, currentUser.notes[noteId].date, noteId, document.getElementById('notes-list'));
    updateUserInfo();
    hideNoteForm();
}

// Авторизация
function login() {
    const formData = new URLSearchParams();
    formData.append('username', document.getElementById('login-email').value);
    formData.append('password', document.getElementById('login-password').value);

    fetch('/accounts/login/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            window.location.reload();
        } else {
            alert('Ошибка входа. Проверьте данные.');
        }
    });
}

// Регистрация
function register() {
    const formData = {
        username: document.getElementById('register-username').value,
        password1: document.getElementById('register-password').value,
        password2: document.getElementById('confirm-password').value
    };

    fetch('/accounts/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/';
        } else {
            alert('Ошибка регистрации: ' + (data.errors || ''));
        }
    });
}