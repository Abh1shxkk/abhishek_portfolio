#!/bin/sh

# Replace port 80 with Heroku's PORT in nginx config
sed -i "s/listen 80;/listen ${PORT:-80};/" /etc/nginx/conf.d/default.conf

# Inject environment variables
/docker-entrypoint.d/env-config.sh

# Start nginx
exec nginx -g 'daemon off;'
