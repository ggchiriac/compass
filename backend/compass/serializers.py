from rest_framework import serializers
from .models import (
    Course,
    Section,
    ClassMeeting,
    CalendarConfiguration,
    CalendarSelection,
    CalendarFilter,
)


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


# Calendar (temporary serializer)
class CalendarClassMeetingSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format='%H:%M')
    end_time = serializers.TimeField(format='%H:%M')

    class Meta:
        model = ClassMeeting
        fields = (
            'section_id',
            'meeting_number',
            'start_time',
            'end_time',
            'days',
            'room',
            'building_name',
        )


# May be deprecated due to new serializers below?
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


class CalendarFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarFilter
        fields = ('filter_type', 'filter_value')


class CalendarSelectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarSelection
        fields = ('section', 'is_active')


class CalendarConfigurationSerializer(serializers.ModelSerializer):
    selections = CalendarSelectionSerializer(many=True, read_only=True)
    filters = CalendarFilterSerializer(many=True, required=False)

    class Meta:
        model = CalendarConfiguration
        fields = (
            'id',
            'user',
            'term',
            'name',
            'index',
            'selections',
            'filters',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def create(self, validated_data):
        print('Creating Calendar Configuration with validated data:', validated_data)
        filters_data = validated_data.pop('filters', [])
        configuration = CalendarConfiguration.objects.create(**validated_data)
        for filter_data in filters_data:
            print('Creating filter:', filter_data)
            CalendarFilter.objects.create(configuration=configuration, **filter_data)
        return configuration

    def update(self, instance, validated_data):
        print('Updating Calendar Configuration instance:', instance)
        print('Validated data:', validated_data)
        filters_data = validated_data.pop('filters', [])
        print('Filters data:', filters_data)
        instance = super().update(instance, validated_data)
        instance.filters.all().delete()
        for filter_data in filters_data:
            print('Creating filter:', filter_data)
            CalendarFilter.objects.create(configuration=instance, **filter_data)
        return instance
