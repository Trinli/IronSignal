#!/bin/zsh
set -eu
cd "${0:A:h}"
mkdir -p .build
needs_build=0
for source_file in Sources/*.swift; do
  if [[ ! -x .build/IronSignal || "$source_file" -nt .build/IronSignal ]]; then needs_build=1; fi
done
if [[ "$needs_build" == 1 ]]; then
  print '\n  IRON SIGNAL / compiling mission cartridge...\n'
  swiftc Sources/*.swift -o .build/IronSignal -framework Cocoa -framework SpriteKit -framework AVFoundation -module-cache-path "${TMPDIR:-/tmp}/iron-signal-swift-cache"
fi
print '\n  IRON SIGNAL  //  five-sector campaign'
print '  Arrows or A/D: move | Space: jump | J: fire | W/Up: aim up'
print '  E: teleport | Tab: map | Enter: start/next | 1-5: select mission on title screen'
print '  Esc/P: pause | T: title from pause | M: choose music | R: retry | Cmd+Q: quit\n'
exec .build/IronSignal "$@"
