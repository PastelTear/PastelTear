from django import forms
from django.template.defaultfilters import filesizeformat

from .models import PDFDocument

class PDFUploadForm(forms.ModelForm):
    class Meta:
        model = PDFDocument
        fields = ('file',)
        widgets = {
            'file': forms.FileInput(attrs={
                'accept': '.pdf',
                'class': 'custom-file-input'
            })
        }

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if not file.name.endswith('.pdf'):
            raise forms.ValidationError("Разрешены только PDF-файлы")
        return file

    def clean_file2(self):
        file = self.cleaned_data.get('file')
        if file.size > settings.MAX_UPLOAD_SIZE:
            raise forms.ValidationError(
                f"Максимальный размер файла {filesizeformat(settings.MAX_UPLOAD_SIZE)}"
            )
        return file