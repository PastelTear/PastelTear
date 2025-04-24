from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import PDFDocument
from .forms import PDFUploadForm
from django.conf import settings
import os
from .pdf_processor import process_pdf
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseBadRequest


@csrf_exempt
def api_upload_pdf(request):
    if request.method == 'POST' and request.FILES.get('file'):
        pdf = PDFDocument(file=request.FILES['file'])
        pdf.save()

        try:
            result = process_pdf(pdf.file.path)
            return JsonResponse({
                'status': 'success',
                'result': result,
                'pdf_id': pdf.id
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

    return HttpResponseBadRequest("Invalid request")

def upload_pdf(request):
    if request.method == 'POST':
        form = PDFUploadForm(request.POST, request.FILES)
        if form.is_valid():
            pdf = form.save(commit=False)
            pdf.user = request.user
            pdf.save()

            # Обработка PDF
            result = process_pdf(pdf.file.path)
            pdf.extracted_text = str(result)
            pdf.save()

            return redirect('results', pk=pdf.id)
    else:
        form = PDFUploadForm()
    return render(request, 'pdfocus_app/index.html', {'form': form})


def results_view(request, pk):
    pdf = PDFDocument.objects.get(pk=pk)
    return render(request, 'pdfocus_app/results.html', {
        'pdf': pdf,
        'text_data': eval(pdf.extracted_text)  # Будьте осторожны с eval!
    })


from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseBadRequest


@csrf_exempt
def api_upload_pdf(request):
    if request.method == 'POST' and request.FILES.get('file'):
        pdf = PDFDocument(file=request.FILES['file'])
        pdf.save()

        try:
            result = process_pdf(pdf.file.path)
            return JsonResponse({
                'status': 'success',
                'result': result,
                'pdf_id': pdf.id
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})

    return HttpResponseBadRequest("Invalid request")