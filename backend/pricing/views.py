from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .services.pricing import pricing_engine, MINIMUM_PRICE, calculate_service_fee, get_service_fee_breakdown
from chatbot.services.geocoding import geocode_address


class PricingAPIView(APIView):
    """
    API untuk mendapatkan harga jasa berdasarkan destination address.
    
    Menggunakan formula AKUMULATIF:
    - Tarif jarak dari database (PriceSetting)
    - Service fee per titik: 1000, 1000, 2000, 3000, 3000...
    - Total dibulatkan ke atas (kelipatan 1000)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        POST with destination address and get calculated price
        
        Request body:
        {
            "address": "destination address",
            "stops": 1  (jumlah titik pengantaran, default 1)
        }
        """
        try:
            address = request.data.get("address", "").strip()
            stops = int(request.data.get("stops", 1))
            
            if stops < 1:
                stops = 1
            
            if not address:
                return Response(
                    {"error": "Address is required"},
                    status=400
                )
            
            # Get branch from user
            branch = request.user.branch
            if not branch:
                return Response(
                    {"error": "User has no assigned branch"},
                    status=400
                )
            
            # Geocode address
            dest_coords = geocode_address(address)
            if not dest_coords:
                return Response(
                    {"error": "Could not geocode address"},
                    status=400
                )
            
            # Calculate price using pricing engine with stops
            pricing_result = pricing_engine(
                branch=branch,
                dest_lat=dest_coords['lat'],
                dest_lon=dest_coords['lon'],
                stops=stops
            )
            
            # Build service fee breakdown for display
            breakdown = get_service_fee_breakdown(stops)
            service_breakdown = [
                {"titik": t, "fee": f} for t, f in breakdown
            ]
            
            response = {
                "address": address,
                "distance": pricing_result.get("distance"),
                "tarif": pricing_result.get("tarif"),
                "stops": stops,
                "service_fee": pricing_result.get("service_fee"),
                "service_breakdown": service_breakdown,
                "total_raw": pricing_result.get("total_raw"),
                "price": pricing_result.get("price"),
                "minimum_price": MINIMUM_PRICE,
                "currency": "IDR"
            }
            
            return Response(response)
            
        except Exception as e:
            print(f"❌ Error calculating price: {e}")
            return Response(
                {"error": "Failed to calculate price"},
                status=500
            )
