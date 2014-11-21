Starting linux without GUI
------------------------------

in `/etc/default/grub`, replace the line 

```
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
```
by 

```
GRUB_CMDLINE_LINUX_DEFAULT="text"
```

then run 

```
sudo update-grub
```