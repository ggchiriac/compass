from django.http import JsonResponse
from django.middleware.csrf import get_token


def csrf_token_view(request):
    token = get_token(request)
    return JsonResponse({"csrfToken": token})
