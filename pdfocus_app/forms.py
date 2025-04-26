from django import forms
from .models import PDFDocument, Note

class PDFUploadForm(forms.ModelForm):
    class Meta:
        model = PDFDocument
        fields = ['title', 'file', 'document_type', 'theme', 'authors', 'keywords']
        widgets = {
            'authors': forms.SelectMultiple(attrs={'class': 'form-select'}),
            'document_type': forms.Select(attrs={'class': 'form-select'}),
            'theme': forms.Select(attrs={'class': 'form-select'}),
        }

class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ['text', 'page_number']
        widgets = {
            'text': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'maxlength': 140}),
            'page_number': forms.NumberInput(attrs={'class': 'form-control', 'min': 1})
        }