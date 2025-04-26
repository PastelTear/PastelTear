from django.contrib import admin
from django.urls import path, include
from pdfocus_app import views
from . import views

from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import register_user
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('', views.home, name='home'),
    path('accounts/login/', auth_views.LoginView.as_view(template_name='pdfocus_app/project.html'), name='login'),
    path('accounts/register/', register_user, name='register'),
    path('upload/', views.upload_pdf, name='upload_pdf'),
    path('pdf/<int:pk>/', views.pdf_actions, name='pdf_actions'),
    path('pdf/<int:pdf_id>/notes/', views.handle_notes, name='handle_notes'),
    path('notes/<int:note_id>/delete/', views.delete_note, name='delete_note'),
    path('search/', views.search_pdfs, name='search_pdfs'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
