from django.apps import AppConfig


class CompassConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'compass' # TODO: Change this and other references of Compass to `hoagieplan`
