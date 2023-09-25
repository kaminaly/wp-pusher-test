#!/bin/bash

set -e

md5_of_project_path=$(docker ps --format '{{.Names}}' | grep '\-tests-wordpress-1' | sed -e 's/-tests-wordpress-1/\n/g')
container_name="$md5_of_project_path-wordpress-1"
container_id=$(docker ps -aqf "name=$container_name")

if [[ $(uname -m) == 'arm64' ]]; then
  # For AppleSilicon
  curl -sSL https://github.com/evertiro/mhsendmail/releases/download/v0.2.0-M1/mhsendmail_linux_arm64 -o env/mhsendmail_linux
else
  # For intel
  curl -sSL https://github.com/mailhog/mhsendmail/releases/download/v0.2.0/mhsendmail_linux_amd64 -o env/mhsendmail_linux
fi

chmod +x env/mhsendmail_linux
docker cp "env/mhsendmail_linux" "$container_id:/usr/local/bin/mhsendmail"
rm -f env/mhsendmail_linux

docker exec -it $container_name /bin/sh -c "echo 'sendmail_path = \"/usr/local/bin/mhsendmail --smtp-addr=mailhog:1025\"' >> /usr/local/etc/php/conf.d/sendmail.ini"
docker exec -it $container_name /etc/init.d/apache2 reload

file="version: \"3.8\"
networks:
  \"${md5_of_project_path}_default\":
    external: true

services:
  mailhog:
    image: mailhog/mailhog
    ports:
      - \"8025:8025\"
      - \"1025:1025\"
    networks:
      - \"${md5_of_project_path}_default\"
"

echo "$file" > docker-compose.mailhog.yml