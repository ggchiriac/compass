from rest_framework import serializers

from .models import (
    ClassMeeting,
    Course,
    Section,
)


# TODO: It's possible that not all of these fields are needed for non-Calendar searching
class ClassMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassMeeting
        fields = ('start_time', 'end_time', 'days')


class SectionSerializer(serializers.ModelSerializer):
    class_meetings = ClassMeetingSerializer(many=True, read_only=True)
    instructor_name = serializers.CharField(source='instructor.name', read_only=True)

    class Meta:
        model = Section
        fields = (
            'class_number',
            'class_section',
            'instructor_name',
            'capacity',
            'enrollment',
            'class_meetings',
        )


class CourseSerializer(serializers.ModelSerializer):
    # TODO: Look into decoupling this since section info is not really needed for Dashboard
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


# Calendar
class CalendarClassMeetingSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format='%H:%M')
    end_time = serializers.TimeField(format='%H:%M')

    class Meta:
        model = ClassMeeting
        fields = ('start_time', 'end_time', 'days', 'room', 'building_name')


class CalendarSectionSerializer(serializers.ModelSerializer):
    class_meetings = CalendarClassMeetingSerializer(
        source='classmeeting_set', many=True, read_only=True
    )

    class Meta:
        model = Section
        fields = (
            'class_number',
            'class_section',
            'class_type',
            'instructor',
            'class_meetings',
        )
