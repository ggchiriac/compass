"""URL configuration for the hoagieplan project.

The `urlpatterns` list routes URLs to views, allowing different sections of the
site to be accessed via HTTP requests. This file connects URL patterns with
corresponding views, ensuring the right logic is executed for each route.

For more information, please see the Django URL dispatcher documentation at:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/

Copyright © 2021-2024 Hoagie Club and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree or at

    https://github.com/hoagieclub/plan/LICENSE.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

from django.contrib import admin
from django.urls import path
from hoagieplan.api.auth import cas
from hoagieplan.api.profile import info
from hoagieplan.api import details
from hoagieplan.api import search
from hoagieplan.api.dashboard import requirements
from hoagieplan.api.calendar import configuration

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # CAS Authentication
    path("cas/", cas.dispatch, name="cas"),
    # Profile
    path("profile/", info.profile, name="profile"),
    path("update_profile/", info.update_profile, name="update_profile"),
    path("profile/", info.profile, name="profile"),
    path("profile/update_profile/", info.update_profile, name="update_profile"),
    path("profile/class-year/", info.update_class_year, name="update_class_year"),
    path("course/details/", details.course_details, name="course_details"),
    path("course/comments/", details.course_comments_view, name="course_comments"),
    # Canvas
    path("search/", search.search_courses, name="search"),
    path("fetch_courses/", search.get_user_courses, name="fetch_courses"),
    path("update_courses/", requirements.update_courses, name="update_courses"),
    path("manually_settle/", requirements.manually_settle, name="manually_settle"),
    path("mark_satisfied/", requirements.mark_satisfied, name="mark_satisfied"),
    path("categorize_requirements/", requirements.categorize_requirements, name="categorize_requirements"),
    # path("update_user/", info.update_user, name="update_user"),
    path("requirement_info/", requirements.requirement_info, name="requirement_info"),
    # Calendar
    path(
        "fetch_calendar_classes/<str:term>/<str:course_id>/",
        configuration.FetchCalendarClasses.as_view(),
        name="fetch_calendar_classes",
    ),
]
