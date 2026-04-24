from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from .models import CMSBanner, CMSPromo, CMSMenu
from .serializers import BannerSerializer, PromoSerializer, MenuSerializer
from users.permissions import IsAdmin 


class BannerViewSet(ModelViewSet):
    queryset = CMSBanner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class PromoViewSet(ModelViewSet):
    queryset = CMSPromo.objects.all()
    serializer_class = PromoSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class MenuViewSet(ModelViewSet):
    queryset = CMSMenu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [IsAuthenticated, IsAdmin]