import argparse
import csv
import logging
import os
import sys
import re
from datetime import datetime
from pathlib import Path
from tqdm import tqdm

sys.path.append(str(Path('../').resolve()))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()
from django.db import transaction
from compass.models import (
    Department,
    AcademicTerm,
    Course,
    Section,
    ClassMeeting,
    ClassYearEnrollment,
    Instructor,
)


# -------------------------------------------------------------------------------------#


logging.basicConfig(level=logging.INFO)

CLASS_YEAR_ENROLLMENT_PATTERN = re.compile(r'Year (\d+): (\d+) students')


def _parse_class_year_enrollments(str, pattern):
    if str == 'Class year demographics unavailable':
        return []
    return pattern.findall(str)


def _format_duration(start_time, end_time):
    elapsed_time = end_time - start_time
    seconds = elapsed_time.total_seconds()

    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    # Building a formatted string
    formatted_duration = []
    if hours:
        formatted_duration.append(f'{int(hours)} hours')
    if minutes:
        formatted_duration.append(f'{int(minutes)} minutes')
    if seconds or not formatted_duration:
        # Rounds seconds to the nearest thousandth
        formatted_duration.append(f'{seconds:.3f} seconds')

    return ', '.join(formatted_duration)


def _parse_time(time_str):
    try:
        return datetime.strptime(time_str, '%I:%M %p').strftime('%H:%M')
    except ValueError:
        return None


# -------------------------------------------------------------------------------------#


def insert_departments(rows):
    logging.info('Starting Department insertions and updates...')

    # Create a set of unique departments from the input rows
    unique_departments = {(row['Subject Code'], row['Subject Name']) for row in rows}

    # Fetch existing departments into a dictionary for quick access
    existing_departments_dict = {
        dept.code: dept
        for dept in Department.objects.filter(
            code__in=[code for code, _ in unique_departments]
        )
    }

    departments_to_create = []
    departments_to_update = []

    for code, name in unique_departments:
        if code in existing_departments_dict:
            # Access the existing department from the dictionary
            department = existing_departments_dict[code]
            if department.name != name:
                department.name = name
                departments_to_update.append(department)
        else:
            # Prepare a new Department instance for bulk creation
            departments_to_create.append(Department(code=code, name=name))

    try:
        with transaction.atomic():
            if departments_to_create:
                Department.objects.bulk_create(departments_to_create)
            if departments_to_update:
                Department.objects.bulk_update(departments_to_update, ['name'])
    except Exception as e:
        logging.error(f'Error in inserting departments: {e}')

    logging.info(
        f'Inserted {len(departments_to_create)} new departments and updated {len(departments_to_update)} departments.'
    )
    logging.info('Department insertions and updates completed!')


# -------------------------------------------------------------------------------------#


def insert_academic_terms(rows):
    logging.info('Starting AcademicTerm insertions and updates...')

    def parse_date(date_str):
        return datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None

    first_row = rows[0]

    term_code = first_row['Term Code'].strip()
    suffix = first_row['Term Name']
    start_date = parse_date(first_row.get('Course Start Date'))
    end_date = parse_date(first_row.get('Course End Date'))

    try:
        with transaction.atomic():
            term, created = AcademicTerm.objects.update_or_create(
                term_code=term_code,
                defaults={
                    'suffix': suffix,
                    'start_date': start_date,
                    'end_date': end_date,
                },
            )
        if created:
            logging.info('Inserted 1 new academic term.')
        else:
            logging.info('Updated 1 academic term.')
    except Exception as e:
        logging.error(f'Error in inserting academic terms: {e}')

    logging.info('AcademicTerm insertions completed!')


# -------------------------------------------------------------------------------------#


