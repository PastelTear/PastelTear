from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Расширенная модель пользователя"""
    storage_limit = models.BigIntegerField(default=2147483648)  # 2GB лимит
    @property
    def storage_used(self):
        return sum(pdf.file_size for pdf in self.pdfdocument_set.all())

class DocumentType(models.Model):
    """Типы документов (книга/статья/другое)"""
    name = models.CharField(max_length=128)

    def __str__(self):
        return self.name

class DocumentTheme(models.Model):
    """Темы документов"""
    name = models.CharField(max_length=128)

    def __str__(self):
        return self.name

class Author(models.Model):
    """Авторы документов"""
    full_name = models.CharField(max_length=128)

    def __str__(self):
        return self.full_name

class Keyword(models.Model):
    """Ключевые слова"""
    words = models.CharField(max_length=512)  # Список ключевых слов через запятую

    def __str__(self):
        return self.words

class PDFDocument(models.Model):
    """Основная модель PDF документа"""
    title = models.CharField(max_length=128)
    file = models.FileField(upload_to='pdfs/')
    upload_date = models.DateTimeField(auto_now_add=True)
    file_size = models.BigIntegerField()  # В байтах
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    theme = models.ForeignKey(DocumentTheme, on_delete=models.PROTECT)
    keywords = models.OneToOneField(Keyword, on_delete=models.SET_NULL, null=True)
    authors = models.ManyToManyField(Author)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    extracted_text = models.TextField(blank=True)  # Распознанный текст

    def save(self, *args, **kwargs):
        """Автоматический расчет размера файла при сохранении"""
        if not self.file_size:
            self.file_size = self.file.size
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.document_type})"

class Collection(models.Model):
    """Коллекции документов"""
    name = models.CharField(max_length=128)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    documents = models.ManyToManyField(PDFDocument, through='CollectionMembership')

    def __str__(self):
        return self.name

class CollectionMembership(models.Model):
    """Промежуточная таблица для связи Коллекция-PDF"""
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    document = models.ForeignKey(PDFDocument, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('collection', 'document')

class Note(models.Model):
    """Заметки к документам"""
    text = models.CharField(max_length=140)
    document = models.ForeignKey(PDFDocument, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    page_number = models.IntegerField()  # Номер страницы, к которой привязана заметка

    def __str__(self):
        return f"Note for {self.document.title} (p.{self.page_number})"