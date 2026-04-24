from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_order_drop_lat_order_drop_lng_order_pickup_lat_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='accepted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
