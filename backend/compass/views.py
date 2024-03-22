import json
import logging
import time
from datetime import datetime, timedelta
from re import IGNORECASE, compile, search, split, sub
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from django.conf import settings
from django.contrib.postgres.search import TrigramSimilarity
from django.core.cache import cache
from django.db.models import Case, Count, IntegerField, Q, Value, When
from django.db.models.functions import Greatest
from django.db.models.query import Prefetch
from django.http import JsonResponse, HttpResponseServerError
from django.middleware.csrf import get_token
from django.shortcuts import redirect
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from thefuzz import fuzz, process  # TODO: Consider adding fuzzy finding to search

from data.check_reqs import (
    check_user,
    fetch_requirement_info,
    get_course_comments,
    get_course_info,
)
from data.configs import Configs
from data.req_lib import ReqLib
from .models import (
    ClassMeeting,
    Course,
    CustomUser,
    Major,
    Minor,
    Section,
    UserCourses,
    models,
)
from .serializers import CourseSerializer, CalendarSectionSerializer


logger = logging.getLogger(__name__)

UNDECLARED = {'code': 'Undeclared', 'name': 'Undeclared'}

# ------------------------------------ PROFILE ----------------------------------------#


def fetch_user_info(net_id):
    configs = Configs()
    req_lib = ReqLib()

    # Fetching the user instance
    user_inst, created = CustomUser.objects.get_or_create(
        net_id=net_id,
        defaults={
            'role': 'student',
            'email': '',
            'first_name': '',
            'last_name': '',
            'class_year': datetime.now().year + 1,
        },
    )

    # Processing major and minors
    major = (
        {'code': user_inst.major.code, 'name': user_inst.major.name}
        if user_inst.major
        else UNDECLARED
    )

    minors = [
        {'code': minor.code, 'name': minor.name} for minor in user_inst.minors.all()
    ]

    # Initialize profile with default values
    profile = {
        'universityid': '',
        'mail': '',
        'displayname': '',
        'dn': '',
        'department': None,
    }

    # External API call for additional info only if necessary attributes are missing
    if (
        not user_inst.email
        or not user_inst.first_name
        or not user_inst.last_name
        or not user_inst.class_year
    ):
        student_profile = req_lib.getJSON(f'{configs.USERS_FULL}?uid={net_id}')
        profile.update(student_profile[0])

        # Extracting class year, first name, and last name
        class_year_match = search(r'Class of (\d{4})', profile['dn'])
        class_year = int(class_year_match.group(1)) if class_year_match else None
        full_name = profile['displayname'].split(' ')
        first_name, last_name = full_name[0], ' '.join(full_name[1:])

        # Update user instance with fetched data only if it's missing
        user_inst.email = profile.get('mail', user_inst.email)
        user_inst.first_name = (
            first_name if not user_inst.first_name else user_inst.first_name
        )
        user_inst.last_name = (
            last_name if not user_inst.last_name else user_inst.last_name
        )
        user_inst.class_year = (
            class_year if not user_inst.class_year else user_inst.class_year
        )
        user_inst.save()

    return_data = {
        'netId': net_id,
        'email': user_inst.email,
        'firstName': user_inst.first_name,
        'lastName': user_inst.last_name,
        'classYear': user_inst.class_year,
        'major': major,
        'minors': minors,
    }
    return return_data


def profile(request):
    user_info = fetch_user_info(request.session['net_id'])
    return JsonResponse(user_info)


def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})


