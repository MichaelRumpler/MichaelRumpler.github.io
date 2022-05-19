---
title: First Impressions With .NET MAUI
date: 2022-05-04
toc: true
toc_sticky: true
---

I am late to the party. Microsoft announced .NET MAUI at the Build in 2020. Then it was postponed and postponed and now it looks like it will be released at Build 2022 later in May.

It was to be expected. I use Xamarin.Forms since it has been released in 2014 and the Forms team was always too small. It was simply not possible in that time with just a handful of people.

MS developed MAUI completely in the open. That's really cool because you could follow their progress on [GitHub](https://github.com/dotnet/maui) and even step in and help them implementing. Many people did that.

I deliberately held back trying MAUI too early. I did not want to fall over tons of bugs. In the [GestureSample](https://github.com/MichaelRumpler/GestureSample) I use each and every view and layout on every platform and I often get the impression that I'm the only one doing that. When they added Xamarin.Forms for macOS, I added it to MR.Gestures less than a week later. During testing I opened 5-10 bugs which have never been fixed. Nobody seemed to care. I just didn't want to experience that again.

A few weeks back the MAUI release candidate (RC) came out and I finally wanted to give it a try. I'm glad that I waited that long. There are still many [bugs](#problems-still-in-rc2) and they renamed a method in the handlers lately which I need to override everywhere. But generally it looks very good.

Migration is not too much work. You replace the XF `xmlns` in the .xaml files with the new one, remove the `Xamarin.Forms` namespace everywhere and due to the global usings you're almost good to go. Of course I only found the [upgrade assistant](https://github.com/dotnet/upgrade-assistant) AFTER I migrated the GestureSample to MAUI. So I did everything by hand.

Most of the stuff works. All platforms use one multi-targeting project and the Franken projects are finally a thing of the past. This alone is reason enough to switch to MAUI.

## New platforms

.NET MAUI is supported on Android, iOS, MacCatalyst and WinUI3. So compared to Xamarin.Forms for MR.Gestures I need to add MacCatalyst and WinUI3 and drop WPF, UWP and MacOS.

Luckily the iOS code should just work on MacCatalyst now. I didn't test it yet, but that seems to reduce the effort for this a lot. Due to [this bug](https://github.com/dotnet/maui/issues/6674) I couldn't even compile the code on Windows. I'll have to switch to the Mac for that. The Mac and I are no friends, so this will become a challenge.

For WinUI3 I basically took the UWP code and changed some namespaces. On UWP I sometimes used `Window.Current.CoreWindow`. Unfortunately this still exists in `Microsoft.UI.Xaml`, but it returns `null` in WinUI3. So intellisense was a bit misleading there. But once I found that out, the WinUI3 code was not hard to find.

## MAUI Handlers

For MR.Gestures I implemented my own version of each and every `Layout`, `View` and the `ContentPage`. For every single element I needed renderers for every platform to inject my gesture handling. Now in MAUI those renderers have been replaced with handlers. That's quite a biggie for me. Luckily the architecture of MAUI seems to be really solid. So I just needed to find out how to glue everything together. Another advantage of waiting so long: there are a few people out there who already did that and wrote about it. The best info I could find was [in this repo by Javier Suárez](https://github.com/jsuarezruiz/xamarin-forms-to-net-maui/tree/main/Handlers). The essential MAUI developers are also all on Twitter and they respond to questions there. If you only have a small question, this is much faster than opening a GitHub issue.

## MR.Gestures

I'm at a stage where I know how to migrate MR.Gestures, I already wrote the most important handlers, but I'm not finished with all the handlers and I didn't test everything. As soon as I have handlers for everything, I'll release a alpha version so that you all can have a look. Expect a new version in the next couple of days.

Edit: The new version is out. I wrote a blog post about what I had to do which was published on the Microsoft Blog: [Migrating MR.Gestures from Xamarin.Forms to .NET MAUI](https://devblogs.microsoft.com/xamarin/migrating-mrgestures-to-dotnet-maui/).

## Problems still in RC2

Here is a list of problems I stumbled upon during my work on MR.Gestures and the GestureSample. I did not open an issue for everything yet. First I want to finish my work on MR.Gestures. When I'm done with that, I'll link to the issue.

- [MacCatalyst does not compile on Windows](https://github.com/dotnet/maui/issues/6674)
- Platforms folders and files with e.g. .Android.cs extensions are not limited to the respective platform by default
- When copying a file, VS removes it sometimes from Compile in the .csproj
- Deploy to iOS sometimes does not work, F5 starts debugging the old version of the app
- RelativeLayout and Frame are still not implemented in MAUI
- Label in iOS is only one line high
- A FlexLayout in a StackLayout seems to have 0 height. A following Label is rendered over the FlexLayout on Windows - better in RC3, but the height is still too low
- Handlers are not cleaned up - there is a method DisconnectHandler, but [it is never called](https://github.com/dotnet/maui/issues/3604).
