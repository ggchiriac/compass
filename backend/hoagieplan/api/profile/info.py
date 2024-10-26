import json
from datetime import datetime
from re import search
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.db import transaction
from django.core.exceptions import ValidationError
from hoagieplan.models import CustomUser, Certificate, Major, Minor
from data.configs.configs import Configs
from data.req_lib import ReqLib
from hoagieplan.api.errors.errors import UserProfileNotFoundError
from hoagieplan.logger import logger

UNDECLARED = {"code": "Undeclared", "name": "Undeclared"}
VALID_CLASS_YEAR_RANGE = range(2023, 2031)


def get_user_or_create(net_id):
    """Get or create a user with basic information."""
    try:
        user_inst, created = CustomUser.objects.get_or_create(
            net_id=net_id,
            defaults={
                "role": "student",
                "email": "",
                "first_name": "",
                "last_name": "",
                "class_year": datetime.now().year + 1,
            },
        )
        return user_inst
    except Exception as e:
        logger.error(f"Failed to create or retrieve user {net_id}: {e}")
        raise ValidationError(f"Database error for user {net_id}")


def update_user_from_profile(user_inst, profile):
    """Update user information from profile data."""
    if not any([user_inst.email, user_inst.first_name, user_inst.last_name, user_inst.class_year]):
        # Extract class year
        if class_year_match := search(r"Class of (\d{4})", profile["dn"]):
            user_inst.class_year = int(class_year_match.group(1))

        # Extract name
        full_name = profile["displayname"].split(" ")
        user_inst.first_name = full_name[0]
        user_inst.last_name = " ".join(full_name[1:])

        # Update email
        user_inst.email = profile.get("mail", user_inst.email)
        user_inst.save()


def format_user_data(user_inst):
    """Format user data for API response."""
    return {
        "netId": user_inst.net_id,
        "email": user_inst.email,
        "firstName": user_inst.first_name,
        "lastName": user_inst.last_name,
        "classYear": user_inst.class_year,
        "major": ({"code": user_inst.major.code, "name": user_inst.major.name} if user_inst.major else UNDECLARED),
        "minors": [{"code": minor.code, "name": minor.name} for minor in user_inst.minors.all()],
        "certificates": [{"code": cert.code, "name": cert.name} for cert in user_inst.certificates.all()],
    }


def fetch_user_info(net_id):
    """Fetch and format complete user information."""
    configs = Configs()
    req_lib = ReqLib()

    user_inst = get_user_or_create(net_id)

    try:
        # Only fetch external profile if needed
        if not all([user_inst.email, user_inst.first_name, user_inst.last_name, user_inst.class_year]):
            student_profile = req_lib.getJSON(f"{configs.USERS_FULL}?uid={net_id}")
            update_user_from_profile(user_inst, student_profile[0])

        return format_user_data(user_inst)

    except Exception as e:
        logger.error(f"Error processing profile data for {net_id}: {e}")
        raise UserProfileNotFoundError("Failed to update user profile") from e


@require_GET
def profile(request):
    """Get user profile information."""
    net_id = request.session.get("net_id")
    if not net_id:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        user_info = fetch_user_info(net_id)
        return JsonResponse(user_info)
    except UserProfileNotFoundError as e:
        return JsonResponse({"error": str(e)}, status=404)
    except Exception as e:
        logger.error(f"Error in profile view: {e}")
        return JsonResponse({"error": "Internal server error"}, status=500)


@require_POST
def update_profile(request):
    """Update user profile information."""
    net_id = request.session.get("net_id")
    if not net_id:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        with transaction.atomic():
            user_inst = CustomUser.objects.get(net_id=net_id)

            # Update basic info
            user_inst.username = net_id
            user_inst.first_name = data.get("firstName", user_inst.first_name)
            user_inst.last_name = data.get("lastName", user_inst.last_name)
            user_inst.class_year = data.get("classYear", user_inst.class_year)

            # Update major
            major_code = data.get("major", {}).get("code", UNDECLARED["code"])
            major = Major.objects.get(code=major_code)
            user_inst.major = major

            # Update minors
            minor_codes = [m["code"] for m in data.get("minors", []) if "code" in m]
            minors = Minor.objects.filter(code__in=minor_codes)
            user_inst.minors.set(minors)

            # Update certificates
            cert_codes = [c["code"] for c in data.get("certificates", []) if "code" in c]
            certificates = Certificate.objects.filter(code__in=cert_codes)
            user_inst.certificates.set(certificates)

            user_inst.save()

        return JsonResponse(format_user_data(user_inst))

    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Major.DoesNotExist:
        return JsonResponse({"error": f"Major not found: {major_code}"}, status=404)
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        return JsonResponse({"error": "Internal server error"}, status=500)


@require_POST
def update_class_year(request):
    """Update user's class year."""
    net_id = request.session.get("net_id")
    if not net_id:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        class_year = int(request.body)
        if class_year not in VALID_CLASS_YEAR_RANGE:
            return JsonResponse(
                {
                    "error": f"Class year must be between {VALID_CLASS_YEAR_RANGE.start} and {VALID_CLASS_YEAR_RANGE.stop-1}"
                },
                status=400,
            )

        user_inst = CustomUser.objects.get(net_id=net_id)
        user_inst.class_year = class_year
        user_inst.save()

        return JsonResponse({"status": "success", "message": "Class year updated successfully"})

    except ValueError:
        return JsonResponse({"error": "Invalid class year format"}, status=400)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        logger.error(f"Error updating class year: {e}")
        return JsonResponse({"error": "Internal server error"}, status=500)
