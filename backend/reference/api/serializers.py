from rest_framework import serializers


class AcademicYearSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    year = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()


class AssignmentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    academic_year = serializers.CharField()
    class_offering = serializers.DictField()
    subject = serializers.DictField()