def insert_courses(rows):
    logging.info('Starting Course insertions and updates...')

    departments = {dept.code: dept for dept in Department.objects.all()}
    existing_courses = {course.guid: course for course in Course.objects.all()}
    new_courses = []
    updated_courses = []

    for row in tqdm(rows, desc='Processing Courses'):
        guid = row.get('Course GUID')
        dept_code = row['Subject Code']
        department = departments.get(dept_code)

        if not guid:
            logging.warning(f'Course GUID not found for row: {row}')
            continue

        if not department:
            logging.warning(f'Department with code {dept_code} not found!')
            continue

        crosslistings = row.get('Crosslistings')
        if crosslistings is None:
            crosslistings = f"{row['Subject Code']} {row['Catalog Number']}"

        # Handle CHI1001, FRE1027, GER1025...
        crosslistings = re.sub(r'([a-zA-Z])([0-9])', r'\1 \2', crosslistings)

        reading_list_entries = [
            f"{row[f'Reading List Title {i}']}//{row[f'Reading List Author {i}']}"
            for i in range(1, 7)
            if row.get(f'Reading List Author {i}')
            and row.get(f'Reading List Title {i}')
        ]
        reading_list = ';'.join(reading_list_entries)

        defaults = {
            'course_id': row['Course ID'],
            'department': department,
            'title': row['Course Title'],
            'catalog_number': row['Catalog Number'],
            'description': row.get('Course Description'),
            'drop_consent': row.get('Drop Consent'),
            'add_consent': row.get('Add Consent'),
            'web_address': row.get('Web Address'),
            'transcript_title': row.get('Transcript Title'),
            'long_title': row.get('Long Title'),
            'distribution_area_long': row.get('Distribution Area Long'),
            'distribution_area_short': row.get('Distribution Area Short'),
            'reading_writing_assignment': row.get('Reading Writing Assignment'),
            'grading_basis': row.get('Grading Basis'),
            'reading_list': reading_list,
            'crosslistings': crosslistings,
        }

        course = existing_courses.get(guid)
        if course:
            # Update existing course
            update_required = False
            for key, value in defaults.items():
                if getattr(course, key) != value:
                    setattr(course, key, value)
                    update_required = True
            if update_required:
                updated_courses.append(course)
        else:
            # Create new course instance
            new_course = Course(guid=guid, **defaults)
            new_courses.append(new_course)
            existing_courses[
                guid
            ] = new_course  # Update the local cache with the new course

    update_fields = [field.name for field in Course._meta.fields if field.name != 'id']

    try:
        with transaction.atomic():
            if new_courses:
                Course.objects.bulk_create(new_courses)
                logging.info(f'Inserted {len(new_courses)} new courses.')
            if updated_courses:
                Course.objects.bulk_update(updated_courses, update_fields)
                logging.info(f'Updated {len(updated_courses)} existing courses.')
    except Exception as e:
        logging.error(f'Error in inserting/updating courses: {e}')
    else:
        logging.info('Course insertions and updates completed!')


# -------------------------------------------------------------------------------------#


def insert_instructors(rows):
    logging.info('Starting instructor insertions and updates...')

    update_fields = ['first_name', 'last_name', 'full_name']
    new_instructors = []
    updated_instructors = []

    # Pre-fetch existing instructors to reduce duplicate checks during processing
    existing_instructors = {
        instructor.emplid: instructor for instructor in Instructor.objects.all()
    }

    for row in tqdm(rows, desc='Processing Instructors...'):
        instructor_emplid = row.get('Instructor EmplID', '').strip()
        if not instructor_emplid:
            logging.warning('Skipping row with missing Instructor EmplID')
            continue

        first_name = row.get('Instructor First Name', '').strip()
        last_name = row.get('Instructor Last Name', '').strip()
        full_name = row.get('Instructor Full Name', f'{first_name} {last_name}').strip()

        instructor = existing_instructors.get(instructor_emplid)
        if instructor:
            # Update existing instructor if there are changes
            changed = any(
                [
                    getattr(instructor, field) != locals()[field]
                    for field in update_fields
                ]
            )
            if changed:
                for field in update_fields:
                    setattr(instructor, field, locals()[field])
                updated_instructors.append(instructor)
        else:
            # Prepare new instructor for bulk creation
            new_instructors.append(
                Instructor(
                    emplid=instructor_emplid,
                    first_name=first_name,
                    last_name=last_name,
                    full_name=full_name,
                )
            )

    try:
        with transaction.atomic():
            # Bulk create new instructors
            if new_instructors:
                Instructor.objects.bulk_create(new_instructors)
                logging.info(f'Created {len(new_instructors)} new instructors.')

            # Bulk update existing instructors
            if updated_instructors:
                Instructor.objects.bulk_update(updated_instructors, update_fields)
                logging.info(
                    f'Updated {len(updated_instructors)} existing instructors.'
                )

    except Exception as e:
        logging.error(f'Error in processing instructors: {e}')
    else:
        logging.info('Instructor processing completed!')

    return existing_instructors