def update_profile(request):
    # TODO: Validate this stuff
    data = json.loads(request.body)
    updated_first_name = data.get('firstName', '')
    updated_last_name = data.get('lastName', '')
    updated_major = data.get('major', UNDECLARED).get('code', '')
    updated_minors = data.get('minors', [])
    updated_class_year = data.get('classYear', None)

    # Fetch the user's profile
    net_id = request.session['net_id']
    user_inst = CustomUser.objects.get(net_id=net_id)

    # Update user's profile
    user_inst.username = net_id
    user_inst.first_name = updated_first_name
    user_inst.last_name = updated_last_name

    if updated_major:
        user_inst.major = Major.objects.get(code=updated_major)
    else:
        user_inst.major = Major.objects.get(code=UNDECLARED['code'])

    if isinstance(updated_minors, list):
        # Assuming each minor is represented by its 'code' and you have Minor models
        minor_objects = [
            Minor.objects.get(code=minor.get('code', '')) for minor in updated_minors
        ]
        user_inst.minors.set(minor_objects)

    user_inst.class_year = updated_class_year
    user_inst.save()
    updated_user_info = fetch_user_info(request.session['net_id'])
    return JsonResponse(updated_user_info)


# ------------------------------------ LOG IN -----------------------------------------#


class CAS(View):
    """
    Handles single-sign-on CAS authentication with token-based authentication.

    Attributes:
        cas_url: The CAS server URL.
    """

    def __init__(self):
        self.cas_url = settings.CAS_SERVER_URL

    def _strip_ticket(self, request):
        """
        Strips ticket parameter from the URL.
        """
        url = request.build_absolute_uri()
        return sub(r'\?&?$|&$', '', sub(r'ticket=[^&]*&?', '', url))

    def _validate(self, ticket, service_url):
        """Validates the CAS ticket.

        Args:
            ticket: CAS ticket string.
            service_url: Service URL string.
            timeout: Timeout in seconds.

        Returns:
            str if successful, None otherwise.

        Returns:
            The username if validation is successful, otherwise None.
        """
        # TODO: Consider removing the loggers for production
        try:
            params = {'service': service_url, 'ticket': ticket}
            validation_url = f'{self.cas_url}validate?{urlencode(params)}'
            response = urlopen(validation_url, timeout=5).readlines()
            if len(response) != 2:
                logger.warning(
                    f'Validation Warning: Received {len(response)} lines from CAS, expected 2. URL: {validation_url}'
                )
                return None
            first_line, second_line = map(str.strip, map(bytes.decode, response))
            if first_line.startswith('yes'):
                logger.info(f'Successful validation for ticket: {ticket}')
                return second_line
            else:
                logger.info(
                    f'Failed validation for ticket: {ticket}. Response: {first_line}'
                )
                return None

        except (HTTPError, URLError) as e:
            logger.error(
                f'Network Error during CAS validation: {e}. URL: {validation_url}'
            )
            return None
        except Exception as e:
            logger.error(
                f'Unexpected error during CAS validation: {e}. URL: {validation_url}'
            )
            return None

    def get(self, request, *args, **kwargs):
        action = request.GET.get('action')
        if action == 'login':
            return self.login(request)
        elif action == 'logout':
            return self.logout(request)
        elif action == 'authenticate':
            return self.authenticate(request)
        else:
            return JsonResponse({'error': 'Invalid action'}, status=400)

    def _is_authenticated(self, request):
        """Check if the user is authenticated.

        Returns:
            (bool, str): Tuple of authentication status and username.
        """
        return (net_id := request.session.get('net_id', None)) is not None, net_id

    def authenticate(self, request):
        authenticated, net_id = self._is_authenticated(request)
        if authenticated:
            user_info = fetch_user_info(net_id)
            return JsonResponse({'authenticated': True, 'user': user_info})
        else:
            return JsonResponse({'authenticated': False, 'user': None})

    def login(self, request):
        try:
            logger.info(
                f'Incoming GET request: {request.GET}, Session: {request.session}'
            )
            logger.info(
                f"Received login request from {request.META.get('REMOTE_ADDR')}"
            )

            authenticated, username = self._is_authenticated(request)
            print(f'Authenticated: {authenticated}, username: {username}')
            if authenticated:
                return redirect(settings.DASHBOARD)

            # Extract ticket from CAS response
            ticket = request.GET.get('ticket')
            service_url = self._strip_ticket(request)
            if ticket:
                net_id = self._validate(ticket, service_url)
                logger.debug(f'Validation returned {username}')
                if net_id:
                    user, created = CustomUser.objects.get_or_create(
                        username=net_id, defaults={'net_id': net_id, 'role': 'student'}
                    )
                    if created:
                        user.username = net_id
                        user.set_unusable_password()
                        user.major = Major.objects.get(code=UNDECLARED['code'])
                    user.save()
                    request.session['net_id'] = net_id
                    return redirect(settings.DASHBOARD)
            login_url = f'{self.cas_url}login?service={service_url}'
            return redirect(login_url)
        except Exception as e:
            logger.error(f'Exception in login view: {e}')
            return HttpResponseServerError()

    def logout(self, request):
        """
        Logs out the user and redirects to the landing page.
        """
        logger.info(f'Incoming GET request: {request.GET}, Session: {request.session}')
        logger.info(f"Received logout request from {request.META.get('REMOTE_ADDR')}")
        request.session.flush()
        return redirect(settings.HOMEPAGE)


