# Generated by Django 4.2.7 on 2023-12-10 05:06

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("compass", "0005_remove_certificate_req_list_remove_degree_req_list_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="course",
            name="pu_flag",
        ),
        migrations.RemoveField(
            model_name="customuser",
            name="university_id",
        ),
        migrations.RemoveField(
            model_name="usercourses",
            name="status",
        ),
        migrations.AlterField(
            model_name="academicterm",
            name="suffix",
            field=models.CharField(db_index=True, max_length=10),
        ),
        migrations.AlterField(
            model_name="academicterm",
            name="term_code",
            field=models.CharField(
                db_index=True, max_length=10, null=True, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="code",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="description",
            field=models.TextField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="max_counted",
            field=models.IntegerField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="min_needed",
            field=models.IntegerField(db_index=True, default=1),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="name",
            field=models.CharField(db_index=True, max_length=150, null=True),
        ),
        migrations.AlterField(
            model_name="certificate",
            name="urls",
            field=models.JSONField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="classmeeting",
            name="building_name",
            field=models.CharField(db_index=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="classmeeting",
            name="days",
            field=models.CharField(db_index=True, max_length=20, null=True),
        ),
        migrations.AlterField(
            model_name="classmeeting",
            name="end_time",
            field=models.TimeField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="classmeeting",
            name="meeting_number",
            field=models.PositiveIntegerField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="classmeeting",
            name="room",
            field=models.CharField(db_index=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name="classmeeting",
            name="start_time",
            field=models.TimeField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="add_consent",
            field=models.CharField(blank=True, db_index=True, max_length=1, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="course_id",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="description",
            field=models.TextField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="distribution_area_long",
            field=models.CharField(
                blank=True, db_index=True, max_length=150, null=True
            ),
        ),
        migrations.AlterField(
            model_name="course",
            name="distribution_area_short",
            field=models.CharField(blank=True, db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="drop_consent",
            field=models.CharField(blank=True, db_index=True, max_length=1, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="grading_basis",
            field=models.CharField(blank=True, db_index=True, max_length=5, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="guid",
            field=models.CharField(db_index=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="long_title",
            field=models.CharField(
                blank=True, db_index=True, max_length=250, null=True
            ),
        ),
        migrations.AlterField(
            model_name="course",
            name="reading_list",
            field=models.TextField(blank=True, db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="reading_writing_assignment",
            field=models.TextField(blank=True, db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="course",
            name="web_address",
            field=models.URLField(blank=True, db_index=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="customuser",
            name="email",
            field=models.EmailField(blank=True, max_length=100, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="customuser",
            name="role",
            field=models.CharField(
                choices=[("admin", "Administrator"), ("student", "Student")],
                default="student",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="degree",
            name="code",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="degree",
            name="description",
            field=models.TextField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="degree",
            name="max_counted",
            field=models.IntegerField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="degree",
            name="min_needed",
            field=models.IntegerField(db_index=True, default=1),
        ),
        migrations.AlterField(
            model_name="degree",
            name="name",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="degree",
            name="urls",
            field=models.JSONField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="department",
            name="name",
            field=models.CharField(db_index=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name="instructor",
            name="emplid",
            field=models.CharField(
                db_index=True, max_length=50, null=True, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="instructor",
            name="first_name",
            field=models.CharField(db_index=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name="instructor",
            name="last_name",
            field=models.CharField(db_index=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name="major",
            name="code",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="major",
            name="description",
            field=models.TextField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="major",
            name="max_counted",
            field=models.IntegerField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="major",
            name="min_needed",
            field=models.IntegerField(db_index=True, default=1),
        ),
        migrations.AlterField(
            model_name="major",
            name="name",
            field=models.CharField(db_index=True, max_length=150, null=True),
        ),
        migrations.AlterField(
            model_name="major",
            name="urls",
            field=models.JSONField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="minor",
            name="code",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="minor",
            name="description",
            field=models.TextField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="minor",
            name="max_counted",
            field=models.IntegerField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="minor",
            name="min_needed",
            field=models.IntegerField(db_index=True, default=1),
        ),
        migrations.AlterField(
            model_name="minor",
            name="name",
            field=models.CharField(db_index=True, max_length=150, null=True),
        ),
        migrations.AlterField(
            model_name="minor",
            name="urls",
            field=models.JSONField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="completed_by_semester",
            field=models.IntegerField(db_index=True, default=8),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="course_list",
            field=models.ManyToManyField(
                db_index=True, related_name="satisfied_by", to="compass.course"
            ),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="dept_list",
            field=models.JSONField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="dist_req",
            field=models.JSONField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="double_counting_allowed",
            field=models.BooleanField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="explanation",
            field=models.TextField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="max_common_with_major",
            field=models.IntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="max_counted",
            field=models.IntegerField(db_index=True, default=1),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="min_grade",
            field=models.FloatField(db_index=True, default=0.0),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="min_needed",
            field=models.IntegerField(db_index=True, default=1),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="name",
            field=models.CharField(db_index=True, max_length=150, null=True),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="num_courses",
            field=models.IntegerField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="requirement",
            name="pdfs_allowed",
            field=models.IntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="section",
            name="capacity",
            field=models.IntegerField(db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="section",
            name="class_number",
            field=models.IntegerField(db_index=True, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="section",
            name="class_section",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="section",
            name="class_type",
            field=models.CharField(
                choices=[
                    ("Seminar", "Seminar"),
                    ("Lecture", "Lecture"),
                    ("Precept", "Precept"),
                    ("Unknown", "Unknown"),
                    ("Class", "Class"),
                    ("Studio", "Studio"),
                    ("Drill", "Drill"),
                    ("Lab", "Lab"),
                    ("Ear training", "Ear training"),
                ],
                db_index=True,
                default="",
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="section",
            name="enrollment",
            field=models.IntegerField(db_index=True, default=0),
        ),
        migrations.AlterField(
            model_name="section",
            name="seat_reservations",
            field=models.CharField(db_index=True, max_length=1, null=True),
        ),
        migrations.AlterField(
            model_name="section",
            name="status",
            field=models.CharField(db_index=True, max_length=10, null=True),
        ),
        migrations.AlterField(
            model_name="section",
            name="track",
            field=models.CharField(db_index=True, max_length=5, null=True),
        ),
        migrations.AlterField(
            model_name="usercourses",
            name="semester",
            field=models.IntegerField(
                choices=[
                    (1, "freshman fall"),
                    (2, "freshman spring"),
                    (3, "sophomore fall"),
                    (4, "sophomore spring"),
                    (5, "junior fall"),
                    (6, "junior spring"),
                    (7, "senior fall"),
                    (8, "senior spring"),
                ],
                db_index=True,
                null=True,
            ),
        ),
        migrations.CreateModel(
            name="CourseEvaluations",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("quality_of_classes", models.FloatField(null=True)),
                ("quality_of_course", models.FloatField(null=True)),
                ("quality_of_lectures", models.FloatField(null=True)),
                ("quality_of_precepts", models.FloatField(null=True)),
                ("quality_of_readings", models.FloatField(null=True)),
                ("quality_of_written_assignments", models.FloatField(null=True)),
                ("recommend_to_other_students", models.FloatField(null=True)),
                (
                    "course",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="compass.course",
                    ),
                ),
                (
                    "term",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="compass.academicterm",
                    ),
                ),
            ],
            options={
                "db_table": "CourseEvaluations",
            },
        ),
        migrations.CreateModel(
            name="CourseComments",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("comment", models.TextField(null=True)),
                (
                    "course_evaluation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="comments",
                        to="compass.courseevaluations",
                    ),
                ),
            ],
            options={
                "db_table": "CourseComments",
            },
        ),
    ]