# -------------------------------------------------------------------------------------#


def insert_sections(rows):
    logging.info('Starting Section insertions and updates...')

    # Initial cache of term and course guids to minimize database queries.
    term_cache = {term.term_code: term for term in AcademicTerm.objects.all()}
    course_cache = {course.guid: course for course in Course.objects.all()}
    instructor_cache = insert_instructors(rows)

    # Load existing sections to avoid duplicates and facilitate updates
    existing_sections = {
        (section.course.guid, section.class_number): section
        for section in Section.objects.select_related('course', 'term').all()
    }

    new_sections = []
    updated_sections = []

    for row in tqdm(rows, desc='Processing Sections...'):
        try:
            class_number = int(row['Class Number'].strip())
        except ValueError:
            logging.error(f"Invalid class number: {row['Class Number']}")
            continue

        term = term_cache.get(row['Term Code'].strip())
        course = course_cache.get(row['Course GUID'].strip())
        instructor_emplid = row.get('Instructor EmplID', '').strip()
        instructor = instructor_cache.get(instructor_emplid)

        if not term:
            logging.warning(f'Term not found for row: {row}')
            continue
        if not course:
            logging.warning(f'Course not found for row: {row}')
            continue
        if not instructor:
            logging.warning(f'Instructor not found for row: {row}')
            continue

        section_key = (course.guid, term.id, class_number)
        section_data = {
            'class_number': class_number,
            'class_type': row.get('Class Type', ''),
            'class_section': row.get('Class Section', ''),
            'track': row.get('Course Track', '').strip(),
            'seat_reservations': row.get('Has Seat Reservations', '').strip(),
            'capacity': int(row.get('Class Capacity', 0)),
            'status': row.get('Class Status', ''),
            'enrollment': int(row.get('Class Enrollment', 0)),
            'course_id': course.id,
            'term_id': term.id,
            'instructor': instructor,
        }

        section = existing_sections.get(section_key)
        if section:
            # Update existing section
            for key, value in section_data.items():
                setattr(section, key, value)
            updated_sections.append(section)
        else:
            # Create new section
            section = Section(**section_data)
            new_sections.append(section)

    update_fields = [field.name for field in Section._meta.fields if field.name != 'id']

    try:
        with transaction.atomic():
            # Bulk create new sections
            Section.objects.bulk_create(new_sections)
            # Bulk update existing sections
            if updated_sections:
                Section.objects.bulk_update(updated_sections, fields=update_fields)
    except Exception as e:
        logging.error(f'Error in section insertion and update process: {e}')
    else:
        logging.info(
            f'Inserted {len(new_sections)} new sections and updated {len(updated_sections)} sections.'
        )
        logging.info('Section processing completed!')


# -------------------------------------------------------------------------------------#


