#!/bin/bash
rm /tmp/fields-stats.csv
dstat --net -N eth0 --mem --load --cpu --time --output /tmp/fields-stats.csv > /dev/null
