from django.db import migrations


ALLOWED_CLASS_LEVELS = ["6", "7", "8", "9", "10"]


def seed_class_offerings(apps, schema_editor):
    AcademicYear = apps.get_model("academics", "AcademicYear")
    ClassOffering = apps.get_model("academics", "ClassOffering")

    for year in AcademicYear.objects.all():
        for lvl in ALLOWED_CLASS_LEVELS:
            existing = ClassOffering.objects.filter(academic_year=year, level=lvl).first()
            if existing:
                # Ensure canonical name is set.
                if existing.name != f"Class {lvl}":
                    existing.name = f"Class {lvl}"
                    existing.save(update_fields=["name"])
                continue

            obj = ClassOffering(
                academic_year=year,
                name=f"Class {lvl}",
                level=lvl,
            )
            # Permit creation for non-current years during migration.
            obj._allow_future_year = True
            obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0003_promotionrecord_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_class_offerings, migrations.RunPython.noop),
    ]
