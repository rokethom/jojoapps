from rest_framework import serializers
from .models import User
from .location_utils import detect_branch_by_location, assign_default_branch
from branch.models import Branch


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True)
    phone = serializers.CharField()
    latitude = serializers.FloatField(required=False, write_only=True, allow_null=True)
    longitude = serializers.FloatField(required=False, write_only=True, allow_null=True)
    branch_id = serializers.IntegerField(required=False, write_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'name', 'phone', 'latitude', 'longitude', 'branch_id')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        name = validated_data.pop('name')
        password = validated_data.pop('password')
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        branch_id = validated_data.pop('branch_id', None)
        
        # Validate required fields
        if not name or not name.strip():
            raise serializers.ValidationError({"name": "Nama tidak boleh kosong"})
        
        print(f"\n🔵 Creating user: {validated_data.get('username')}")
        print(f"   Name: {name}")
        print(f"   Phone: {validated_data.get('phone')}")
        print(f"   Location: ({latitude}, {longitude})")
        print(f"   Branch ID: {branch_id}")
        
        user = User.objects.create(
            role='customer',
            first_name=name,
            **validated_data
        )
        user.set_password(password)
        
        # Priority 1: Manual branch selection (from dropdown)
        if branch_id:
            try:
                branch = Branch.objects.get(id=branch_id)
                user.branch = branch
                print(f"✅ Manual branch selected: {branch.name}")
            except Branch.DoesNotExist:
                print(f"⚠️ Branch {branch_id} not found, will use auto-detection")
        
        # Priority 2: Auto-detect branch based on registration location
        if not user.branch and latitude and longitude:
            print(f"📍 User registration location: ({latitude}, {longitude})")
            detected_branch = detect_branch_by_location(latitude, longitude)
            if detected_branch:
                user.branch = detected_branch
                print(f"✅ Auto-assigned branch: {detected_branch.name}")
        
        # Priority 3: Fallback - assign default branch if still no branch
        if not user.branch:
            print(f"ℹ️ No branch detected, assigning default...")
            assign_default_branch(user)
        
        user.save()
        print(f"✅ User saved: {user.id}")
        
        # Create UserProfile
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'name': name,
                'phone': user.phone,
                'latitude': latitude,
                'longitude': longitude
            }
        )
        if created:
            print(f"✅ UserProfile created: {profile.id}")
        else:
            print(f"✅ UserProfile already exists: {profile.id}")
        
        print(f"\n✅ User registration complete: {user.username}\n")
        return user