def insert_class_meetings(rows):
    logging.info('Starting ClassMeeting insertions and updates...')

    section_cache = {
        (section.course.guid, section.term_id, section.class_number): section
        for section in Section.objects.select_related('course', 'term').all()
    }

    # Collect relevant section IDs
    relevant_section_ids = set()
    for row in tqdm(rows, desc='Checking for updates in Class Meetings...'):
        course_guid = row['Course GUID'].strip()
        term_code = int(course_guid[:4])
        class_number = int(row['Class Number'].strip())
        section_key = (course_guid, term_code, class_number)
        if section_key in section_cache:
            relevant_section_ids.add(section_cache[section_key].id)

    # Fetch only relevant ClassMeeting objects
    existing_meetings = {
        (
            meeting.section_id,
            meeting.meeting_number,
            meeting.room,
            meeting.start_time,
            meeting.end_time,
        ): meeting
        for meeting in ClassMeeting.objects.filter(section_id__in=relevant_section_ids)
    }

    new_meetings = []
    updated_meetings = []

    for row in tqdm(rows, desc='Processing Class Meetings...'):
        course_guid = row['Course GUID'].strip()
        term_code = int(course_guid[:4])
        class_number = int(row['Class Number'].strip())
        meeting_number = int(row['Meeting Number'].strip())

        section_key = (course_guid, term_code, class_number)
        section = section_cache.get(section_key)

        if section is None:
            # Class is (likely) canceled and has no sections.
            continue

        start_time = _parse_time(row.get('Meeting Start Time', ''))
        end_time = _parse_time(row.get('Meeting End Time', ''))

        if not start_time or not end_time:
            logging.error(
                f'Invalid meeting time format for Class {class_number} in Term {term_code}'
            )
            continue

        meeting_key = (section.id, meeting_number, course_guid)
        if meeting_key in existing_meetings:
            # Update existing class meeting
            meeting = existing_meetings[meeting_key]
            meeting.start_time = start_time
            meeting.end_time = end_time
            meeting.room = row.get('Meeting Room', '').strip()
            meeting.days = row.get('Meeting Days', '').strip()
            meeting.building_name = row.get('Building Name', '').strip()
            updated_meetings.append(meeting)
        else:
            # Create new class meeting
            new_meeting = ClassMeeting(
                section=section,
                meeting_number=meeting_number,
                start_time=start_time,
                end_time=end_time,
                room=row.get('Meeting Room', '').strip(),
                days=row.get('Meeting Days', '').strip(),
                building_name=row.get('Building Name', '').strip(),
            )
            new_meetings.append(new_meeting)

    update_fields = [
        'meeting number',
        'start_time',
        'end_time',
        'room',
        'days',
        'building_name',
    ]

    try:
        with transaction.atomic():
            ClassMeeting.objects.bulk_create(new_meetings)
            ClassMeeting.objects.bulk_update(updated_meetings, update_fields)
    except Exception as e:
        logging.error(f'Error in bulk operation: {e}')
    else:
        logging.info(
            f'Created {len(new_meetings)} new class meetings and updated {len(updated_meetings)} existing ones.'
        )

    logging.info('ClassMeeting insertions and updates completed!')


# -------------------------------------------------------------------------------------#


