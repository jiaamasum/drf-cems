from rest_framework import serializers

from academics.models import Assignment, Exam, Mark


class ClassOfferingSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    level = serializers.CharField(required=False, allow_null=True)


class SubjectSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField(required=False, allow_null=True)


class StudentProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    full_name = serializers.CharField(allow_blank=True)
    student_id = serializers.CharField()
    username = serializers.CharField()


class EnrollmentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    academic_year = serializers.CharField()
    class_offering = ClassOfferingSerializer()
    roll_number = serializers.IntegerField(allow_null=True, required=False)
    student_id = serializers.CharField(allow_null=True)
    grade = serializers.CharField(allow_null=True, required=False)


class UpcomingExamSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    subject = serializers.CharField()
    date = serializers.DateField()
    max_marks = serializers.IntegerField()


class StudentMarkSerializer(serializers.Serializer):
    exam = serializers.DictField()
    subject = serializers.CharField()
    date = serializers.DateField()
    marks_obtained = serializers.IntegerField()
    max_marks = serializers.IntegerField()
    highest_mark = serializers.IntegerField(required=False, allow_null=True)
    lowest_mark = serializers.IntegerField(required=False, allow_null=True)


class StudentDashboardMarkSerializer(serializers.Serializer):
    exam_id = serializers.IntegerField()
    exam_title = serializers.CharField()
    subject = serializers.CharField()
    date = serializers.DateField()
    marks_obtained = serializers.IntegerField()
    max_marks = serializers.IntegerField()
    highest_mark = serializers.IntegerField(required=False, allow_null=True)
    lowest_mark = serializers.IntegerField(required=False, allow_null=True)


class StudentHistorySubjectSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField(allow_null=True, required=False)
    percent = serializers.FloatField(allow_null=True, required=False)
    grade = serializers.CharField(allow_null=True, required=False)


class StudentHistoryEntrySerializer(serializers.Serializer):
    academic_year = serializers.CharField()
    class_name = serializers.CharField()
    roll_number = serializers.IntegerField(allow_null=True)
    total_exams = serializers.IntegerField(allow_null=True)
    overall_percent = serializers.FloatField(allow_null=True)
    overall_grade = serializers.CharField(allow_null=True)
    subjects = StudentHistorySubjectSerializer(many=True)


class PaginatedUpcomingSerializer(serializers.Serializer):
    count = serializers.IntegerField(required=False)
    next = serializers.CharField(allow_null=True, required=False)
    previous = serializers.CharField(allow_null=True, required=False)
    results = UpcomingExamSerializer(many=True)


class PaginatedMarksSerializer(serializers.Serializer):
    count = serializers.IntegerField(required=False)
    next = serializers.CharField(allow_null=True, required=False)
    previous = serializers.CharField(allow_null=True, required=False)
    results = StudentDashboardMarkSerializer(many=True)


class PaginatedHistorySerializer(serializers.Serializer):
    count = serializers.IntegerField(required=False)
    next = serializers.CharField(allow_null=True, required=False)
    previous = serializers.CharField(allow_null=True, required=False)
    results = StudentHistoryEntrySerializer(many=True)


class StudentDashboardSerializer(serializers.Serializer):
    profile = StudentProfileSerializer()
    enrollment = EnrollmentSerializer(allow_null=True)
    subjects = serializers.ListField(child=serializers.DictField())
    upcoming_exams = PaginatedUpcomingSerializer()
    marks = PaginatedMarksSerializer()
    current_grade = serializers.CharField(allow_null=True)
    history = PaginatedHistorySerializer()


class TeacherProfileSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    full_name = serializers.CharField(allow_blank=True)
    employee_code = serializers.CharField()
    username = serializers.CharField()


class AssignmentSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    academic_year = serializers.CharField()
    class_offering = ClassOfferingSerializer()
    subject = SubjectSerializer()
    student_count = serializers.IntegerField()


class ExamSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    date = serializers.DateField()
    status = serializers.CharField(required=False)


class TeacherDashboardSerializer(serializers.Serializer):
    teacher_profile = TeacherProfileSerializer()
    assignments = AssignmentSummarySerializer(many=True)
    current_exams = ExamSummarySerializer(many=True)
    past_exams = ExamSummarySerializer(many=True)
    subject_count = serializers.IntegerField()
    current_year = serializers.DictField(allow_null=True)


class TeacherExamListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    date = serializers.DateField()
    max_marks = serializers.IntegerField()
    status = serializers.CharField()
    class_field = serializers.CharField(source="assignment.class_offering.name")
    subject = serializers.CharField(source="assignment.subject.name")
    academic_year = serializers.CharField(source="academic_year.year")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["class"] = data.pop("class_field", None)
        return data


class TeacherPastClassSerializer(serializers.Serializer):
    class_offering_id = serializers.IntegerField()
    class_name = serializers.CharField()
    academic_year = serializers.CharField()
    exam_count = serializers.IntegerField()


class TeacherClassExamSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    date = serializers.DateField()
    status = serializers.CharField()
    subject = serializers.CharField()
    max_marks = serializers.IntegerField()
    academic_year = serializers.CharField()


class ExamCreateSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    title = serializers.CharField()
    date = serializers.DateField()
    max_marks = serializers.IntegerField(default=100)
    status = serializers.ChoiceField(choices=Exam.STATUS_CHOICES, default=Exam.STATUS_PUBLISHED)

    def validate_assignment_id(self, value):
        if not Assignment.objects.filter(id=value).exists():
            raise serializers.ValidationError("Assignment not found")
        return value


class ExamDetailSerializer(serializers.Serializer):
    exam = serializers.DictField()
    allow_edit = serializers.BooleanField()
    read_only = serializers.BooleanField()
    roster = serializers.ListField(child=serializers.DictField())


class MarksEntrySerializer(serializers.Serializer):
    marks = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_marks(self, value):
        for entry in value:
            if "student_enrollment_id" not in entry or "marks_obtained" not in entry:
                raise serializers.ValidationError("Each mark entry requires student_enrollment_id and marks_obtained")
        return value
