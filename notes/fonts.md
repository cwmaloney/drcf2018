# Fonts

1. The naming convenction for fonts supplied by Jimp uses a
size that is rough height of the glyplhs and does not include
space for line height. The line height incresases with typeface height.

1. I perfer that the name matches the line height so I know how
many pixels a string will include. My font names follow this convention.

## Notes

1. Jimp uses bitmap fonts in the “AngelCode”, aka BMFont, format

1. I would like to find "hand made" bitmap fonts because vector fonts rendered
at the sizes we need are not very good.

1. For distantly spaced "pixels" and low resultion "screens", I expect anti-aliasing is not going to be helpful

### Tools for Creating and Fonts

#### Littera

* See tests below

#### BMFont

1. Windows only
1. See test notes below

#### Hiero

1. Java code - source code is avaiable
1. Does not appear to be maintained
1. Includes 3 font rendering engines - FreeType option is not working
1. UI for Java rendering is "wonky"
1. will not run on my Windows 10 computer

#### bmGlyph

1. Mac Only
1. Nice glyphs
1. Outputs .fnt as text file but not xml
1. Outputs all glyphs are the same size - much bigger that pixel or line height

#### Glyph Designer

1. Mac only

#### CBFG

1. https://github.com/CodeheadUK/CBFG
1. Do not support BMfont format; Does not output .fnt file

#### FontForge

* Do not support BMfont format

### From Fontlabs - FontLab, Fontogrpaher, BitFonter

* These do not support BMfont format

#### Shoebox

* Uses Adobe Air - obsolete

## Tests

### Initial tests

* Blake created fonts using Littera and the "default" font. I
do not know what Littera uses as the default font.

### Littera with Comfortaa from Google Fonts

1. See screen shots for configuration
1. Similar to Blake's fonts
1. Too much dithering (anti-aliasing)
1. These are not great

### Current "production" fonts
1. I used Gimp to create bitmap fonts
1. Handcoded the .fnt files
1. Font names are based on line height.
1. Currently we have hand crafted: 12, 16
