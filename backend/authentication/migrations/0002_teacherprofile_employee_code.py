from django.db import migrations, models
from django.db.models import IntegerField, Max
from django.db.models.functions import Cast, Substr


def populate_employee_codes(apps, schema_editor):
    TeacherProfile = apps.get_model("authentication", "TeacherProfile")
    prefix = "EMP-"

    # Start from the current max numeric suffix to avoid collisions.
    agg = (
        TeacherProfile.objects.annotate(code_num=Cast(Substr("employee_code", len(prefix) + 1), IntegerField()))
        .aggregate(max_num=Max("code_num"))
    )
    next_num = (agg.get("max_num") or 0) + 1

    for teacher in TeacherProfile.objects.order_by("id"):
        if teacher.employee_code:
            continue
        teacher.employee_code = f"{prefix}{next_num:03d}"
        next_num += 1
        teacher.save(update_fields=["employee_code"])


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacherprofile',
            name='employee_code',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
        migrations.RunPython(populate_employee_codes, migrations.RunPython.noop),
    ]
