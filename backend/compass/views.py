import logging
import time
from datetime import datetime
from re import IGNORECASE, compile, search, split, sub
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import urlopen

import ujson as json
from .tests import Logger
from django.conf import settings
from django.core.exceptions import PermissionDenied, ValidationError
from django.contrib.auth import login
from django.views import View
from django.db import IntegrityError, transaction
from django.db.models import Q, Prefetch, QuerySet
from django.http import JsonResponse, HttpRequest, HttpResponseRedirect, HttpResponseServerError
from django.middleware.csrf import get_token
from django.shortcuts import redirect, get_object_or_404
from django.views.decorators.http import require_http_methods
from itertools import groupby
from rest_framework import status
from rest_framework.response import Response  # TODO: Standardize on JsonResponse vs Response
from rest_framework.views import APIView
from typing import Optional

from .models import (
    ClassMeeting,
    Course,
    CustomUser,
    Major,
    Minor,
    Requirement,
    Section,
    UserCourses,
    CalendarConfiguration,
    ScheduleSelection,
    SemesterConfiguration,
)
from .serializers import (
    CourseSerializer,
    CalendarConfigurationSerializer,
    ScheduleSelectionSerializer,
    SectionSerializer,
    SemesterConfigurationSerializer,
)

from data.check_reqs import (
    check_user,
    get_course_comments,
    get_course_info,
    ensure_list,
)
from data.configs.configs import Configs
from data.req_lib import ReqLib

logger = logging.getLogger(__name__)

UNDECLARED = {'code': 'Undeclared', 'name': 'Undeclared'}

# --------------------------------- ERROR HANDLING ------------------------------------#


class UserProfileNotFoundError(Exception):
    """
    Exception raised when the user profile is not found or cannot be updated from an external source.
    """

    def __init__(self, message: str, user_id: str = None):
        super(UserProfileNotFoundError).__init__(message)
        self.user_id = user_id
        self.message = message

    def __str__(self):
        return f'UserProfileNotFoundError: {self.message} for user_id={self.user_id}'


class UserProfileUpdateError(Exception):
    """
    Exception raised for errors that occur when attempting to update the user profile in the database.
    """

    def __init__(self, message: str, user_id: str = None, errors: dict = None):
        super(UserProfileUpdateError).__init__(message)
        self.user_id = user_id
        self.errors = errors
        self.message = message

    def __str__(self):
        error_details = (
            ', '.join(f'{key}: {value}' for key, value in self.errors.items()) if self.errors else 'No details'
        )
        return f'UserProfileUpdateError: {self.message} for user_id={self.user_id}. Errors: {error_details}'


# ------------------------------------ PROFILE ----------------------------------------#


def fetch_user_info(net_id):
    configs = Configs()
    req_lib = ReqLib()

    try:
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
    except IntegrityError as e:
        logger.error(f'Failed to create or retrieve user {net_id}: {e}')
        raise ValidationError(f'Database integrity error for user {net_id}') from e

    major = {'code': user_inst.major.code, 'name': user_inst.major.name} if user_inst.major else 'UNDECLARED'

    minors = [{'code': minor.code, 'name': minor.name} for minor in user_inst.minors.all()]

    try:
        # Check if any of the required attributes are not set
        if not user_inst.email or not user_inst.first_name or not user_inst.last_name or not user_inst.class_year:
            # Fetch the student profile
            student_profile = req_lib.getJSON(f'{configs.USERS_FULL}?uid={net_id}')
            profile = student_profile[0]

            # Extract and update the class year if not already set
            class_year_match = search(r'Class of (\d{4})', profile['dn'])
            class_year = int(class_year_match.group(1)) if class_year_match else None
            user_inst.class_year = class_year if not user_inst.class_year else user_inst.class_year

            # Extract and update the first name and last name if not already set
            full_name = profile['displayname'].split(' ')
            first_name, last_name = full_name[0], ' '.join(full_name[1:])
            user_inst.first_name = first_name if not user_inst.first_name else user_inst.first_name
            user_inst.last_name = last_name if not user_inst.last_name else user_inst.last_name

            # Update the email if not already set
            user_inst.email = profile.get('mail', user_inst.email)

            # Save the updated user instance
            user_inst.save()

        # Prepare the return data structure
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

    except (KeyError, IndexError) as e:
        # Log and raise an error if there is a problem with processing profile data
        logger.error(f'Error processing external profile data for {net_id}: {e}')
        raise UserProfileNotFoundError('Failed to update user profile from external source') from e


