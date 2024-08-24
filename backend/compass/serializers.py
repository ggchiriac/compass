from rest_framework import serializers
from .models import (
    Course,
    Section,
    ClassMeeting,
    CalendarConfiguration,
    ScheduleSelection,
    SemesterConfiguration,
)


class ClassMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassMeeting
        fields = (
            'id',
            'meeting_number',
            'start_time',
            'end_time',
            'room',
            'days',
            'building_name',
        )


class SectionSerializer(serializers.ModelSerializer):
    class_meetings = ClassMeetingSerializer(many=True, source='classmeeting_set')
    instructor_name = serializers.CharField(
        source='instructor.full_name', read_only=True
    )
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_id = serializers.CharField(source='course.course_id', read_only=True)

    class Meta:
        model = Section
        fields = (
            'id',
            'class_number',
            'class_type',
            'class_section',
            'track',
            'seat_reservations',
            'instructor_name',
            'capacity',
            'status',
            'enrollment',
            'class_meetings',
            'course_title',
            'course_id',
        )


class CourseSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)

    class Meta:
        model = Course
        fields = (
            'guid',
            'course_id',
            'catalog_number',
            'title',
            'description',
            'drop_consent',
            'add_consent',
            'web_address',
            'transcript_title',
            'long_title',
            'distribution_area_long',
            'distribution_area_short',
            'reading_writing_assignment',
            'grading_basis',
            'reading_list',
            'department_code',
            'sections',
            'crosslistings',
        )


class ScheduleSelectionSerializer(serializers.ModelSerializer):
    section = SectionSerializer(read_only=True)

    class Meta:
        model = ScheduleSelection
        fields = ['id', 'section', 'index', 'name', 'is_active']


class SemesterConfigurationSerializer(serializers.ModelSerializer):
    schedule_selections = ScheduleSelectionSerializer(many=True, read_only=True)

    class Meta:
        model = SemesterConfiguration
        fields = ['id', 'term', 'schedule_selections']


class CalendarConfigurationSerializer(serializers.ModelSerializer):
    semester_configurations = SemesterConfigurationSerializer(many=True, read_only=True)

    class Meta:
        model = CalendarConfiguration
        fields = ['id', 'user', 'name', 'semester_configurations']
        read_only_fields = ['id', 'user']
