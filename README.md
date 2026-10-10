# ripplegl-ts
Ripple Tank, TypeScript/WebGL version

## Introduction

RippleGL is a ripple tank simulation that runs in the browser. It was originally written by me, Paul Falstad, as a Java Applet.  Then Iain Sharp adapted one of my other applets, a circuit simulator, to run in the browser using GWT.  So I used some of his code to build a similar port of the java ripple tank to GWT.  In the process, I also converted the simulation code to WebGL, for much better performance.  This repository is a further conversion of the GWT version to TypeScript, which no longer needs GWT or Java to build.

For a hosted version of the application see http://www.falstad.com/ripple/

## Building the web application

You will need [Node.js](https://nodejs.org/) (version 18 or later) and npm.

```
npm install
npm run dev
```

`npm run dev` starts a [Vite](https://vitejs.dev/) development server on port 5175 and opens the simulator in your browser.  Changes to the source are reloaded automatically.

To build for deployment:

```
npm run build
```

This type-checks the project with `tsc` and then builds the application in to the "dist" directory.  `npm run preview` serves the built "dist" directory locally so you can check it before deploying.

## Project layout

```
-+ Project root
  +- index.html - main page, including the WebGL shaders
  +- renderer.js - WebGL simulation and drawing code
  +- style.css
  ++ ts (directory)
   +- main.ts - entry point
   +- RippleSim.ts - main simulator class: UI, menus, mouse handling, file I/O
   +- *.ts - objects that can be placed in the tank (sources, walls, media, etc.) and dialogs
  ++ app (directory) - files for building an Electron application
  ++ offline (directory, not in git) - Electron release builds
  ++ public (directory) - copied as-is in to the build
   +- examples (directory)
   +- setuplist.txt (index in to example directory)
```

To add an example, put the file in "public/examples" and add a line to "public/setuplist.txt" with the file name followed by the title to show in the menu.

## Deployment of the web application

Run `npm run build` as explained above, then copy everything in the "dist" directory on to your web server.  The build uses relative paths, so it can be put in any directory.

The link for the full-page version of the application is now:
`http://<your host>/<your path>/index.html`

Just for reference the files should look like this

```
-+ Directory containing the application (eg "ripple")
  +- index.html - full page version of application
  ++ assets (directory)
   +- compiled javascript and css built by Vite
  ++ examples (directory)
  +- setuplist.txt (index in to example directory)
  +- other support files from "public"
```

## Embedding

You can link to the full page version of the application using the link shown above.

If you want to embed the application in another page then use an iframe with the src being the full-page version.

You can add query parameters to link to change the applications startup behaviour. The following are supported:
```
.../index.html?rol=<string> // Load the layout from the URL (as created by File->Export As Link)
.../index.html?startExample=<filename> // Loads the file named "filename" from the "examples" directory
.../index.html?colorScheme=rrggbb,rrggbb,... // 9 hex color specifications for walls, + waves, - waves, 0 waves, +,-,0 waves in media, sources, absorbing areas (the last can be omitted)
```
## Building an Electron application

The [Electron](https://electronjs.org/) project allows web applications to be distributed as local executables for a variety of platforms. This repository contains the additional files needed to build Ripple as an Electron application.

The general approach to building an Electron application for a particular platform is documented [here](https://electronjs.org/docs/tutorial/application-distribution). The following instructions apply this approach to Ripple.

To build the Electron application:
* Build the application using `npm run build`, as above.
* Download and unpack a [pre-built Electron binary directory](https://github.com/electron/electron/releases) version 9.3.2 for the target platform.
* Copy the "app" directory from this repository to the location specified [here](https://electronjs.org/docs/tutorial/application-distribution) in the Electron binary directory structure.
* Copy the "dist" directory, containing the built Ripple application, in to the "app" directory the Electron binary directory structure.
* Run the "Electron" executable file. It should automatically load Ripple.

Thanks to @Immortalin for the initial work in applying Electron to CircuitJS1, which was then applied to Ripple.

## License

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
