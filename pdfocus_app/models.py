from django.db import models
import os


def pdf_upload_path(instance, filename):
    return f'uploads/{instance.user.id}/{filename}'


class PDFDocument(models.Model):
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    file = models.FileField(upload_to=pdf_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_text = models.TextField(blank=True)

    def filename(self):
        return os.path.basename(self.file.name)

    def __str__(self):
        return self.filename()