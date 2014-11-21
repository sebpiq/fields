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


Run with forever
------------------

```
forever -l tmp/out.log rhizome/bin/rhizome/main.js config.js
```