# ------------------------------- SEARCH COURSES --------------------------------------#

DEPT_NUM_SUFFIX_REGEX = compile(r'^[a-zA-Z]{3}\d{3}[a-zA-Z]$', IGNORECASE)
DEPT_NUM_REGEX = compile(r'^[a-zA-Z]{3}\d{1,4}$', IGNORECASE)
DEPT_ONLY_REGEX = compile(r'^[a-zA-Z]{3}$', IGNORECASE)
NUM_SUFFIX_ONLY_REGEX = compile(r'^\d{3}[a-zA-Z]$', IGNORECASE)
NUM_ONLY_REGEX = compile(r'^\d{3,4}$', IGNORECASE)
GRADING_OPTIONS = {
    'A-F': ['FUL', 'GRD', 'NAU', 'NPD'],
    'P/D/F': ['PDF', 'FUL', 'NAU'],
    'Audit': ['FUL', 'PDF', 'ARC', 'NGR', 'NOT', 'NPD', 'YR'],
}


def make_sort_key(dept):
    def sort_key(course):
        crosslistings = course['crosslistings']
        if len(dept) >= 3:
            start_index = crosslistings.lower().find(dept.lower())
            if start_index != -1:
                return crosslistings[start_index:]
        return crosslistings

    return sort_key


