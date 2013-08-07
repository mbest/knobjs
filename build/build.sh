#!/bin/sh

# Ensure we're in the build directory
cd `dirname $0`

# Produce minified version using Google Closure compiler
java -jar tools/compiler.jar --js ../knob.js --js_output_file ../knob.min.js  #--formatting PRETTY_PRINT

echo; echo "Build succeeded"
