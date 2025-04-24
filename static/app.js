 // Инициализация PDF.js
 pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
            
 // Текущий пользователь и состояние
 let currentUser = {
     name: "Анжелика Каткова",
     joinDate: "04.04.2025",
     files: [],
     notes: {}
 };
 
 let currentPdf = null;
 let currentPage = 1;
 let totalPages = 1;
 let uploadedFiles = [];
 
 // Инициализация при загрузке страницы
 document.addEventListener('DOMContentLoaded', function() {
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
     // Скрываем все страницы
     document.getElementById('main-page').style.display = 'none';
     document.getElementById('catalog-page').style.display = 'none';
     document.getElementById('account-page').style.display = 'none';
     document.getElementById('login-page').style.display = 'none';
     document.getElementById('register-page').style.display = 'none';
     
     // Показываем нужную страницу
     document.getElementById(page + '-page').style.display = 'block';
     
     // Обновляем активное меню
     document.querySelectorAll('.sidebar-menu li a').forEach(item => {
         item.classList.remove('active');
     });
     
     if (page === 'main' || page === 'catalog' || page === 'account') {
         document.querySelector(`.sidebar-menu li:nth-child(${page === 'main' ? 1 : page === 'catalog' ? 2 : 3}) a`).classList.add('active');
     }
     
     // Загружаем данные при необходимости
     if (page === 'catalog') loadSamplePdfFiles();
     if (page === 'account') loadUserPdfFiles();
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
 
 // Обработка загрузки PDF
 function handlePdfUpload(files) {
     for (let i = 0; i < files.length; i++) {
         const file = files[i];
         if (file.type === 'application/pdf') {
             uploadedFiles.push(file);
             savePdfToUserFiles(file.name);
             
             if (i === 0) {
                 openPdf(file);
             }
         }
     }
     
     if (uploadedFiles.length) {
         document.getElementById('upload-area').style.display = 'none';
         document.getElementById('pdf-placeholder').style.display = 'none';
     }
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
         
         // Рендеринг страницы
         page.render({
             canvasContext: context,
             viewport: viewport
         });
         
         // Обновление номера страницы
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
     
     // Восстанавливаем плейсхолдер
     const placeholder = document.createElement('div');
     placeholder.className = 'pdf-placeholder';
     placeholder.id = 'pdf-placeholder';
     placeholder.innerHTML = `
         <i>📄</i>
         <h3>Загрузите PDF-файл</h3>
         <p>Перетащите файл в эту область или нажмите кнопку "Выберите файлы"</p>
     `;
     document.getElementById('pdf-viewer').appendChild(placeholder);
     
     if (uploadedFiles.length === 0) {
         document.getElementById('upload-area').style.display = 'block';
     }
 }
 
 // Поиск PDF файлов
 function searchPDFs() {
     const query = document.getElementById('search-input').value.toLowerCase();
     const pdfCards = document.querySelectorAll('.pdf-card');
     
     pdfCards.forEach(card => {
         const title = card.querySelector('h3').textContent.toLowerCase();
         if (title.includes(query)) {
             card.style.display = 'block';
         } else {
             card.style.display = 'none';
         }
     });
 }
 
 // Загрузка тестовых PDF файлов в каталог
 function loadSamplePdfFiles() {
     const pdfCatalog = document.getElementById('pdf-catalog');
     pdfCatalog.innerHTML = '';
     
     const sampleFiles = [
         { title: "Введение в программирование", author: "Иван Петров", date: "15.10.2023" },
         { title: "Основы дизайна", author: "Анна Смирнова", date: "10.10.2023" },
         { title: "История искусств", author: "Михаил Иванов", date: "05.10.2023" },
         { title: "Финансы для начинающих", author: "Елена Козлова", date: "01.10.2023" }
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
                 <span>${file.author}</span>
                 <span>${file.date}</span>
             </div>
             <div class="pdf-actions">
                 <button class="view-btn" onclick="viewSamplePdf('${file.title}')">Просмотр</button>
             </div>
         </div>
     `;
     
     // Заглушка для превью
     const canvas = pdfCard.querySelector('canvas');
     const ctx = canvas.getContext('2d');
     ctx.fillStyle = '#7fc7ff';
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     ctx.fillStyle = '#005a9e';
     ctx.font = '16px Arial';
     ctx.fillText(file.title, 10, 30);
     
     container.appendChild(pdfCard);
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
                 <h3>${file}</h3>
                 <div class="pdf-actions">
                     <button class="view-btn" onclick="viewUserPdf('${file}')">Просмотр</button>
                     <button class="delete-btn" onclick="deleteUserFile('${file}')">Удалить</button>
                 </div>
             </div>
         `;
         
         // Заглушка для превью
         const canvas = pdfCard.querySelector('canvas');
         const ctx = canvas.getContext('2d');
         ctx.fillStyle = '#7fc7ff';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.fillStyle = '#005a9e';
         ctx.font = '16px Arial';
         ctx.fillText(file, 10, 30);
         
         userPdfFiles.appendChild(pdfCard);
     });
 }
 
 // Сохранение PDF в "личном кабинете"
 function savePdfToUserFiles(filename) {
     if (!currentUser.files.includes(filename)) {
         currentUser.files.push(filename);
         updateUserInfo();
         
         if (document.getElementById('account-page').style.display !== 'none') {
             loadUserPdfFiles();
         }
     }
 }
 
 // Удаление PDF пользователя
 function deleteUserFile(filename) {
     if (confirm(`Удалить файл "${filename}"?`)) {
         currentUser.files = currentUser.files.filter(file => file !== filename);
         updateUserInfo();
         loadUserPdfFiles();
     }
 }
 
 // Работа с заметками
 function showNoteForm() {
     document.getElementById('note-form').style.display = 'block';
     document.getElementById('note-text').focus();
 }
 
 function hideNoteForm() {
     document.getElementById('note-form').style.display = 'none';
     document.getElementById('note-text').value = '';
 }
 
 function saveNote() {
     const text = document.getElementById('note-text').value.trim();
     if (!text) return;
     
     const noteId = Date.now();
     currentUser.notes[noteId] = {
         text: text,
         date: new Date().toISOString()
     };
     
     addNoteToUI(text, currentUser.notes[noteId].date, noteId, document.getElementById('notes-list'));
     updateUserInfo();
     hideNoteForm();
 }
 
 function loadUserNotes() {
     const userNotesList = document.getElementById('user-notes-list');
     userNotesList.innerHTML = '';
     
     const mainNotesList = document.getElementById('notes-list');
     mainNotesList.innerHTML = '';
     
     for (let id in currentUser.notes) {
         const note = currentUser.notes[id];
         addNoteToUI(note.text, note.date, id, userNotesList);
         addNoteToUI(note.text, note.date, id, mainNotesList);
     }
 }
 
 function addNoteToUI(text, date, id, container) {
     const noteElement = document.createElement('div');
     noteElement.className = 'note';
     noteElement.innerHTML = `
         <div class="note-header">
             <span>${new Date(date).toLocaleString()}</span>
             <span class="note-delete" onclick="deleteNote('${id}')">×</span>
         </div>
         <div class="note-content">${text}</div>
     `;
     container.appendChild(noteElement);
 }
 
 function deleteNote(noteId) {
     if (confirm('Удалить эту заметку?')) {
         delete currentUser.notes[noteId];
         updateUserInfo();
         loadUserNotes();
     }
 }
 
 // Авторизация/регистрация (заглушки)
 function showLoginForm() {
     navigate('login');
 }
 
 function showRegisterForm() {
     navigate('register');
     document.getElementById('register-name').value = "Анжелика Каткова";
 }
 
 function login() {
     alert("Функция входа будет реализована в бэкенде");
     // В реальном приложении здесь будет AJAX-запрос к серверу
     navigate('main');
 }
 
 function register() {
     alert("Функция регистрации будет реализована в бэкенде");
     // В реальном приложении здесь будет AJAX-запрос к серверу
     navigate('main');
 }
 
 function logout() {
     alert("Функция выхода будет реализована в бэкенде");
     // В реальном приложении здесь будет очистка сессии
     navigate('main');
 }
 
 // Просмотр PDF (заглушки)
 function viewSamplePdf(title) {
     alert(`Открываем PDF: "${title}"`);
 }
 
 function viewUserPdf(filename) {
     alert(`Открываем ваш PDF: "${filename}"`);
 }