class SearchCourses(View):
    """
    Handles search queries for courses.
    """

    def get(self, request, *args, **kwargs):
        start_time = time.time()
        query = request.GET.get('course', None)
        term = request.GET.get('term', None)
        distribution = request.GET.get('distribution', None)
        levels = request.GET.get('level')
        grading_options = request.GET.get('grading')

        if query:
            # Process queries
            init_time = time.time()
            # process queries
            trimmed_query = sub(r'\s', '', query)
            if DEPT_NUM_SUFFIX_REGEX.match(trimmed_query):
                result = split(r'(\d+[a-zA-Z])', string=trimmed_query, maxsplit=1)
                dept = result[0]
                num = result[1]
                code = dept + ' ' + num
            elif DEPT_NUM_REGEX.match(trimmed_query):
                result = split(r'(\d+)', string=trimmed_query, maxsplit=1)
                dept = result[0]
                num = result[1]
                code = dept + ' ' + num
            elif NUM_ONLY_REGEX.match(trimmed_query) or NUM_SUFFIX_ONLY_REGEX.match(
                trimmed_query
            ):
                dept = ''
                num = trimmed_query
                code = num
            elif DEPT_ONLY_REGEX.match(trimmed_query):
                dept = trimmed_query
                num = ''
                code = dept
            else:
                print(f'Query processing time: {time.time() - start_time:.5f} seconds')
                return JsonResponse({'courses': []})

            query_conditions = Q()

            if term:
                query_conditions &= Q(guid__startswith=term)

            if distribution:
                query_conditions &= Q(distribution_area_short__iexact=distribution)

            if levels:
                levels = levels.split(',')
                level_query = Q()
                for level in levels:
                    level_query |= Q(catalog_number__startswith=level)
                query_conditions &= level_query

            if grading_options:
                grading_options = grading_options.split(',')
                grading_filters = []
                for grading in grading_options:
                    grading_filters += GRADING_OPTIONS[grading]
                print(f'Grading filters: {grading_filters}')
                grading_query = Q()
                for grading in grading_filters:
                    grading_query |= Q(grading_basis__iexact=grading)
                query_conditions &= grading_query

            try:
                filtered_query = query_conditions
                filtered_query &= Q(department__code__iexact=dept)
                filtered_query &= Q(catalog_number__iexact=num)
                exact_match_course = (
                    Course.objects.select_related('department')
                    .filter(filtered_query)
                    .order_by('course_id', '-guid')
                    .distinct()
                )
                if exact_match_course:
                    # If an exact match is found, return only that course
                    serialized_course = CourseSerializer(exact_match_course, many=True)
                    print(
                        f'Total execution time: {time.time() - start_time:.5f} seconds'
                    )
                    print(serialized_course.data)
                    return JsonResponse({'courses': serialized_course.data})
                else:
                    courses_start_time = time.time()
                    courses = (
                        Course.objects.select_related('department')
                        .filter(
                            Q(crosslistings__icontains=code),
                            section__term_id=9,
                        )
                        .distinct()
                    )
                    print(
                        f'Courses query time: {time.time() - courses_start_time:.5f} seconds'
                    )

                    filtered_query = query_conditions
                    filtered_query &= Q(crosslistings__icontains=code)
                    courses = (
                        Course.objects.select_related('department')
                        .filter(filtered_query)
                        .order_by('course_id', '-guid')
                        .distinct()
                    )
                    if courses:
                        sorting_start_time = time.time()
                        custom_sorting_field = Case(
                            When(
                                Q(department__code__icontains=dept)
                                & Q(catalog_number__icontains=num),
                                then=Value(3),
                            ),
                            When(Q(department__code__icontains=dept), then=Value(2)),
                            When(Q(catalog_number__icontains=num), then=Value(1)),
                            default=Value(0),
                            output_field=models.IntegerField(),
                        )
                        sorted_courses = courses.annotate(
                            custom_sorting=custom_sorting_field
                        ).order_by(
                            '-custom_sorting',
                            'department__code',
                            'catalog_number',
                            'title',
                        )
                        print(
                            f'Sorting time: {time.time() - sorting_start_time:.5f} seconds'
                        )

                        serialization_start_time = time.time()
                        serialized_courses = CourseSerializer(sorted_courses, many=True)
                        print(
                            f'Serialization time: {time.time() - serialization_start_time:.5f} seconds'
                        )
                        print(
                            f'Total execution time: {time.time() - start_time:.5f} seconds'
                        )
                        return JsonResponse({'courses': serialized_courses.data})

                print(f'Total execution time: {time.time() - start_time:.5f} seconds')
                return JsonResponse({'courses': []})
            except Exception as e:
                logger.error(f'An error occurred while searching for courses: {e}')
                print(f'Total execution time: {time.time() - start_time:.5f} seconds')
                return JsonResponse({'error': 'Internal Server Error'}, status=500)
        else:
            print(f'Total execution time: {time.time() - start_time:.5f} seconds')
            return JsonResponse({'courses': []})


class GetUserCourses(View):
    """
    Retrieves user's courses for frontend
    """

    def get(self, request, *args, **kwargs):
        net_id = request.session['net_id']
        user_inst = CustomUser.objects.get(net_id=net_id)
        user_course_dict = {}

        if net_id:
            try:
                for semester in range(1, 9):
                    user_courses = Course.objects.filter(
                        usercourses__user=user_inst, usercourses__semester=semester
                    )
                    serialized_courses = CourseSerializer(user_courses, many=True)
                    user_course_dict[semester] = serialized_courses.data

                return JsonResponse(user_course_dict)

            except Exception as e:
                logger.error(f'An error occurred while retrieving courses: {e}')
                return JsonResponse({'error': 'Internal Server Error'}, status=500)
        else:
            return JsonResponse({})


