#!/usr/bin/env bash
# build.sh - Render build script for Django backend

set -o errexit  # exit on error

pip install -r requirements.txt

cd backend

python manage.py collectstatic --no-input
python manage.py migrate
