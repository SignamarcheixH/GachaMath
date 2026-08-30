from django.urls import path

from . import views

urlpatterns = [
    path("inscription", views.inscription),
    path("reprise", views.reprise),
    path("moi", views.moi),
    path("deconnexion", views.deconnexion),
    path("partie", views.partie),
    path("classement", views.classement),
]
