#!/bin/bash

set -e

if [ "$EUID" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

PANEL_DOMAIN=$1
SSL_EMAIL=$2

if [ -z "$PANEL_DOMAIN" ] || [ -z "$SSL_EMAIL" ]; then
  echo "Usage:"
  echo "bash install.sh panel.domain.com email@example.com"
  exit 1
fi
