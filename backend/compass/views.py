import logging
import re

from django.contrib.auth.decorators import login_required
from django.db.models import Case, Q, Value, When
from django.http import JsonResponse
from django.views import View
from .models import Course, CustomUser, models, UserCourses
from django.views.decorators.csrf import csrf_exempt
from .models import Course, CustomUser, models
from .serializers import CourseSerializer
import ujson as json
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

# ------------------------------------ PROFILE ----------------------------------------#


def fetch_user_info(user):
    return {
        'net_id': getattr(user, 'net_id', None),
        'university_id': getattr(user, 'university_id', None),
        'email': getattr(user, 'email', None),
        'first_name': getattr(user, 'first_name', None),
        'last_name': getattr(user, 'last_name', None),
        'class_year': getattr(user, 'class_year', None),
        'department' : getattr(user, 'department', None),
        'puresidentdepartment' : getattr(user, 'puresidentdepartment', None),
        'campusid' : getattr(user, 'campusid', None)
    }


@login_required
def profile(request):
    user_info = fetch_user_info(request.user)
    return JsonResponse(user_info)

# TODO: Need to give csrf token instead of exempting it in production
@csrf_exempt
@login_required
def update_profile(request):
    # TODO: Validate this stuff
    # Assuming the request data is sent as JSON
    data = json.loads(request.body)
    update_settings(request) # patch for now, 
    # will have to make this more modular and elegant smh --windsor

    # Validate and extract the new fields
    new_first_name = data.get('firstName', '')
    new_last_name = data.get('lastName', '')
    new_major = data.get('major', '')
    new_minors = data.get('minors', '')  # Assuming minors is a comma-separated string

    # Fetch the user's profile
    net_id = request.user.net_id  # or however you get the net_id
    user_profile = CustomUser.objects.get(net_id=net_id)

    user_profile.first_name = data.get('firstName', '')
    user_profile.last_name = data.get('lastName', '')
    user_profile.major = data.get('major', {}).get('code')
    # user_profile.minors = [minor.get('code') for minor in minor.set()]
    user_profile.class_year = data.get('classYear', {}).get('code')
    user_profile.timeFormat24h = data.get('timeFormat24h', False)
    user_profile.themeDarkMode = data.get('themeDarkMode', False)

    user_profile.save()
    updated_user_info = fetch_user_info(request.user)
    return JsonResponse(updated_user_info)


# ------------------------------------ LOG IN -----------------------------------------#


def authenticate(request):
    is_authenticated = request.user.is_authenticated
    if is_authenticated:
        user_info = fetch_user_info(request.user)
        logger.info(
            f'User is authenticated. User info: {user_info}. Cookies: {request.COOKIES}'
        )
        return JsonResponse({'authenticated': True, 'user': user_info})
    else:
        logger.info('User is not authenticated.')
        return JsonResponse({'authenticated': False, 'user': None})


# ------------------------------- SEARCH COURSES --------------------------------------#

DEPT_NUM_SUFFIX_REGEX = re.compile(r'^[a-zA-Z]{1,3}\d{1,3}[a-zA-Z]{1}$', re.IGNORECASE)
DEPT_NUM_REGEX = re.compile(r'^[a-zA-Z]{1,3}\d{1,3}$', re.IGNORECASE)
NUM_DEPT_REGEX = re.compile(r'^\d{1,3}[a-zA-Z]{1,3}$', re.IGNORECASE)
DEPT_ONLY_REGEX = re.compile(r'^[a-zA-Z]{1,3}$', re.IGNORECASE)
NUM_ONLY_REGEX = re.compile(r'^\d{1,3}$', re.IGNORECASE)


