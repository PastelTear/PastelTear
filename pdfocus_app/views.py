from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.http import JsonResponse
from .models import PDFDocument, Collection, Note, DocumentType, DocumentTheme, Author
from .forms import PDFUploadForm, NoteForm
from django.views.decorators.http import require_http_methods
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
import os

def register_user(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return JsonResponse({
                'success': True,
                'redirect': '/'
            })
        return JsonResponse({
            'success': False,
            'errors': form.errors.get_json_data()
        }, status=400)
    return JsonResponse({'success': False}, status=405)

@login_required
def home(request):
    context = {
        'user': request.user,
        'form': AuthenticationForm(),
        'storage_used': sum(pdf.file_size for pdf in request.user.pdfdocument_set.all()),
        'storage_limit': request.user.storage_limit,
        'storage_percent': (request.user.storage_used / request.user.storage_limit * 100)
                        if request.user.storage_limit else 0,
        'collections': request.user.collection_set.all()
    }
    return render(request, 'pdfocus_app/project.html', context)
@login_required
def upload_pdf(request):
    if request.method == 'POST':
        form = PDFUploadForm(request.POST, request.FILES)
        if form.is_valid():
            pdf = form.save(commit=False)
            pdf.owner = request.user
            pdf.file_size = pdf.file.size
            pdf.save()
            form.save_m2m()

            # Для AJAX-запросов
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'pdf_id': pdf.pk,
                    'title': pdf.title,
                    'url': pdf.file.url
                })
            return redirect('home')

        # Обработка ошибок для AJAX
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'errors': form.errors
            }, status=400)

    return JsonResponse({'success': False}, status=400)


@login_required
def pdf_actions(request, pk):
    pdf = PDFDocument.objects.get(pk=pk, owner=request.user)

    if request.method == 'POST':
        # Обновление метаданных
        pdf.title = request.POST.get('title', pdf.title)
        pdf.document_type_id = request.POST.get('document_type')
        pdf.theme_id = request.POST.get('theme')
        pdf.authors.set(request.POST.getlist('authors'))
        pdf.save()

        return JsonResponse({'success': True})

    # Получение информации о PDF
    return JsonResponse({
        'title': pdf.title,
        'document_type': pdf.document_type_id,
        'theme': pdf.theme_id,
        'authors': list(pdf.authors.values_list('id', flat=True)),
        'extracted_text': pdf.extracted_text
    })


@login_required
def handle_notes(request, pdf_id):
    pdf = PDFDocument.objects.get(pk=pdf_id, owner=request.user)

    if request.method == 'POST':
        form = NoteForm(request.POST)
        if form.is_valid():
            note = form.save(commit=False)
            note.document = pdf
            note.save()
            return JsonResponse({
                'success': True,
                'note': {
                    'id': note.id,
                    'text': note.text,
                    'page_number': note.page_number,
                    'created_at': note.created_at.strftime('%d.%m.%Y %H:%M')
                }
            })
        return JsonResponse({'success': False, 'errors': form.errors}, status=400)

    # Получение списка заметок
    notes = Note.objects.filter(document=pdf).values('id', 'text', 'page_number', 'created_at')
    return JsonResponse({'notes': list(notes)})


@login_required
def delete_note(request, note_id):
    note = Note.objects.get(pk=note_id, document__owner=request.user)
    note.delete()
    return JsonResponse({'success': True})


@login_required
def search_pdfs(request):
    query = request.GET.get('q', '').lower()
    pdfs = PDFDocument.objects.filter(
        owner=request.user,
        title__icontains=query
    ).values('id', 'title', 'file', 'upload_date')

    return JsonResponse({'results': list(pdfs)})