# ---------------------------- UPDATE USER COURSES -----------------------------------#


def parse_semester(semester_id, class_year):
    season = semester_id.split(' ')[0]
    year = int(semester_id.split(' ')[1])
    is_Fall = 1 if (season == 'Fall') else 0
    semester_num = 8 - ((class_year - year) * 2 - is_Fall)

    return semester_num


# This needs to be changed.
def get_first_course_inst(course_code):
    department_code, catalog_number = course_code.split(' ')
    course_inst = (
        Course.objects.select_related('department')
        .filter(department__code=department_code, catalog_number=catalog_number)
        .first()
    )
    return course_inst


def update_courses(request):
    try:
        data = json.loads(request.body)
        course_id = data.get('courseId')  # might have to adjust this, print
        container = data.get('semesterId')
        net_id = request.session['net_id']
        user_inst = CustomUser.objects.get(net_id=net_id)
        class_year = user_inst.class_year
        course_inst = (
            Course.objects.select_related('department')
            .filter(Q(course_id__iexact=course_id))
            .order_by('-guid')[0]
        )

        if container == 'Search Results':
            user_course = UserCourses.objects.get(
                user=user_inst, course__course_id=course_id
            )
            user_course.delete()
            message = f'User course deleted: {course_id}, {net_id}'

        else:
            semester = parse_semester(container, class_year)

            user_course, created = UserCourses.objects.update_or_create(
                user=user_inst, course=course_inst, defaults={'semester': semester}
            )
            if created:
                message = f'User course added: {semester}, {course_id}, {net_id}'
            else:
                message = f'User course updated: {semester}, {course_id}, {net_id}'

        return JsonResponse({'status': 'success', 'message': message})

    except Exception as e:
        # Log the detailed error internally
        logger.error(f'An internal error occurred: {e}', exc_info=True)

        # Return a generic error message to the user
        return JsonResponse(
            {'status': 'error', 'message': 'An internal error has occurred!'}
        )


def update_user(request):
    try:
        class_year = int(request.body)

        if (class_year > 2030) or (class_year < 2023):
            raise ValueError('Class year out of range')

        net_id = request.user.net_id
        user_inst = CustomUser.objects.get(net_id=net_id)
        user_inst.class_year = class_year
        user_inst.save()

        return JsonResponse(
            {'status': 'success', 'message': 'Class year updated successfully.'}
        )

    except Exception as e:
        # Log the detailed error internally
        logger.error(f'An internal error occurred: {e}', exc_info=True)

        # Return a generic error message to the user
        return JsonResponse(
            {'status': 'error', 'message': 'An internal error has occurred!'}
        )


# ----------------------------- CHECK REQUIREMENTS -----------------------------------#


def transform_requirements(requirements):
    # Base case: If there's no 'subrequirements', return the requirements as is
    if 'subrequirements' not in requirements:
        return requirements

    # Recursively transform each subrequirement
    transformed = {}
    for key, subreq in requirements['subrequirements'].items():
        transformed[key] = transform_requirements(subreq)

    # After transformation, remove 'subrequirements' key
    requirements.pop('subrequirements')

    # Merge the 'satisfied' status and the transformed subrequirements
    return {**requirements, **transformed}


def transform_data(data):
    transformed_data = {}

    # Go through each major/minor and transform accordingly
    for _, value in data.items():
        if 'requirements' in value:
            # Extract 'code' and 'satisfied' from 'requirements'
            code = value['requirements'].pop('code')
            satisfied = value['requirements'].pop('satisfied')

            # Transform the rest of the requirements
            transformed_reqs = transform_requirements(value['requirements'])

            # Combine 'satisfied' status and transformed requirements
            transformed_data[code] = {'satisfied': satisfied, **transformed_reqs}

    return transformed_data


# -------------------------------------- GET COURSE DETAILS --------------------------


