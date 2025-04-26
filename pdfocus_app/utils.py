from django.core.management.base import BaseCommand
from pdfocus_app.models import PDFDocument
import pytesseract
from pdf2image import convert_from_path
import os


class Command(BaseCommand):
    def handle(self, *args, **options):
        for pdf in PDFDocument.objects.filter(extracted_text=''):
            try:
                # Конвертация PDF в изображения
                images = convert_from_path(pdf.file.path)

                # Извлечение текста с помощью Tesseract
                full_text = []
                for i, image in enumerate(images):
                    text = pytesseract.image_to_string(image, lang='rus+eng')
                    full_text.append(f"--- Page {i + 1} ---\n{text}")

                pdf.extracted_text = "\n".join(full_text)
                pdf.save()
                self.stdout.write(f"Processed: {pdf.title}")

            except Exception as e:
                self.stderr.write(f"Error processing {pdf.title}: {str(e)}")