def profile(request):
    try:
        user_info = fetch_user_info(request.session['net_id'])
        return JsonResponse(user_info)
    except Exception as e:
        logger.error(f'Error in profile view: {e}')
        return HttpResponseServerError()


def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})


@require_http_methods(['POST'])
def update_profile(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Extract data with default values
    updated_first_name = data.get('firstName', '')
    updated_last_name = data.get('lastName', '')
    updated_major_code = data.get('major', {}).get('code', UNDECLARED['code'])
    updated_minors = data.get('minors', [])
    updated_class_year = data.get('classYear', None)

    # Fetch the user's profile
    net_id = request.session.get('net_id')
    if not net_id:
        return JsonResponse({'error': 'User not logged in'}, status=403)

    try:
        user_inst = CustomUser.objects.get(net_id=net_id)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    with transaction.atomic():
        # Update user's basic information
        user_inst.username = net_id
        user_inst.first_name = updated_first_name
        user_inst.last_name = updated_last_name
        user_inst.class_year = updated_class_year

        # Update major
        try:
            user_inst.major = Major.objects.get(code=updated_major_code)
        except Major.DoesNotExist:
            return JsonResponse({'error': f'Major not found for code: {updated_major_code}'}, status=404)

        # Update minors
        try:
            minor_objects = [Minor.objects.get(code=minor['code']) for minor in updated_minors if 'code' in minor]
        except Minor.DoesNotExist:
            return JsonResponse({'error': 'One or more minors not found'}, status=404)

        user_inst.minors.set(minor_objects)

        # Save the updated user profile
        user_inst.save()

    # Fetch updated user info for response
    updated_user_info = fetch_user_info(net_id)
    return JsonResponse(updated_user_info)


# ----------------------------------- CAS AUTH ---------------------------------------#


class CASAuthBackend:
    """
    CAS authentication backend.

    Attributes:
        cas_url (str): The CAS server URL.
    """

    def __init__(self):
        """
        Initializes the class instance with the CAS URL from the settings.
        """
        self.cas_url = settings.CAS_SERVER_URL

    def _strip_ticket(self, request):
        """
        Strips ticket parameter from the URL.

        Args:
            request (HttpRequest): The incoming request object.

        Returns:
            str: The URL with the ticket parameter stripped.
        """
        url = request.build_absolute_uri()
        return sub(r'\?&?$|&$', '', sub(r'ticket=[^&]*&?', '', url))

    def _validate(self, ticket, service_url):
        """
        Validates the CAS ticket.

        Args:
            ticket (str): CAS ticket string.
            service_url (str): Service URL string.

        Returns:
            str: The authenticated username if successful, None otherwise.
        """
        try:
            params = {'service': service_url, 'ticket': ticket}
            validation_url = f'{self.cas_url}validate?{urlencode(params)}'
            with urlopen(validation_url, timeout=5) as response:
                response_lines = response.readlines()
                if len(response_lines) != 2:
                    logger.warning(
                        f'Validation Warning: Received {len(response_lines)} lines from CAS, expected 2. URL: {validation_url}'
                    )
                    return None
                first_line, second_line = map(str.strip, map(bytes.decode, response_lines))
                if first_line.startswith('yes'):
                    logger.info(f'Successful validation for ticket: {ticket}')
                    return second_line
                else:
                    logger.info(f'Failed validation for ticket: {ticket}. Response: {first_line}')
                    return None
        except (HTTPError, URLError) as e:
            logger.error(f'Network Error during CAS validation: {e}. URL: {validation_url}')
            return None
        except Exception as e:
            logger.error(f'Unexpected error during CAS validation: {e}. URL: {validation_url}')
            return None

    def authenticate(self, request):
        """
        Authenticates the user using CAS.

        Args:
            request (HttpRequest): The incoming request object.

        Returns:
            tuple: (user, None) if successful, (None, None) otherwise.
        """
        logger.debug('CASAuthBackend.authenticate called')
        ticket = request.GET.get('ticket')
        service_url = self._strip_ticket(request)
        logger.debug(f'ticket: {ticket}')
        logger.debug(f'service_url: {service_url}')
        if ticket:
            net_id = self._validate(ticket, service_url)
            logger.debug(f'net_id: {net_id}')
            if net_id:
                user, created = CustomUser.objects.get_or_create(net_id=net_id, defaults={'role': 'student'})
                logger.debug(f'user: {user}')
                logger.debug(f'created: {created}')
                if created:
                    user.username = net_id
                    user.set_unusable_password()
                    user.major = Major.objects.get(code=UNDECLARED['code'])
                    user.save()
                return user, None
        return None, None


class CAS(APIView):
    """
    Handles single-sign-on CAS authentication with token-based authentication.
    """

    def get(self, request):
        """
        Handles GET requests to the CAS endpoint.

        Args:
            request (HttpRequest): The incoming request object.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            JsonResponse or HttpResponse: The appropriate response based on the action parameter.
        """
        action = request.GET.get('action')
        if action == 'login':
            return self.login(request)
        elif action == 'logout':
            return self.logout(request)
        elif action == 'authenticate':
            return self.authenticate(request)
        else:
            return JsonResponse({'error': 'Invalid action'}, status=400)

    def authenticate(self, request):
        """
        Authenticates a user based on the request object provided.

        Args:
            request (HttpRequest): The incoming request object.

        Returns:
            JsonResponse: A JSON response indicating if the user is authenticated along with user information.
        """
        logger.debug('CAS.authenticate called')
        user = request.user
        logger.debug(f'user: {user}')
        logger.debug(f'user.is_authenticated: {user.is_authenticated}')
        if user.is_authenticated:
            user_info = fetch_user_info(user.net_id)
            logger.debug(f'user_info: {user_info}')
            return JsonResponse({'authenticated': True, 'user': user_info})
        else:
            return JsonResponse({'authenticated': False, 'user': None})

    def login(self, request):
        """
        Handles user login. It logs relevant information, checks user authentication status,
        authenticates the user, and redirects accordingly.

        Args:
            request (HttpRequest): The incoming request object.

        Returns:
            HttpResponse: Redirects to the dashboard if the user is authenticated,
                redirects to the dashboard after successful authentication,
                redirects to the CAS login URL if authentication fails,
                or returns a server error response if an exception occurs.
        """
        logger.debug('CAS.login called')
        try:
            logger.info(f'Incoming GET request: {request.GET}, Session: {request.session}')
            logger.info(f"Received login request from {request.META.get('REMOTE_ADDR')}")

            logger.debug(f'request.user: {request.user}')
            logger.debug(f'request.user.is_authenticated: {request.user.is_authenticated}')
            if request.user.is_authenticated:
                return redirect(settings.DASHBOARD)

            service_url = request.build_absolute_uri()
            logger.debug(f'service_url: {service_url}')
            auth_backend = CASAuthBackend()
            user, _ = auth_backend.authenticate(request)
            logger.debug(f'user: {user}')
            if user:
                login(request, user)
                request.session['net_id'] = user.net_id
                logger.debug(f"request.session['net_id']: {request.session['net_id']}")
                return redirect(settings.DASHBOARD)
            else:
                login_url = f'{auth_backend.cas_url}login?service={service_url}'
                logger.debug(f'login_url: {login_url}')
                return redirect(login_url)
        except Exception as e:
            logger.error(f'Exception in login view: {e}')
            return JsonResponse({'error': 'An error occurred during login.'}, status=500)

    def logout(self, request):
        """
        Logs out the user by flushing the session and redirecting to the CAS logout URL.

        Args:
            request (HttpRequest): The incoming request object.

        Returns:
            HttpResponse: Redirects to the CAS logout URL.
        """
        logger.info(f'Incoming GET request: {request.GET}, Session: {request.session}')
        logger.info(f"Received logout request from {request.META.get('REMOTE_ADDR')}")

        # Invalidate the server-side session
        request.session.flush()

        # Redirect the user to the CAS logout URL
        return redirect(settings.HOMEPAGE)


# ------------------------------- SEARCH COURSES --------------------------------------#

DEPT_NUM_SUFFIX_REGEX = compile(r'^[a-zA-Z]{3}\d{3}[a-zA-Z]$', IGNORECASE)
DEPT_NUM_REGEX = compile(r'^[a-zA-Z]{3}\d{1,4}$', IGNORECASE)
DEPT_ONLY_REGEX = compile(r'^[a-zA-Z]{1,3}$', IGNORECASE)
NUM_SUFFIX_ONLY_REGEX = compile(r'^\d{3}[a-zA-Z]$', IGNORECASE)
NUM_ONLY_REGEX = compile(r'^\d{1,4}$', IGNORECASE)
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


class SearchCourses(APIView):
    """
    Handles search queries for courses.
    """

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('course')
        term = request.query_params.get('term')
        distribution = request.query_params.get('distribution')
        levels = request.query_params.get('level')
        grading_options = request.query_params.get('grading')

        if not query:
            return Response({'courses': []})

        init_time = time.time()

        # Process query
        trimmed_query = sub(r'\s', '', query)
        dept, num, code = self.parse_query(trimmed_query)

        # Build query conditions
        query_conditions = self.build_query_conditions(term, distribution, levels, grading_options)

        try:
            # Try exact match first
            exact_match_course = self.get_exact_match(dept, num, query_conditions)
            if exact_match_course:
                serialized_course = CourseSerializer(exact_match_course, many=True)
                return Response({'courses': serialized_course.data})

            # If no exact match, do broader search
            courses = self.get_broader_match(code, query_conditions)
            if courses:
                serialized_courses = CourseSerializer(courses, many=True)
                sorted_data = sorted(serialized_courses.data, key=make_sort_key(dept))
                print(f'Search time: {time.time() - init_time}')
                return Response({'courses': sorted_data})

            return Response({'courses': []})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def parse_query(self, query):
        if DEPT_NUM_SUFFIX_REGEX.match(query) or DEPT_NUM_REGEX.match(query):
            result = split(
                r'(\d+[a-zA-Z]?)' if DEPT_NUM_SUFFIX_REGEX.match(query) else r'(\d+)',
                query,
                maxsplit=1,
            )
            dept, num = result[0], result[1]
            code = f'{dept} {num}'
        elif NUM_ONLY_REGEX.match(query) or NUM_SUFFIX_ONLY_REGEX.match(query):
            dept, num, code = '', query, query
        elif DEPT_ONLY_REGEX.match(query):
            dept, num, code = query, '', query
        else:
            dept, num, code = '', '', ''
        return dept, num, code

    def build_query_conditions(self, term, distribution, levels, grading_options):
        conditions = Q()
        if term:
            conditions &= Q(guid__startswith=term)
        if distribution:
            conditions &= Q(distribution_area_short__icontains=distribution)
        if levels:
            level_query = Q()
            for level in levels.split(','):
                level_query |= Q(catalog_number__startswith=level)
            conditions &= level_query
        if grading_options:
            grading_query = Q()
            for grading in grading_options.split(','):
                grading_query |= Q(grading_basis__iexact=grading)
            conditions &= grading_query
        return conditions

    def get_exact_match(self, dept, num, conditions):
        return (
            Course.objects.select_related('department')
            .filter(conditions & Q(department__code__iexact=dept) & Q(catalog_number__iexact=num))
            .order_by('course_id', '-guid')
            .distinct('course_id')
        )

    def get_broader_match(self, code, conditions):
        return (
            Course.objects.select_related('department')
            .filter(conditions & Q(crosslistings__icontains=code))
            .order_by('course_id', '-guid')
            .distinct('course_id')
        )


class GetUserCourses(APIView):
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
                    user_courses = Course.objects.filter(usercourses__user=user_inst, usercourses__semester=semester)
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


def update_courses(request):
    try:
        data = json.loads(request.body)
        crosslistings = data.get('crosslistings')  # might have to adjust this, print
        container = data.get('semesterId')
        net_id = request.session['net_id']
        user_inst = CustomUser.objects.get(net_id=net_id)
        class_year = user_inst.class_year
        course_inst = (
            Course.objects.select_related('department')
            .filter(crosslistings__iexact=crosslistings)
            .order_by('-guid')[0]
        )

        if container == 'Search Results':
            user_course = UserCourses.objects.get(user=user_inst, course=course_inst)
            user_course.delete()
            message = f'User course deleted: {crosslistings}, {net_id}'

        else:
            semester = parse_semester(container, class_year)

            user_course, created = UserCourses.objects.update_or_create(
                user=user_inst, course=course_inst, defaults={'semester': semester}
            )
            if created:
                message = f'User course added: {semester}, {crosslistings}, {net_id}'
            else:
                message = f'User course updated: {semester}, {crosslistings}, {net_id}'

        return JsonResponse({'status': 'success', 'message': message})

    except Exception as e:
        # Log the detailed error internally
        logger.error(f'An internal error occurred: {e}', exc_info=True)

        # Return a generic error message to the user
        return JsonResponse({'status': 'error', 'message': 'An internal error has occurred!'})


def update_user(request):
    try:
        class_year = int(request.body)

        if (class_year > 2030) or (class_year < 2023):
            raise ValueError('Class year out of range')

        net_id = request.user.net_id  # TODO: Change this to user.username?
        user_inst = CustomUser.objects.get(net_id=net_id)
        user_inst.class_year = class_year
        user_inst.save()

        return JsonResponse({'status': 'success', 'message': 'Class year updated successfully.'})

    except Exception as e:
        # Log the detailed error internally
        logger.error(f'An internal error occurred: {e}', exc_info=True)

        # Return a generic error message to the user
        return JsonResponse({'status': 'error', 'message': 'An internal error has occurred!'})


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
    # print(f"requirements: {requirements}, transformed: {transformed}\n")
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
    crosslistings = request.GET.get('crosslistings')

    if crosslistings:
        course_info = get_course_info(crosslistings)

        return JsonResponse(course_info)
    else:
        return JsonResponse({'error': 'Missing parameters'}, status=400)


# -------------------------------------- GET COURSE COMMENTS --------------------------


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
    crosslistings = data.get('crosslistings')
    req_id = int(data.get('reqId'))
    net_id = request.session['net_id']
    user_inst = CustomUser.objects.get(net_id=net_id)
    course_inst = (
        Course.objects.select_related('department').filter(crosslistings__iexact=crosslistings).order_by('-guid')[0]
    )

    user_course_inst = UserCourses.objects.get(user_id=user_inst.id, course=course_inst)
    if user_course_inst.requirement_id is None:
        user_course_inst.requirement_id = req_id
        user_course_inst.save()

        return JsonResponse({'Manually settled': user_course_inst.id})

    else:
        user_course_inst.requirement_id = None
        user_course_inst.save()

        return JsonResponse({'Unsettled': user_course_inst.id})


def mark_satisfied(request):
    data = json.loads(request.body)
    req_id = int(data.get('reqId'))
    marked_satisfied = data.get('markedSatisfied')
    net_id = request.session['net_id']

    user_inst = CustomUser.objects.get(net_id=net_id)
    req_inst = Requirement.objects.get(id=req_id)

    if marked_satisfied == 'true':
        user_inst.requirements.add(req_inst)
        action = 'Marked satisfied'
    elif marked_satisfied == 'false':
        if user_inst.requirements.filter(id=req_id).exists():
            user_inst.requirements.remove(req_inst)
            action = 'Unmarked satisfied'
        else:
            return JsonResponse({'error': 'Requirement not found in user requirements.'})

    return JsonResponse({'Manually satisfied': req_id, 'action': action})


def check_requirements(request):
    user_info = fetch_user_info(request.session['net_id'])

    this_major = user_info['major']['code']
    these_minors = [minor['code'] for minor in user_info['minors']]

    req_dict = check_user(user_info['netId'], user_info['major'], user_info['minors'])

    # Rewrite req_dict so that it is stratified by requirements being met
    formatted_dict = {}
    if 'AB' in req_dict:
        formatted_dict['AB'] = req_dict['AB']
    elif 'BSE' in req_dict:
        formatted_dict['BSE'] = req_dict['BSE']
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


# ---------------------------- FETCH REQUIREMENT INFO -----------------------------------#


def requirement_info(request):
    req_id = request.GET.get('reqId', '')
    explanation = ''
    completed_by_semester = 8
    dist_req = []
    sorted_dept_list = []
    sorted_course_list = []
    sorted_dept_sample_list = []
    marked_satisfied = False

    try:
        req_inst = Requirement.objects.get(id=req_id)
        user_inst = CustomUser.objects.get(net_id=request.session['net_id'])

        explanation = req_inst.explanation
        completed_by_semester = req_inst.completed_by_semester
        if req_inst.dist_req:
            dist_req = ensure_list(json.loads(req_inst.dist_req))
            query = Q()
            for distribution in dist_req:
                query |= Q(distribution_area_short__icontains=distribution)
            course_list = (
                Course.objects.select_related('department')
                .filter(query)
                .order_by('course_id', '-guid')
                .distinct('course_id')
            )
        else:
            excluded_course_ids = req_inst.excluded_course_list.values_list('course_id', flat=True).distinct()
            course_list = (
                req_inst.course_list.exclude(course_id__in=excluded_course_ids)
                .order_by('course_id', '-guid')
                .distinct('course_id')
            )

        if course_list:
            serialized_course_list = CourseSerializer(course_list, many=True)
            sorted_course_list = sorted(serialized_course_list.data, key=lambda course: course['crosslistings'])

        if req_inst.dept_list:
            sorted_dept_list = sorted(json.loads(req_inst.dept_list))

            query = Q()

            for dept in sorted_dept_list:
                # Fetch the IDs of 5 courses for the current department
                dept_course_ids = (
                    Course.objects.select_related('department')
                    .filter(department__code=dept)
                    .values_list('id', flat=True)[:5]
                )

                query |= Q(id__in=list(dept_course_ids))

            dept_sample_list = (
                Course.objects.select_related('department')
                .filter(query)
                .order_by('course_id', '-guid')
                .distinct('course_id')
            )
            if dept_sample_list:
                serialized_dept_sample_list = CourseSerializer(dept_sample_list, many=True)
                sorted_dept_sample_list = sorted(
                    serialized_dept_sample_list.data,
                    key=lambda course: course['crosslistings'],
                )

        marked_satisfied = user_inst.requirements.filter(id=req_id).exists()

    except Requirement.DoesNotExist:
        pass

    # mapping:
    # 3 -> 0
    # 0 -> 1
    # 1 -> 2
    # 7 -> 3
    # 5 -> 4
    # 2 -> 5
    # 6 -> 6
    # 4 -> 7

    info = {}
    info[0] = req_id
    info[1] = explanation
    info[2] = completed_by_semester
    info[3] = dist_req
    info[4] = sorted_dept_list
    info[5] = sorted_course_list
    info[6] = sorted_dept_sample_list
    info[7] = marked_satisfied
    return JsonResponse(info)


# --------------------------------- CALENDAR ---------------------------------------#


class FetchCalendarClasses(APIView):
    """
    API view to fetch unique class meetings based on the provided term and course ID.
    """

    def get(self, request, term: str, course_id: str) -> Response:
        """
        Handle GET request to fetch class meetings.

        Args:
            request: The HTTP request object.
            term (str): The term code.
            course_id (str): The course ID.

        Returns:
            Response: A response containing the selected sections data or an error message.
        """
        sections = self.get_class_meetings(term, course_id)
        if not sections.exists():
            return Response({'error': 'No sections found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SectionSerializer(sections, many=True)
        sections = serializer.data

        sections_by_instructor = self.group_by_instructor(sections)

        selected_instructor = next(iter(sections_by_instructor.keys()), None)
        if not selected_instructor:
            return Response({'error': 'No instructors found'}, status=status.HTTP_404_NOT_FOUND)

        selected_sections = sections_by_instructor[selected_instructor]
        self.log_sections(selected_sections)

        return Response(selected_sections, status=status.HTTP_200_OK)

    def get_class_meetings(self, term: str, course_id: str) -> QuerySet:
        """
        Get unique class meetings based on the provided term and course ID.

        Args:
            term (str): The term code.
            course_id (str): The course ID.

        Returns:
            QuerySet: A queryset of Section objects with related data prefetched.
        """
        return (
            Section.objects.filter(term__term_code=term, course__course_id=course_id)
            .select_related('course', 'instructor')
            .prefetch_related(Prefetch('classmeeting_set', queryset=ClassMeeting.objects.order_by('id')))
        )

    @staticmethod
    def group_by_instructor(sections: list[dict]) -> dict[str, list[dict]]:
        """
        Group sections by instructor.

        Args:
            sections (list[dict]): A list of serialized section data.

        Returns:
            dict[str, list[dict]]: A dictionary where keys are instructor names and values are lists of sections.
        """
        return {
            k: list(v)
            for k, v in groupby(
                sorted(sections, key=lambda x: x['instructor_name'] or ''),
                key=lambda x: x['instructor_name'] or '',
            )
        }

    # TODO: This should be used only in DEBUG mode.
    @staticmethod
    def log_sections(sections: list[dict]) -> None:
        """
        Log the sections data for debugging purposes.

        Args:
            sections (list[dict]): A list of serialized section data.
        """
        for section in sections:
            print(f"ID: {section['id']}")
            print(f"Class Section: {section['class_section']}")
            print(f"Class Type: {section['class_type']}")
            print(f"Course ID: {section['course_id']}")
            print(f"Course Title: {section['course_title']}")
            print(f"Instructor: {section['instructor_name']}")
            for meeting in section['class_meetings']:
                print(f"  Meeting ID: {meeting['id']}")
                print(f"  Days: {meeting['days']}")
                print(f"  Start Time: {meeting['start_time']}")
                print(f"  End Time: {meeting['end_time']}")
                print(f"  Building Name: {meeting['building_name']}")
                print(f"  Room: {meeting['room']}")


class CalendarConfigurationsView(APIView):
    """
    API view to handle calendar configurations.
    """

    def get(self, request) -> Response:
        """
        Handle GET request to fetch calendar configurations.
        A calendar configuration is one possible set of courses for the user.

        Args:
            request: The HTTP request object.

        Returns:
            Response: A response containing the serialized calendar configurations.
        """
        net_id = request.user
        logging.info(f'ballsack: {net_id}')
        user_inst = CustomUser.objects.get(net_id=net_id)
        term_code = request.query_params.get('term_code')
        queryset = CalendarConfiguration.objects.filter(user=user_inst.id)
        if term_code:
            queryset = queryset.filter(semester_configurations__term__term_code=term_code)

        serializer = CalendarConfigurationSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request) -> Response:
        """
        Handle POST request to create a new calendar configuration.

        Args:
            request: The HTTP request object.

        Returns:
            Response: A response containing the created calendar configuration or an error message.
        """
        user = request.user
        name = request.data.get('name', 'Default Schedule')

        try:
            calendar_config, created = CalendarConfiguration.objects.get_or_create(
                user=user, name=name, defaults={'user': user, 'name': name}
            )
            serializer = CalendarConfigurationSerializer(calendar_config)
            status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
            return Response(serializer.data, status=status_code)
        except IntegrityError:
            return Response(
                {'detail': 'Calendar configuration with this name already exists.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CalendarConfigurationView(APIView):
    """
    API view to handle a SINGLE calendar configuration.
    """

    def get(self, request, term_code: str) -> Response:
        """
        Handle GET request to fetch a specific calendar configuration.

        Args:
            request: The HTTP request object.
            term_code (str): The term code.

        Returns:
            Response: A response containing the serialized calendar configuration.
        """
        user = request.user
        calendar_config = get_object_or_404(
            CalendarConfiguration,
            user=user,
            semester_configurations__term__term_code=term_code,
        )
        serializer = CalendarConfigurationSerializer(calendar_config)
        return Response(serializer.data)

    def put(self, request, term_code: str) -> Response:
        """
        Handle PUT request to update a specific calendar configuration.
        """
        user = request.user
        calendar_config = get_object_or_404(
            CalendarConfiguration,
            user=user,
            semester_configurations__term__term_code=term_code,
        )
        serializer = CalendarConfigurationSerializer(
            calendar_config,
            data=request.data,
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, term_code: str) -> Response:
        """
        Handle DELETE request to remove a specific calendar configuration.
        """
        user = request.user
        calendar_config = get_object_or_404(
            CalendarConfiguration,
            user=user,
            semester_configurations__term__term_code=term_code,
        )
        calendar_config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SemesterConfigurationView(APIView):
    """
    API view to handle semester configurations.
    """

    def get(self, request, configuration_id: int, term_code: str) -> Response:
        """
        Handle GET request to fetch a specific semester configuration.

        Args:
            request: The HTTP request object.
            configuration_id (int): The calendar configuration ID.
            term_code (str): The term code.

        Returns:
            Response: A response containing the serialized semester configuration.
        """
        semester_config = get_object_or_404(
            SemesterConfiguration,
            calendar_configuration_id=configuration_id,
            calendar_configuration__user=request.user,
            term__term_code=term_code,
        )
        serializer = SemesterConfigurationSerializer(semester_config)
        return Response(serializer.data)

    def put(self, request, configuration_id: int, term_code: str) -> Response:
        """
        Handle PUT request to update a specific semester configuration.

        Args:
            request: The HTTP request object.
            configuration_id (int): The calendar configuration ID.
            term_code (str): The term code.

        Returns:
            Response: A response containing the updated semester configuration or error messages.
        """
        semester_config = get_object_or_404(
            SemesterConfiguration,
            calendar_configuration_id=configuration_id,
            calendar_configuration__user=request.user,
            term__term_code=term_code,
        )
        serializer = SemesterConfigurationSerializer(semester_config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, configuration_id: int, term_code: str) -> Response:
        """
        Handle DELETE request to remove a specific semester configuration.

        Args:
            request: The HTTP request object.
            configuration_id (int): The calendar configuration ID.
            term_code (str): The term code.

        Returns:
            Response: An empty response with a 204 status code.
        """
        semester_config = get_object_or_404(
            SemesterConfiguration,
            calendar_configuration_id=configuration_id,
            calendar_configuration__user=request.user,
            term__term_code=term_code,
        )
        semester_config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScheduleSelectionView(APIView):
    """
    API view to handle schedule selections on a semesterly basis.
    """

    def get(self, request, configuration_id: int, term_code: str, index: int) -> Response:
        """
        Handle GET request to fetch a specific schedule selection.
        """
        schedule = get_object_or_404(
            ScheduleSelection,
            semester_configuration__calendar_configuration_id=configuration_id,
            semester_configuration__calendar_configuration__user=request.user,
            semester_configuration__term__term_code=term_code,
            index=index,
        )
        serializer = ScheduleSelectionSerializer(schedule)
        return Response(serializer.data)

    def put(self, request, configuration_id: int, term_code: str, index: int) -> Response:
        """
        Handle PUT request to update a specific schedule selection.
        """
        schedule = get_object_or_404(
            ScheduleSelection,
            semester_configuration__calendar_configuration_id=configuration_id,
            semester_configuration__calendar_configuration__user=request.user,
            semester_configuration__term__term_code=term_code,
            index=index,
        )
        serializer = ScheduleSelectionSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, configuration_id: int, term_code: str, index: int) -> Response:
        """
        Handle DELETE request to remove a specific schedule selection.
        """
        schedule = get_object_or_404(
            ScheduleSelection,
            semester_configuration__calendar_configuration_id=configuration_id,
            semester_configuration__calendar_configuration__user=request.user,
            semester_configuration__term__term_code=term_code,
            index=index,
        )
        schedule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