def insert_class_year_enrollments(rows):
    logging.info('Starting ClassYearEnrollment insertions and updates...')

    # Initial cache of Section IDs to minimize database queries.
    section_cache = {
        (section.course.guid, section.term_id, section.class_number): section.id
        for section in Section.objects.select_related('course', 'term').all()
    }

    relevant_section_ids = set()
    enrollment_data = {}

    for row in tqdm(rows, desc='Checking for updates in Class Year Enrollments...'):
        course_guid = row['Course GUID'].strip()
        term_code = int(course_guid[:4])
        class_number = int(row['Class Number'].strip())
        section_key = (course_guid, term_code, class_number)
        section_id = section_cache.get(section_key)

        if section_id:
            relevant_section_ids.add(section_id)
            enrollment_info = _parse_class_year_enrollments(
                row['Class Year Enrollments'], CLASS_YEAR_ENROLLMENT_PATTERN
            )
            for class_year, enrl_seats in enrollment_info:
                try:
                    class_year = int(class_year) if class_year else None
                except ValueError:
                    logging.error(f'Invalid class year: {class_year}')
                    continue
                key = (section_id, class_year)
                enrollment_data[key] = int(enrl_seats)
        else:
            logging.warning(
                f'Section not found for Course GUID: {course_guid}, Term Code: {term_code}, Class Number: {class_number}'
            )

    # Fetch and update existing enrollments, or create new ones as needed.
    existing_enrollments = {
        (enrollment.section_id, enrollment.class_year): enrollment
        for enrollment in ClassYearEnrollment.objects.filter(
            section_id__in=relevant_section_ids
        )
    }

    new_enrollments = []
    updated_enrollments = []

    for key, enrl_seats in enrollment_data.items():
        if key in existing_enrollments:
            enrollment = existing_enrollments[key]
            if enrollment.enrl_seats != enrl_seats:
                enrollment.enrl_seats = enrl_seats
                updated_enrollments.append(enrollment)
        else:
            new_enrollment = ClassYearEnrollment(
                section_id=key[0], class_year=key[1], enrl_seats=enrl_seats
            )
            new_enrollments.append(new_enrollment)

    try:
        with transaction.atomic():
            ClassYearEnrollment.objects.bulk_create(new_enrollments)
            if updated_enrollments:
                ClassYearEnrollment.objects.bulk_update(
                    updated_enrollments, ['enrl_seats']
                )
    except Exception as e:
        logging.error(f'Error in bulk operation: {e}')
    else:
        logging.info(
            f'Created {len(new_enrollments)} new class year enrollments and updated {len(updated_enrollments)} existing ones.'
        )
        logging.info('ClassYearEnrollment insertions and updates completed!')


# -------------------------------------------------------------------------------------#


def get_semesters_from_args():
    parser = argparse.ArgumentParser(
        description='Fetch academic course data for specified semesters.'
    )
    parser.add_argument(
        'semesters',
        nargs='*',
        help='Semesters to generate CSVs for, e.g., f2019 s2022.',
    )
    args = parser.parse_args()

    if not args.semesters:
        print(
            'No semesters provided as arguments. Please enter the semesters separated by spaces:'
        )
        args.semesters = input().strip().split(' ')

    return args.semesters


# -------------------------------------------------------------------------------------#


def insert_course_data(semester):
    data = Path(f'{semester}.csv')

    if not data.exists():
        print(f'The file {data} does not exist in the data directory. Skipping.')
        return

    with data.open('r') as file:
        reader = csv.DictReader(file)
        rows = [row for row in reader]

    formatted_rows = [
        {key.strip(): value.strip() for key, value in row.items()} for row in rows
    ]

    try:
        with transaction.atomic():
<<<<<<< HEAD
            insert_departments(trimmed_rows)
            insert_academic_terms(trimmed_rows)
            insert_courses(trimmed_rows)
            # insert_course_equivalents(trimmed_rows) # TODO: Can probably delete this fn
            # insert_sections(trimmed_rows)
            # insert_class_meetings(trimmed_rows)
            # insert_class_year_enrollments(trimmed_rows)
=======
            # with transaction.atomic():
            #     insert_departments(formatted_rows)
>>>>>>> chkpt

            # with transaction.atomic():
            #     insert_academic_terms(formatted_rows)

            # with transaction.atomic():
            #     insert_courses(formatted_rows)

            with transaction.atomic():
                insert_sections(formatted_rows)

            # with transaction.atomic():
            #     insert_class_meetings(formatted_rows)

            # with transaction.atomic():
            #     insert_class_year_enrollments(formatted_rows)

            # with transaction.atomic():
            #     insert_instructors(formatted_rows)
    except Exception as e:
        logging.error(f'Transaction failed: {e}')


# -------------------------------------------------------------------------------------#


def main():
    start_time = datetime.now()
    semesters = get_semesters_from_args()
    for semester in semesters:
        insert_course_data(semester)
    end_time = datetime.now()

    print(f'Finished in {_format_duration(start_time, end_time)}.')


# -------------------------------------------------------------------------------------#


if __name__ == '__main__':
    main()
