from django.db import migrations
from django.db.models import IntegerField, Max
from django.db.models.functions import Cast


def normalize_student_ids(apps, schema_editor):
    StudentProfile = apps.get_model("authentication", "StudentProfile")
    base_start = 221002001
    agg = StudentProfile.objects.annotate(num=Cast("student_id", IntegerField())).aggregate(max_num=Max("num"))
    current_max = agg.get("max_num") or 0
    next_num = max(base_start, current_max + 1)

    for student in StudentProfile.objects.order_by("id"):
        sid = student.student_id or ""
        if len(str(sid)) >= 9:
            continue
        student.student_id = f"{next_num:09d}"
        next_num += 1
        student.save(update_fields=["student_id"])


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0003_studentprofile_student_id'),
    ]

    operations = [
        migrations.RunPython(normalize_student_ids, migrations.RunPython.noop),
    ]
