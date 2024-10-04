---
title: Performance Tuning DrawShapedText
date: 2024-10-04
toc: true
toc_sticky: true
header:
  image: /assets/images/TextRendering.png
---

In my last post [Text Rendering in SkiaSharp and HarfBuzz](/the-trouble-with-text-rendering-in-skiasharp-and-harfbuzz) I mentioned that you should use text shaping, but the default method `DrawShapedText` is very slow compared to `DrawText`.

Matthew Leibowitz replied that this could be done better when you cache some things.

<blockquote class="twitter-tweet"><p lang="en" dir="ltr"><a href="https://twitter.com/BeneStebner?ref_src=twsrc%5Etfw">@BeneStebner</a> may know as he did the most work on the harfbuzz binding. But, the draw shaped text method is slow as it does all the loading and shaping each time. You may want to try reuse things. Also <a href="https://twitter.com/toptensoftware?ref_src=twsrc%5Etfw">@toptensoftware</a> is a cool guy with RichTextKit that does amazing things.</p>&mdash; Matthew Leibowitz (@mattleibow) <a href="https://twitter.com/mattleibow/status/1837544000888492448?ref_src=twsrc%5Etfw">September 21, 2024</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

So I gave that a try.

## Performance tuning

### 1) Remember the `SKShaper` per Font

The standard `DrawShapedText` method is meant to be a replacement for `DrawText`. It has exactly the same parameters.

When I looked at the source, I saw that it just creates a new `SKShaper` for the given font and calls the overload which takes the additional `SKShaper`.

~~~ csharp
    public static void DrawShapedText(this SKCanvas canvas, string text, float x, float y, SKTextAlign textAlign, SKFont font, SKPaint paint)
    {
        if (string.IsNullOrEmpty(text))
            return;

        using var shaper = new SKShaper(font.Typeface);
        canvas.DrawShapedText(shaper, text, x, y, textAlign, font, paint);
    }
~~~

The `SKShaper` constructor loads the typeface and converts it to a `HarfBuzzSharp.Font` object. This already takes some time. So our easiest improvement is creating the `SKShaper` ourselves and caching it for the respective font.

This is a very small change everywhere where the fonts stay unchanged. The result is already very good. It renders the text in a fraction of the time of the call without `SKShaper`.

But we can do more.

### 2) Cache the Shape Result

Looking at the source of [DrawShapedText](https://github.com/mono/SkiaSharp/blob/767c3c3632244bccda96618af1034e10b9e9db5d/source/SkiaSharp.HarfBuzz/SkiaSharp.HarfBuzz/CanvasExtensions.cs#L58) you'll see that its main work is done by `shaper.Shape(text, x, y, font)`. That gives back a `SKShaper.Result` with a code point and position for each glyph. Well, when we cache the `SKShaper` objects for the font, why can't we cache the results of the shaping process too?

Of course we can! In my `CanvasExtensions.DrawShapedText` method I cache the `Result` so that the text shaping does not need to be triggered at all if it is found in the cache.

This brings the execution time down to just about 50% more of the plain `DrawText` without text shaping.

## Benchmarks

I also did benchmarks for a simple `DrawText`, `DrawShapedText`, `DrawShapedText` with `SKShaper` and with enabled caching. Here are the results for simple ASCII text.

~~~
| Method                  | Mean       | Error     | StdDev    | Gen0   | Gen1   | Allocated |
|------------------------ |-----------:|----------:|----------:|-------:|-------:|----------:|
| DrawAscii               |   7.361 us | 0.0650 us | 0.0543 us | 0.0153 |      - |     160 B |
| DrawShapedAscii         | 137.732 us | 0.6826 us | 0.5700 us | 0.2441 |      - |    3144 B |
| DrawAsciiWithShaper     |  19.096 us | 0.1436 us | 0.1273 us | 0.3052 |      - |    2744 B |
| DrawAsciiWithCache      |  10.029 us | 0.1020 us | 0.0954 us | 0.0916 | 0.0763 |     848 B |
~~~

If you draw font ligatures, the shaper has more work, but it renders fewer glyphs. So even though the input string is of similar length, the time cannot really be compared to the ASCII text.

~~~
| Method                  | Mean       | Error     | StdDev    | Gen0   | Gen1   | Allocated |
|------------------------ |-----------:|----------:|----------:|-------:|-------:|----------:|
| DrawLigatures           |   6.265 us | 0.0220 us | 0.0206 us | 0.0153 |      - |     160 B |
| DrawShapedLigatures     | 198.068 us | 0.4889 us | 0.3817 us | 0.2441 |      - |    3144 B |
| DrawLigaturesWithShaper |  72.899 us | 0.5071 us | 0.4496 us | 0.2441 |      - |    2744 B |
| DrawLigaturesWithCache  |   8.631 us | 0.0900 us | 0.0798 us | 0.0916 | 0.0763 |     848 B |
~~~

The same with emojis. There are less glyphs, but with different colors and a different font.

~~~
| Method                  | Mean       | Error     | StdDev    | Gen0   | Gen1   | Allocated |
|------------------------ |-----------:|----------:|----------:|-------:|-------:|----------:|
| DrawEmojis              |   7.612 us | 0.0242 us | 0.0215 us | 0.0153 |      - |     160 B |
| DrawShapedEmojis        |  63.197 us | 0.4407 us | 0.4123 us | 0.1221 |      - |    1888 B |
| DrawEmojisWithShaper    |  17.559 us | 0.0873 us | 0.0817 us | 0.1526 |      - |    1488 B |
| DrawEmojisWithCache     |  13.922 us | 0.1264 us | 0.1182 us | 0.0916 | 0.0610 |     848 B |
~~~

## CanvasExtensions

I copied the `CanvasExtensions` from SkiaSharp.HarfBuzz and added the caching functionality. This class can be found in [CanvasExtensions.cs](https://github.com/MichaelRumpler/SkiaTextRendering/blob/main/SkiaTextRendering/Extensions/CanvasExtensions.cs). For simplicity I removed the obsolete methods. As the API changed from 2.88 to 3.0 there were a lot of them.

By default it does not use caching. You have to enable it with a call to `SetShaperCacheDuration`.

~~~ csharp
    CanvasExtensions.SetShaperCacheDuration(30_000);
~~~

or

~~~ csharp
    canvas.SetShaperCacheDuration(30_000);
~~~

This caches the `SKShaper` and the `SKShaper.Result` for 30 seconds. To disable caching, set the duration to `0`.

If you want to use that in your projects, you only need to copy that class and change the using from

~~~ csharp
    using SkiaSharp.HarfBuzz;
~~~

to the namespace where you put the `CanvasExtensions`.

I also plan to do a PR in SkiaSharp.HarfBuzz. That's why caching is off by default. I don't want to change the behavior of `DrawShapedText`. But of course you can change it in your copy however you like.

---

The code to this blog post including benchmarks and unit tests is on [GitHub](https://github.com/MichaelRumpler/SkiaTextRendering).