def course_details(request):
    dept = request.GET.get('dept', '')  # Default to empty string if not provided
    num = request.GET.get('coursenum', '')

    if dept and num:
        try:
            num = str(num)  # Convert to string
        except ValueError:
            return JsonResponse({'error': 'Invalid course number'}, status=400)

        course_info = get_course_info(dept, num)
        return JsonResponse(course_info)
    else:
        return JsonResponse({'error': 'Missing parameters'}, status=400)


# -------------------------------------- GET COURSE DETAILS --------------------------


def course_comments(request):
    dept = request.GET.get('dept', '')  # Default to empty string if not provided
    num = request.GET.get('coursenum', '')

    if dept and num:
        try:
            num = str(num)  # Convert to string
        except ValueError:
            return JsonResponse({'error': 'Invalid course number'}, status=400)

        course_comments = get_course_comments(dept, num)
        return JsonResponse(course_comments)
    else:
        return JsonResponse({'error': 'Missing parameters'}, status=400)


# ------------------------------------------------------------------------------------


def manually_settle(request):
    data = json.loads(request.body)
    course_id = int(data.get('courseId'))
    req_id = int(data.get('reqId'))
    net_id = request.session['net_id']
    user_inst = CustomUser.objects.get(net_id=net_id)

    user_course_inst = UserCourses.objects.get(
        user_id=user_inst.id, course_id=course_id
    )
    if user_course_inst.requirement_id is None:
        user_course_inst.requirement_id = req_id
        user_course_inst.save()

        return JsonResponse({'Manually settled': user_course_inst.id})

    else:
        user_course_inst.requirement_id = None
        user_course_inst.save()

        return JsonResponse({'Unsettled': user_course_inst.id})


def check_requirements(request):
    user_info = fetch_user_info(request.session['net_id'])

    this_major = user_info['major']['code']
    these_minors = [minor['code'] for minor in user_info['minors']]

    req_dict = check_user(user_info['netId'], user_info['major'], user_info['minors'])

    # Rewrite req_dict so that it is stratified by requirements being met
    formatted_dict = {}
    formatted_dict[this_major] = req_dict[this_major]
    for minor in these_minors:
        formatted_dict[minor] = req_dict['Minors'][minor]
    formatted_dict = transform_data(formatted_dict)

    def pretty_print(data, indent=0):
        for key, value in data.items():
            print('  ' * indent + str(key))
            if isinstance(value, dict):
                pretty_print(value, indent + 1)
            else:
                print('  ' * (indent + 1) + str(value))

    # pretty_print(formatted_dict, 2)

    return JsonResponse(formatted_dict)


def requirement_info(request):
    info = fetch_requirement_info(request.GET.get('reqId', ''))
    return JsonResponse(info)


# --------------------------------- CALENDAR ---------------------------------------#


# TODO: See if this function can replace redundant parts of the code in this file.
def get_course_details(request, course_id):
    try:
        # Prefetch class meetings for each section
        class_meetings_prefetch = Prefetch(
            'sections__class_meetings', queryset=ClassMeeting.objects.all()
        )
        # Now prefetch sections with their class meetings loaded
        sections_prefetch = Prefetch(
            'sections',
            queryset=Section.objects.prefetch_related(class_meetings_prefetch),
        )
        course = Course.objects.prefetch_related(sections_prefetch).get(pk=course_id)

        serializer = CourseSerializer(course)
        return JsonResponse(serializer.data)
    except Course.DoesNotExist:
        return JsonResponse({'error': 'Course not found'}, status=404)

