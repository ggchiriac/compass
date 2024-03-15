from rest_framework import serializers

from .models import (
    ClassMeeting,
    Course,
    Section,
)
import time


# TODO: It's possible that not all of these fields are needed for non-Calendar searching
class ClassMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassMeeting
        fields = (
            'meeting_number',
            'start_time',
            'end_time',
            'room',
            'days',
            'building_name',
        )


class SectionSerializer(serializers.ModelSerializer):
    # Nested ClassMeetingSerializer to include meeting details in the section data
    class_meetings = ClassMeetingSerializer(many=True, read_only=True)
    instructor_name = serializers.CharField(source='instructor.name', read_only=True)

    class Meta:
        model = Section
        fields = (
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
        )


class CourseSerializer(serializers.ModelSerializer):
    # Nested SectionSerializer to include section details in the course data
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
class NewClassMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassMeeting
        fields = ('start_time', 'end_time', 'days')


class NewSectionSerializer(serializers.ModelSerializer):
    class_meetings = NewClassMeetingSerializer(source='classmeeting_set', many=True, read_only=True)

    class Meta:
        model = Section
        fields = ('class_number', 'class_section', 'class_meetings')
