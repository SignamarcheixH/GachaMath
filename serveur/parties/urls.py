from django.urls import path

from . import views

urlpatterns = [
    path("inscription", views.inscription),
    path("reprise", views.reprise),
    path("moi", views.moi),
    path("deconnexion", views.deconnexion),
    path("partie", views.partie),
    path("classement", views.classement),
    path("retour", views.retour),
    path("retours", views.retours),
    path("retours/<int:retour_id>/voix", views.voter),
]
