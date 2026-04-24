from django.db import models

# Create your models here.
class PriceSetting(models.Model):
    name = models.CharField(max_length=100)
    branch = models.ForeignKey('branch.Branch', on_delete=models.CASCADE)

    min_km = models.FloatField()
    max_km = models.FloatField(null=True, blank=True)

    price = models.IntegerField(null=True, blank=True)

    is_formula = models.BooleanField(default=False)
    per_km_rate = models.IntegerField(null=True, blank=True)
    subtract_value = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name