# TODO: Might delete and just use SearchCourses class instead.
class CalendarSearch(APIView):
    def get(self, request, *args, **kwargs):
        start_time = time.time()
        print('ENDPOINT HIT')

        query = request.GET.get('course', '').strip()
        term = request.GET.get('term', None)
        distribution = request.GET.get('distribution', None)
        levels = request.GET.get('level', None)
        grading_options = request.GET.get('grading', None)

        if not query:
            return Response({'courses': []})

        dept, num = self.process_query(query)
        print(f'Query processing took: {time.time() - start_time:.2f} seconds')

        try:
            courses = (
                Course.objects.select_related('department')
                .prefetch_related(
                    'section_set__classmeeting_set',
                    'section_set__instructor',
                )
                .filter(
                    Q(course_id__icontains=f'{dept}{num}')
                    | Q(title__icontains=query)
                    | Q(department__code__iexact=dept)
                    | Q(catalog_number__iexact=num)
                    | Q(crosslistings__icontains=f'{dept} {num}')
                )
                .distinct()
            )

            # Apply filters
            if term:
                courses = courses.filter(section__term_id=term)

            if distribution:
                courses = courses.filter(distribution_area_short__iexact=distribution)

            if levels:
                levels = levels.split(',')
                level_query = Q()
                for level in levels:
                    level_query |= Q(catalog_number__startswith=level)
                courses = courses.filter(level_query)

            if grading_options:
                grading_options = grading_options.split(',')
                grading_filters = []
                for grading in grading_options:
                    grading_filters += GRADING_OPTIONS.get(grading, [])
                grading_query = Q()
                for grading in grading_filters:
                    grading_query |= Q(grading_basis__iexact=grading)
                courses = courses.filter(grading_query)

            # Apply sorting
            courses = courses.annotate(
                department_match=Case(
                    When(department__code__iexact=dept, then=1),
                    default=0,
                    output_field=IntegerField(),
                ),
                catalog_number_match=Case(
                    When(catalog_number__iexact=num, then=1),
                    default=0,
                    output_field=IntegerField(),
                ),
                search_rank=Count('id'),
            ).order_by(
                '-department_match',
                '-catalog_number_match',
                'department__code',
                'catalog_number',
                'title',
            )

            # Serialize data
            serialized_courses = CourseSerializer(courses, many=True).data

            print(
                f'Total endpoint processing time: {time.time() - start_time:.2f} seconds'
            )
            return Response({'courses': serialized_courses})

        except Exception as e:
            print(f'Error during course search: {e}')
            return Response(
                {'error': 'Internal Server Error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @staticmethod
    def process_query(query):
        dept, num = '', ''
        if ' ' in query:
            parts = query.split(' ', 1)
            dept = parts[0].upper()
            num = parts[1]
        else:
            for char in query:
                if char.isdigit():
                    num += char
                elif char.isalpha():
                    dept += char.upper()
        return dept, num


class FetchCourseClassMeetingsView(APIView):
    def get(self, request, course_id, format=None):
        start_time = time.time()
        print('ENDPOINT HIT: FetchCourseClassMeetingsView')
        try:
            course = Course.objects.filter(course_id=course_id).first()
            if not course:
                print('No course found for given course_id')
                return Response(
                    {'error': 'No course found for given course_id'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            sections = Section.objects.filter(course=course).prefetch_related(
                Prefetch('classmeeting_set', queryset=ClassMeeting.objects.all())
            )

            if not sections.exists():
                print('No sections found for given course_id')
                return Response(
                    {'error': 'No sections found for given course_id'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            db_end_time = time.time()
            print(f'DB query and prefetching took: {db_end_time - start_time:.2f} seconds')

            course_data = {
                'course_id': course.course_id,
                'title': course.title,
                'description': course.description,
                'distribution_area_short': course.distribution_area_short,
                'grading_basis': course.grading_basis,
                'department_code': course.department.code if course.department else None,
                'crosslistings': course.crosslistings,
                'sections': CalendarSectionSerializer(sections, many=True).data
            }

            serialize_end_time = time.time()
            print(f'Serialization took: {serialize_end_time - db_end_time:.2f} seconds')

            total_time = time.time() - start_time
            print(f'Total endpoint processing time: {total_time:.2f} seconds')
            return Response(course_data)

        except Exception as e:
            print(f'Error during class meeting retrieval: {e}')
            return Response(
                {'error': 'Internal Server Error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )