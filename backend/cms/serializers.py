from rest_framework import serializers
from .models import CMSBanner, CMSPromo, CMSMenu


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMSBanner
        fields = '__all__'


class PromoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMSPromo
        fields = '__all__'


class MenuSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMSMenu
        fields = '__all__'