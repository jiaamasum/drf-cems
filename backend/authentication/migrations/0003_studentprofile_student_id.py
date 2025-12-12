from django.db import migrations, models
from django.db.models import IntegerField, Max
from django.db.models.functions import Cast


def populate_student_ids(apps, schema_editor):
    StudentProfile = apps.get_model("authentication", "StudentProfile")
    base_start = 225002001
    agg = StudentProfile.objects.annotate(num=Cast("student_id", IntegerField())).aggregate(max_num=Max("num"))
    next_num = (agg.get("max_num") or base_start - 1) + 1
    for student in StudentProfile.objects.order_by("id"):
        if student.student_id:
            continue
        student.student_id = str(next_num)
        next_num += 1
        student.save(update_fields=["student_id"])


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_teacherprofile_employee_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='student_id',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
        migrations.RunPython(populate_student_ids, migrations.RunPython.noop),
    ]
