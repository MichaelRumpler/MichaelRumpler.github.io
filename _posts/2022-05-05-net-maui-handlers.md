---
title: Custom .NET MAUI elements with handlers
date: 2022-05-05
toc: true
toc_sticky: true
---

I assume, you already know Xamarin.Forms and how to add a custom control there. This post is really just a summary of what changed and why.

## Element

First you need an element which you want to put in your layouts. MAUI calls it a virtual view, because it is only an abstraction of the platform view. If you want to create something completely new, then you should inherit from `Microsoft.Maui.Controls.View`. But most of the time you will enhance an existing control, so you inherit from the respective control in `Microsoft.Maui.Controls`. Add your properties and shared code there just like in Xamarin.Forms. This did not change.

E.g.:

    public partial class YourBoxView : Microsoft.Maui.Controls.BoxView
    {
        public static readonly BindableProperty DownCommandProperty
          = BindableProperty.Create(nameof(DownCommand), typeof(ICommand), typeof(YourBoxView), null);

        public ICommand DownCommand
        {
            get => (ICommand)GetValue(GestureHandler.DownCommandProperty);
            set => SetValue(GestureHandler.DownCommandProperty, value);
        }

If you can handle everything in the shared code, then you can do that there and you're already done.

## Platform code

If you need some platform dependent code, then you have a few options.

1. All platforms in one file with #if _platform_
2. .cs files in Platforms/_platform_ folder
3. ._platform_.cs files

2 and 3 don't work out of the box. All files are compiled for all platforms. IMHO that's a bug, but as they even wrote [docs](https://docs.microsoft.com/en-us/dotnet/maui/platform-integration/configure-multi-targeting) about it, maybe they keep it like that.

However, I added these lines to my .csproj file:

    <ItemGroup Condition="$(TargetFramework.StartsWith('net6.0-android')) != true">
        <Compile Remove="**\**\*.Android.cs" />
        <Compile Remove="**\Android\**\*.cs" />
    </ItemGroup>

    <ItemGroup Condition="$(TargetFramework.StartsWith('net6.0-ios')) != true AND $(TargetFramework.StartsWith('net6.0-maccatalyst')) != true">
        <Compile Remove="**\**\*.iOS.cs" />
        <Compile Remove="**\iOS\**\*.cs" />
    </ItemGroup>

    <ItemGroup Condition="$(TargetFramework.Contains('-windows')) != true ">
        <Compile Remove="**\*.Windows.cs" />
        <Compile Remove="**\Windows\**\*.cs" />
    </ItemGroup>

    <ItemGroup Condition="$(TargetFramework.StartsWith('net6.0-'))">
        <Compile Remove="**\*.Standard.cs" />
    </ItemGroup>

    <ItemGroup>
        <None Include="**/*" Exclude="$(DefaultItemExcludes);$(DefaultExcludesInProjectFolder);$(Compile)" />
    </ItemGroup>

The first `ItemGroup` checks if the current `TargetFramework` is not `net6.0-android` and does not compile any files which end in `.Android.cs` or are in an `Android`folder.

The second and third do that for iOS, MacCatalyst and Windows respectively.

The forth `ItemGroup` only compiles `*.Standard.cs` files for `net6.0` without any platform. If you created a .NET MAUI App and no Class Library, then your project doesn't target pure net6.0 and you don't need this.

And the last one is a fix for VS so that the solution explorer still shows all the files which are only compiled on some platforms.

Now you're finally ready to write a handler.

## Handler

### Handler vs. Renderer

A handler is very similar as a renderer in XF. It synchronizes between the shared control which you put in your MAUI pages and the respective platform view. The changes were mostly done due to performance optimizations.

A renderer WAS A view on the respective platform. It inherited from `UIKit.UIView` or `Android.Views.View`. But that also meant, that you needed a view for every Layout. This is discouraged and slow on Android. Your view hierarchy should be as shallow as possible. Xamarin started to rewrite their renderers to so called Fast Renderers years ago, but never followed up for all their controls.

A handler does not inherit from the platform view anymore. It has a `CreatePlatformView()` method which creates and returns the view. This way MAUI can create layout elements only if they are really needed.

In the old renderer you also had to override the `OnElementPropertyChanged` method to react to property changes. In this method you switched by the `propertyName` and most of the time you just called other methods which changed the respective thing in the platform view.

The handler uses a `PropertyMapper` for this. This is a `Dictionary` of property names and actions which react to changes of just that property. The big switch is replaced by a `Dictionary` lookup and done within MAUI.

### Implementation

Again the best is to inherit from an existing handler in `Microsoft.Maui.Handlers`. If you want to implement a new control, then `ViewHandler<TVirtualView, TPlatformView>` is what you need. `TVirtualView` is your element and `TPlatformView` is the real view on the respective platform.

This also means that your handler has different base classes depending on the platform. As I explained above, there are a few ways how you can do that. Microsoft used different files for the different platforms and I did the same:

![Handler files](/assets/images/MAUI_handlers.png)

LabelHandler.cs is used on all platforms. It basically only holds your `Mapper`.

    public partial class LabelHandler : Microsoft.Maui.Handlers.LabelHandler
    {
        public static new PropertyMapper<IGestureAwareControl, IElementHandler> Mapper
            = new(Microsoft.Maui.Handlers.LabelHandler.Mapper)
            {
                [nameof(IGestureAwareControl.Down)] = MapDownChanged,
                [nameof(IGestureAwareControl.DownCommand)] = MapDownCommandChanged,
                [nameof(IGestureAwareControl.Up)] = MapUpChanged,
                [nameof(IGestureAwareControl.UpCommand)] = MapUpCommandChanged,
            };

        public LabelHandler() : base(Mapper) { }

        public LabelHandler(IPropertyMapper? mapper = null) : base(mapper ?? Mapper) { }
    }

Notice that this is a `partial class`. The other part comes from the respective platform files LabelHandler._platform_.cs.

The `PropertyMapper` is basically a `Dictionary` which maps the property names which can change in your element to a method which does something in the platform view to represent that change. `MapDownChanged`, `MapDownCommandChanged`, `MapUpChanged` and `MapUpCommandChanged` are all methods implemented in the other parts of this class.

## Wiring up

The Xamarin.Forms renderers used the `ExportRendererAttribute`. This had the problem, that XF needed to scan every dll on startup for any types which used that attribute. This was very slow and it got even slower for every reference which you added even if the dependency had nothing to do with Xamarin.Forms at all.

In MAUI you register handlers in the startup code of your app in `MauiProgram.CreateMauiApp()`. Add a call to `ConfigureMauiHandlers` there:

    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureMauiHandlers(handlers =>
            {
                handlers.AddHandler<YourBoxView, YourBoxViewHandler>();
            });

        return builder.Build();
    }

The framework will then know, that for the element `YourBoxView` it should use the handler `YourBoxViewHandler`.
