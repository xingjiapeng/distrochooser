# Generated by Django 2.1.2 on 2019-03-02 15:49

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('distrochooser', '0010_auto_20190302_1647'),
    ]

    operations = [
        migrations.AddField(
            model_name='selectionreason',
            name='isBlockingHit',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='selectionreason',
            name='isPositiveHit',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='usersession',
            name='dateTime',
            field=models.DateTimeField(default=datetime.datetime(2019, 3, 2, 16, 49, 23, 181186)),
        ),
    ]
