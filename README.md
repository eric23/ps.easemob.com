# ps.easemob.com
## Requirement
1. install node.js
2. install grunt and bower
```sh 
$ npm install -g grunt-cli
$ npm install -g bower
```

## Install Guide
1. Enter the root path
2. Build your source
```sh
$ npm install
$ grunt bower-install-simple
$ grunt build:dev
$ grunt build:dist
$ npm start
```

## Configuration Guide
### Language Configuration
1. Enter 'js - services - main.js', modify the section of 'angular translate'
2. Enter 'js - services - config.js', modify the preferred language
3. Add your language files into the folder of l10n
4. Edit the translation with json format, according to your 'translate' path used in your page such as: `<span translate="aside.nav.ps.HEADER">Navigation</span>`
