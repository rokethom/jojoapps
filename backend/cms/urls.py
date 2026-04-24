from rest_framework.routers import DefaultRouter
from .views import BannerViewSet, PromoViewSet, MenuViewSet

router = DefaultRouter()
router.register(r'banners', BannerViewSet)
router.register(r'promos', PromoViewSet)
router.register(r'menus', MenuViewSet)

urlpatterns = router.urls