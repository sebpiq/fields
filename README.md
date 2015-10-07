Fields
========

**Fields** is a live performance system allowing to play sound through the mobile devices of audience members. Participants can connect to a web page that can be made available either online or on a local network, and performers can then control sound from the connected devices by sending OSC messages.

Fields uses **node.js** to run a server. Sound can be programmed with Pure Data (through [WebPd](http://github.com/sebpiq/WebPd)).


Quick start
--------------

**NB** : if you have never heard of Node.js, you should read the *full instructions*.

You first need to install [node.js](https://nodejs.org/) version **0.12**. I highly recommend to install it through [nvm](https://github.com/creationix/nvm).

Then, in a terminal run `npm install -g fields-system`.

Finally, simply create a configuration file, and start the **Fields** server by running `fields config.js` in a terminal.

Examples of working applications with full configuration files can be found [here](http://github.com/sebpiq/fields/tree/master/examples).


Full instructions
--------------------

**NB** : these instructions are for mac or linux.

### Node.js installation

#### Prerequisites

- If you are using a mac, you first need to install **command-line tools** or **Xcode** through the app store.
- All users will also need **git**


#### Installation

**Node.js** is an open-source environment for programming applications in JavaScript, **fields** is built on top of it. I recommend to install node by using [nvm](https://github.com/creationix/nvm) . Node comes with two command-line tools `node` which is the programming environment and `npm`, which is the package manager, and allows to easily install third-party packages from the web.

**nvm** is a small command-line tool which allows you to easily install a specific version of node, and switch between different versions. To install it, first make sure that you have either `.profile` or `.bashrc` file in your home directory (they are hidden files, so they will not appear in Finder). If not, open a terminal and run `touch ~/.profile` . Then, follow the instruction on [nvm github page](https://github.com/creationix/nvm).

When the installation of **nvm** is complete, close and re-open your terminal. Type `nvm` and if the installation succeeded, you should see nvm's help message. You can now install node 0.12 by running `nvm install 0.12` . Once node installation is complete, you should be able to use the commands `node` or `npm` from your terminal.


### Installing Fields and running an example

#### Prerequisites

- The example for **fields** requires **Pure Data Extended**. So please install it first.
- **Node** and **npm**


#### Installation

In a terminal, run `npm install -g fields-system`. This might take a little while as it downloads many packages from Internet. If the installation succeeded, you shouldn't get any error messages.

Try to type `fields` in your terminal, you should get a very short help message.


#### Running the example

Download the example [here](https://github.com/sebpiq/fields/tree/master/examples/webpd-instrument). To do that, you can either download all the files one by one, or [download the whole fields code](https://github.com/sebpiq/fields/archive/master.zip) (including a lot of files you don't need to care about). Create a folder, and copy all the files from the example inside. Then with you terminal, navigate to that folder, and run `fields config.js`. It should start the **fields** server, print a copyright notice, and a few other informations on your configuration. 

Now that the server is running, open your browser and go to [localhost:8000/s.html](http://localhost:8000/s.html). You should see a page with a start button. Press that button, and an instrument should be loaded in your browser. By sending OSC messages you should be able to control that instrument. Open the patch `controls.pd` with Pd-extended, and try to start the instrument, change the volume and the frequency.


### Re-opening Fields after you've shutdown your computer

If you've done all of the above, and have shut down your computer and you want to come back to it! Then simply open a terminal, activate the node version you installed with nvm by running `nvm use 0.12`, navigate to the folder containing your project (or the example), and start the fields server by running `fields config.js`. 
