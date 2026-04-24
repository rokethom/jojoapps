from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(write_only=True, required=False)
    order_id = serializers.IntegerField(write_only=True, required=False)
    order = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            'id',
            'message',
            'created_at',
            'sender_type',
            'sender_id',
            'room',
            'customer_id',
            'order_id',
            'order',
        ]
        read_only_fields = ['id', 'created_at', 'sender_type', 'sender_id', 'room']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # For creating messages, only message is required
        if self.instance is None:  # Creating new instance
            self.fields['message'].required = True
            # Make other fields not required for input
            for field_name in ['sender_type', 'sender_id', 'room', 'customer_id', 'order_id']:
                if field_name in self.fields:
                    self.fields[field_name].required = False

    def create(self, validated_data):
        # Extract fields that are not part of the model
        customer_id = validated_data.pop('customer_id', None)
        order_id = validated_data.pop('order_id', None)

        # Extract additional fields passed from views
        room = validated_data.pop('room', None)
        sender_type = validated_data.pop('sender_type', None)
        sender_id = validated_data.pop('sender_id', None)

        # Prepare data for model creation
        model_data = {
            'message': validated_data.get('message'),
        }

        # Add optional fields if provided
        if room is not None:
            model_data['room'] = room
        if sender_type is not None:
            model_data['sender_type'] = sender_type
        if sender_id is not None:
            model_data['sender_id'] = sender_id

        # Create the message with only model fields
        return ChatMessage.objects.create(**model_data)

    def get_order(self, obj):
        if obj.room and obj.room.order:
            return obj.room.order.id
        return None
