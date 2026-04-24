from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_user_is_suspended_user_suspension_reason'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='suspended_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='oper_handle_count',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
