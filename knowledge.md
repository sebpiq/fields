Network
==========


Limiting the amount of users
------------------------------

In order to limit the amount of users that can connect to the network, the best is to configure the access points to access at most `N` users.

Limiting the amount of users that can connect by limiting the pool size of IP addresses from the DHCP server is a bad idea, because it can cause the DHCP server to quickly run out of IP addresses and new users won't be able to connect.


DHCP lease
------------

If the DHCP lease time is very long, IP addresses can be reserved abusively, and new users won't be able to connect as there won't be any new IP address available ... even if their user has already left the network.

There is 2 solutions to mitigate this. First, using a short DHCP lease time, second having a big pool of IP addresses.

Apparently having a very short lease time (< 1mn) can cause problems. This of course depends on the implementation in clients. Lease time of >= 5mn should be ok.


Ubiquiti
==========


Readopting an AP
--------------------

SSH to it, then (source http://wiki.ubnt.com/UniFi_FAQ#L3_.28Layer_3.29_Management)

```
# 1. make sure the AP is running the latest (or 2.1.0+)
#    if it's not, do
#    syswrapper.sh upgrade http://ip-of-controller:8080/dl/firmware/BZ2/version-of-ap-see-ref-table-below/firmware.bin
# 2. make sure the AP is in factory default state
#    if it's not, do
#    syswrapper.sh restore-default
# 3. ssh into the device and type
mca-cli
# the CLI interface:
set-inform http://ip-of-controller:8080/inform
```
