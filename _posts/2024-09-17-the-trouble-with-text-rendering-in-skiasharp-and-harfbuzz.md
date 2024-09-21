---
title: The Trouble with Text Rendering in SkiaSharp and HarfBuzz
date: 2024-09-17
toc: true
toc_sticky: true
header:
  image: /assets/images/TextRendering.png
---

I feel like I'm getting old. When I was a kid, terminals had 25 rows, 80 columns and green text on black background.
In the last couple of years I wrote my own terminal emulator. I knew that the assumptions from above were not true anymore, but I expected at least that every character had the same size - in memory and screen width. Have I been naive!

## From ASCII to Unicode

The terminals from the past could display 80x25 ASCII characters. So they had a screen buffer of 2000 bytes. Nice and easy!

Today the user can resize the window, change the font or the font size - all of which affect the possible rows and columns.
But it's still no big problem, is it? These events don't happen very often. So you just need a `char[rows * columns]`.

Well - no!

Unicode strifes to store all printable characters in all languages of the world plus emojis. Each character is a [code point](https://www.unicode.org/glossary/#code_point). There are more than 1.1 million of them (0 - 0x10FFFF).

A `char` in C# is UTF-16 encoded. 16 bits are more than the 8 from ASCII but still not enough for all code points.

A simple ASCII character like 'A' remains one char in UTF-16. It's two bytes now, but still constant.

But for the higher values you need two adjacent `char`s called a high and a low surrogate. Together they define one of the 1.1 million code points.

Finally multiple code points could be [Grapheme Clusters](https://learn.microsoft.com/en-us/dotnet/standard/base-types/character-encoding-introduction#grapheme-clusters) and belong together to form one single glyph. E.g. "👩🏽‍🚒" needs seven `char`s - 14 bytes.

This means that in my terminal a row may need more `char`s than columns and you cannot simply get the 5th character with `row[5]`.

The .NET docs page [Character encoding in .NET](https://learn.microsoft.com/en-us/dotnet/standard/base-types/character-encoding-introduction) describes Unicode and the respective .NET APIs very well.

## The framework decision

I started my terminal emulator in WPF but already with Android and iOS in mind. So I chose something which was available on all those platforms - SkiaSharp.

The mobile apps were written with Xamarin.Forms where you heard from version 1 that you only get good performance when you use the native APIs. So sooner or later I changed the rendering code to native Android and iOS. In hindsight that was not worth it. But at least I got to know the rendering and text APIs on those platforms too.

Fortunately Android uses Skia itself, so the Android and SkiaSharp code was very similar. You have almost the same methods on `Android.Graphics.Canvas` and `SkiaSharp.SKCanvas`.

In the end, the WPF code was never released. The Windows client switched to AvaloniaUI. So I took the Android code and converted it back to SkiaSharp. Again, this was very smooth.

Avalonia in general is a very good UI framework. You get results fast. It looks the same on all platforms. Just the performance on Android is too slow. But this is the fault of .NET for Android and not Avalonia.

## Rendering with SkiaSharp

In theory `SKCanvas` can render text very easily with:

~~~ csharp
    public void DrawText(string text, float x, float y, SKFont font, SKPaint paint);
~~~

At the time of this writing SkiaSharp 3.0 is still in preview and the docs are still for the old version. `DrawText` changed a bit from version 2.88 to 3.0. The old version had the font set as property on `SKPaint`. Now you pass it in separately. All my code is for 3.0.

## Font Metrics

The `y` coordinate in `DrawText` is the baseline of the text. But you usually want your text to start at the top of the view. So first you have to find out where that baseline is.

`SKFont` has a property `Metrics` which returns some values which you might need. I needed the character width, line height (to calculate the number of available columns and rows) and ascent (to get the baseline).

`Metrics` for Cascadia Code PL with size 15 has these values:

![Cascadia Code PL Metrics](/assets/images/SKFontMetrics.png)

`AverageCharacterWidth` is 0, `MaxCharacterWidth` is 33.9. This is far away from the actual values. [It turns out that these metrics are specified by the font author](https://github.com/mono/SkiaSharp/issues/1516). I got better results when I measured some glyphs.

~~~ csharp
    // check the maximum sizes of those chars:
    // a Powerline Arrow, Unicode Full Block and Ö and y as fallback
    var bigChars = "\uE0B0\u2588Öy";
    var cellSize = new SKRect();
    for (int i = 0; i < bigChars.Length; i++)
    {
        var s = bigChars.AsSpan(i, 1);
        if (font.ContainsGlyphs(s))    // if the font does not contain the glyph, then skip it
        {
            font.MeasureText(s, out var rect);
            cellSize.Union(rect);
        }
    }

    CharWidth = font.MeasureText("W");     // cellSize.Width is too big
    LineHeight = cellSize.Height;
    Ascent = cellSize.Top;
~~~

With this code I get

~~~ csharp
    CharWidth = 8.7890625;
    LineHeight = 21;
    Ascent = -17;
~~~

To get the baseline for a specific `row` I use `row * LineHeight - Ascent` (Ascent is negative, so the baseline is +17 in row 0).

## A monospaced font?

A terminal should use the same width for every character, so we use a monospaced font.

Does that work for everything? Of course not! That would be too simple.

Some glyphs use double width. And emojis are not even included in the monospaced font which you chose, so they have a different width altogether.

This means that you cannot simply do

~~~ csharp
    x = column * CharWidth;
~~~

You really have to measure how wide all the text left of the column is.

## Font fallback

No font contains glyphs for all the 1.1 million code points which can be encoded with unicode. Emojis are usually in their own font and not contained in e.g. Cascadia Code.

Before you call `DrawText` you have to check if the font really contains glyphs for all the text you want to render. If it doesn't, then you need to find a font which does have glyphs for the text which is missing in the original font.

I do that in this method.

~~~ csharp
    private float DrawText(SKCanvas canvas, float x, float y, string text, SKFont font)
    {
        // text may contain characters which have no glyph in the current font
        // in these instances a fallback font must be used

        float width = 0;

        if (font.ContainsGlyphs(text))
        {
            // font contains glyphs for the whole text. No fallback font is needed.
            return DrawTextNoFallback(canvas, x, y, text, font);
        }

        // there are some characters in text which have no glyph in font

        // iterate over all text elements
        int start = 0;
        TextElementEnumerator enumerator = StringInfo.GetTextElementEnumerator(text);
        bool notAtEnd;
        while (notAtEnd = enumerator.MoveNext())
        {
            var textElement = enumerator.GetTextElement();
            if (!font.ContainsGlyphs(textElement))
            {
                // render previous text elements with current font
                if (start != enumerator.ElementIndex)
                {
                    var regularText = text.Substring(start, enumerator.ElementIndex - start);
                    width += DrawTextNoFallback(canvas, x + width, y, regularText, font);
                    start = enumerator.ElementIndex;
                }

                // find next element which can be rendered with current font again
                while ((notAtEnd = enumerator.MoveNext())
                    && !font.ContainsGlyphs(enumerator.GetTextElement()))
                    ;

                // get text which has no glyphs in font
                var subtext = notAtEnd
                    ? text.Substring(start, enumerator.ElementIndex - start)
                    : text.Substring(start);

                // unfortunately MatchCharacter only takes a char or code point - I cannot pass it a string which is a grapheme cluster
                // so I just find a fallback for the first code point (still better than a single char)
                var firstCodepoint = subtext.EnumerateRunes().First().Value;

                // find a fallback font
                var fallback = SKFontManager.Default.MatchCharacter(
                    font.Typeface.FamilyName,
                    font.Typeface.FontStyle,
                    null,
                    firstCodepoint);

                if (fallback is null)
                    width += DrawTextNoFallback(canvas, x + width, y, subtext, font);    // no fallback found, then just use the given font
                else
                    width += DrawText(canvas, x + width, y, subtext, fallback.ToFont(font.Size));    // this searches for fallback fonts again if necessary

                start = notAtEnd ? enumerator.ElementIndex : text.Length;
            }
        }

        if (start < text.Length)
            width += DrawTextNoFallback(canvas, x + width, y, text.Substring(start), font);

        return width;
    }
~~~

The most important methods are

| Code | Description |
| ---- | ----        |
| `font.ContainsGlyphs(text)` | checks if all the `text` can be rendered with `font` |
| `StringInfo.GetTextElementEnumerator(text)` | iterates over the text elements which may consist of multiple surrogates or grapheme clusters |
| `subtext.EnumerateRunes().First().Value` | `EnumerateRunes()` unites surrogate pairs and `Value` returns the `int` code point |
| `SKFontManager.Default.MatchCharacter` | finds a `SKTypeface` which does contain a glyph for the code point |

The method returns the width of the rendered text because as mentioned above not all glyphs are monospaced.

`DrawTextNoFallback` for SkiaSharp is straightforward:

~~~ csharp
    private float DrawTextNoFallback(SKCanvas canvas, float x, float y, string text, SKFont font)
    {
        var width = font.MeasureText(text);
        canvas.DrawText(text, x, y - fontInfo.Ascent, font, foreground);
        return width;
    }
~~~

## HarfBuzz

Skias `DrawText` method is quite dumb. It renders every code point separately. The result is, that it does not understand grapheme clusters and it also does not render font ligatures. If you want these, you have to do text shaping. That's what [HarfBuzz](https://harfbuzz.github.io/what-is-harfbuzz.html) is for.
Text shaping is primarily needed to render Indic, Arabic, Thai or Hebrew text. But it also covers emojis and font ligatures.

HarfBuzz is one of those little libraries which nobody knows, but is [used everywhere](https://github.com/harfbuzz/harfbuzz). E.g. in Android, Chrome, Firefox, Microsoft Edge, GNOME, LibreOffice, OpenJDK, Adobe Photoshop, Illustrator, Godot Engine, Unreal Engine, and many others.

![Text samples with Skia and HarfBuzz](/assets/images/SkiaAndHarfBuzz.png)

The black cat consist of multiple code points. A normal cat, a Zero Width Joiner and finally the color.
Skia renders all of them separately. Only HarfBuzz combines them into one element.
The same with the woman firefighter and the artist.

As you can see Skia also does not render text ligatures. The < and the = are rendered separately. HarfBuzz combines them into one glyph.

To use HarfBuzz instead of Skia is very easy. You just need to install the "SkiaSharp.HarfBuzz" NuGet package and add a

~~~ csharp
using SkiaSharp.HarfBuzz;
~~~

This adds an extension method on `SKCanvas` called `DrawShapedText` with the same parameters as `DrawText`. So you just have to change the method name.

But we also need the width of the rendered text. This is a little more effort.

~~~ csharp
    private float DrawTextNoFallback(SKCanvas canvas, float x, float y, string text, SKFont font)
    {
        var width = HarfbuzzMeasure(text, font);
        canvas.DrawShapedText(text, x, y - fontInfo.Ascent, font, foreground);
        return width;
    }

    private static float HarfbuzzMeasure(string text, SKFont font)
    {
        // code from https://github.com/mono/SkiaSharp/issues/1810
        // updated for v3.0 and set UnitsPerEm which should work around the bug in that issue

        using (var blob = font.Typeface.OpenStream().ToHarfBuzzBlob())
        using (var hbface = new HarfBuzzSharp.Face(blob, 0) { UnitsPerEm = font.Typeface.UnitsPerEm })
        {
            using (var hbFont = new HarfBuzzSharp.Font(hbface))
            {
                using (var buffer = new HarfBuzzSharp.Buffer())
                {
                    buffer.AddUtf16(text);
                    buffer.GuessSegmentProperties();
                    hbFont.Shape(buffer);

                    hbFont.GetScale(out var xScale, out _);
                    var scale = font.Size / xScale;
                    return buffer.GlyphPositions.Sum(x => x.XAdvance) * scale;
                }
            }
        }
    }
~~~

## Performance

The drawback is: `DrawShapedText` is much slower compared to plain `DrawText`. In my terminal on Windows I rendered a whole page of text with SkiaSharp in 3 milliseconds. When I used `DrawShapedText` instead, it needed about 20ms.
With many small texts in different colors (htop) which result in many calls to `DrawShapedText` this changed to 5.5ms vs. 160ms.

So it is worth thinking about what you want to render. Is it only ASCII characters? Then SkiaSharp may be good enough.

If you need to render non-latin languages, emojis or use font ligatures, then you definitely need HarfBuzzSharp.

## Sample code

I wrote a very simple AvaloniaUI app where you can enter some text and it is rendered with SkiaSharp and HarfBuzz. There you can easily see what works in SkiaSharp and what doesn't.

You can find it on [GitHub](https://github.com/MichaelRumpler/SkiaTextRendering). The text rendering code is in [TextInfo.cs](https://github.com/MichaelRumpler/SkiaTextRendering/blob/main/Views/TextInfo.cs).