class SearchCourses(View):
    """
    Handles search queries for courses.
    """

    def get(self, request, *args, **kwargs):
        query = request.GET.get('course', None)
        if query:
            # if query == '*' or query == '.':
            #     courses = Course.objects.select_related('department').all()
            #     serialized_courses = CourseSerializer(courses, many=True)
            #     return JsonResponse({'courses': serialized_courses.data})

            # process queries
            trimmed_query = re.sub(r'\s', '', query)
            # title = ''
            if DEPT_NUM_SUFFIX_REGEX.match(trimmed_query):
                result = re.split(r'(\d+[a-zA-Z])', string=trimmed_query, maxsplit=1)
                dept = result[0]
                num = result[1]
            elif DEPT_NUM_REGEX.match(trimmed_query):
                result = re.split(r'(\d+)', string=trimmed_query, maxsplit=1)
                dept = result[0]
                num = result[1]
            elif NUM_DEPT_REGEX.match(trimmed_query):
                result = re.split(r'([a-zA-Z]+)', string=trimmed_query, maxsplit=1)
                dept = result[1]
                num = result[0]
            elif DEPT_ONLY_REGEX.match(trimmed_query):
                dept = trimmed_query
                num = ''
                # title = query.strip()
            elif NUM_ONLY_REGEX.match(trimmed_query):
                dept = ''
                num = trimmed_query
            else:
                dept = ''
                num = ''
                # title = query.strip()

            try:
                exact_match_course = Course.objects.select_related('department').filter(
                    Q(department__code__iexact=dept) & Q(catalog_number__iexact=num)
                )
                if exact_match_course:
                    # If an exact match is found, return only that course
                    serialized_course = CourseSerializer(exact_match_course, many=True)
                    return JsonResponse({'courses': serialized_course.data})
                courses = Course.objects.select_related('department').filter(
                    Q(department__code__icontains=dept)
                    & Q(catalog_number__icontains=num)
                )
                if not courses.exists():
                    return JsonResponse({'courses': []})
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
                    '-custom_sorting', 'department__code', 'catalog_number', 'title'
                )
                serialized_courses = CourseSerializer(sorted_courses, many=True)
                return JsonResponse({'courses': serialized_courses.data})

            except Exception as e:
                logger.error(f'An error occurred while searching for courses: {e}')
                return JsonResponse({'error': 'Internal Server Error'}, status=500)
        else:
            return JsonResponse({'courses': []})


class GetUserCourses(View):
    """
    Retrieves user's courses for frontend
    """
    def get(self, request, *args, **kwargs):
        net_id = fetch_user_info(request.user)['net_id']
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

@csrf_exempt
def update_settings(request):
    try:
        class_year = int(request.body)

        if (class_year > 2030) or (class_year < 2023):
            raise ValueError("Class year out of range")

        net_id = fetch_user_info(request.user)['net_id']
        user_inst = CustomUser.objects.get(net_id=net_id)
        user_inst.class_year = class_year
        user_inst.save()

        return JsonResponse(
            {'status': 'success', 'message': 'Class year updated successfully.'}
        )

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})


def parse_semester(semester_id, class_year):
    season = semester_id.split(' ')[0]
    year = int(semester_id.split(' ')[1])
    is_Fall = 1 if (season == "Fall") else 0
    semester_num = 8 - ((class_year - year) * 2 - is_Fall)

    return semester_num


# This needs to be changed.
def get_first_course_inst(course_code):
    department_code = course_code.split(" ")[0]
    catalog_number = course_code.split(" ")[1]
    course_inst = Course.objects.filter(department__code=department_code,
                                        catalog_number=catalog_number)[0]
    return course_inst


@csrf_exempt
def update_user_courses(request):
    try:
        data = json.loads(request.body)
        course_code = data.get('courseId')  # might have to adjust this, print
        container = data.get('semesterId')
        net_id = fetch_user_info(request.user)['net_id']
        user_inst = CustomUser.objects.get(net_id=net_id)
        class_year = user_inst.class_year
        course_inst = get_first_course_inst(course_code)

        if container == 'Search Results':
            user_course = UserCourses.objects.get(user=user_inst,
                                                  course=course_inst)
            user_course.delete()
            message = f"User course deleted: {course_inst.id}, {net_id}"

        else:
            semester = parse_semester(container, class_year)

            user_course, created = UserCourses.objects.update_or_create(
                user=user_inst,
                course=course_inst,
                defaults={'semester': semester}
            )
            if created:
                message = f"User course added: {semester}, {course_inst.id}, {net_id}"
            else:
                message = f"User course updated: {semester}, {course_inst.id}, {net_id}"

        return JsonResponse(
            {'status': 'success', 'message': message}
        )

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
