from django.db import migrations, models
from django.db.models import Max


def normalize_roll_numbers(apps, schema_editor):
    Enrollment = apps.get_model("academics", "Enrollment")
    groups = {}
    for enrollment in Enrollment.objects.select_related("academic_year", "class_offering").order_by("id"):
        key = (enrollment.academic_year_id, enrollment.class_offering_id)
        groups.setdefault(key, []).append(enrollment)

    for key, enrollments in groups.items():
        next_roll = 1
        for enrollment in enrollments:
            # Try to parse existing roll_number if present.
            if enrollment.roll_number:
                try:
                    parsed = int(enrollment.roll_number)
                    enrollment.roll_number = parsed
                except (TypeError, ValueError):
                    enrollment.roll_number = None
            if not enrollment.roll_number:
                enrollment.roll_number = next_roll
            next_roll = max(next_roll, enrollment.roll_number + 1)
            enrollment.save(update_fields=["roll_number"])


class Migration(migrations.Migration):

    # Avoid running all operations in a single transaction so the constraint/index
    # can be created after data fixes without pending trigger events.
    atomic = False

    dependencies = [
        ('academics', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='enrollment',
            name='roll_number',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(normalize_roll_numbers, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='enrollment',
            constraint=models.UniqueConstraint(condition=models.Q(('roll_number__isnull', False)), fields=('academic_year', 'class_offering', 'roll_number'), name='unique_roll_per_class_year'),
        ),
    ]
