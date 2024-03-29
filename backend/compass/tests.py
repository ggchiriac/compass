# Create your tests here.

import sys
from pathlib import Path
import os
from django.db.models import Prefetch

sys.path.append(str(Path('../').resolve()))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()
from django.db import transaction
from compass.models import (
    Department,
    AcademicTerm,
    Course,
    CourseEquivalent,
    Section,
    ClassMeeting,
    ClassYearEnrollment,
    Instructor,
)

course_guid = '1214002053'

sections = (
    Section.objects.filter(course__guid=course_guid)
    .prefetch_related(
        Prefetch(
            'classmeeting_set', queryset=ClassMeeting.objects.order_by('meeting_number')
        )
    )
    .select_related('course')
)

for section in sections:
    print(f'Section ID: {section.id}')
    print(f'Section Name: {section.class_section}')
    print(f'Start Date: {section.term.start_date}')
    print(f'End Date: {section.term.end_date}')
    print('Class Meetings:')
    for class_meeting in section.classmeeting_set.all():
        print(f'  - Meeting ID: {class_meeting.id}')
        print(f'    Meeting Date: {class_meeting.days}')
        print(f'    Start Time: {class_meeting.start_time}')
        print(f'    End Time: {class_meeting.end_time}')
        print(f'    Location: {class_meeting.room}')
    print()
