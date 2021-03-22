---
title: Getting started with GitHub Pages and Jekyll
date: 2018-08-11
classes: wide
---

[GitHub Pages](https://pages.github.com/) host your website for free. All you need to do is commit the
files in a special repository. They even create a SSL certificate automatically and for free.
Although you can simply commit all the .html, .css and .js files of your old site, the real
power comes to view when you use Jekyll. This is also used by GitHub Pages by default. You
don't have to do anything to enable it.

Jekyll is a static website generator. You can write your content in markdown which is much easier than html.
The whole page is generated with a powerful templating system which is also well suited for blogs.

If you want to get started with those technologies, you first have to read through a bunch of web pages.
The most important being the official docs of
[GitHub Pages](https://pages.github.com/) and [Jekyll](https://jekyllrb.com/docs/home/).
Then I found some introductions by [Karl Broman](https://kbroman.org/simple_site/) and
[Jonathan McGlone](http://jmcglone.com/guides/github-pages/).

These pages explain how everything works. I created the first version of my website directly in GitHub,
but next I wanted to clone the repo, edit and test the files locally before I commit anything.
Here the problems started. I am a Windows guy, but Jekyll is not officially supported on Windows.
It is written in Ruby. So appart from Jekyll itself you also have to install Ruby, some gems and 
a bundler. MacOS has most of that stuff already installed (although it might be an old version), but
my Windows PC doesn't. And I also didn't want to install all that locally.

## Docker to the rescue!

If you have Windows 10 Professional or Enterprise, then you can install
[Docker CE](https://store.docker.com/editions/community/docker-ce-desktop-windows).
For Windows 10 Home proceed [further down](#windows-10-home).

The installation of Docker CE is simple. Just be sure, that you choose Linux containers and not
Windows containers. Otherwise you'll get an error later when running your container.

Then the search for a working Docker image for Jekyll started. There are many images available, but I needed
some time until I found one, which really works.
The official [Jekyll/Jekyll](https://hub.docker.com/r/jekyll/jekyll/) did not work for me.
I also tried several others but only [starefossen/github-pages](https://github.com/Starefossen/docker-github-pages)
worked out at last. As the call to start it is a bit complicated, I wrote a start_docker.bat file
and added the docker call to it:

    docker run -it --rm -p 4000:4000 -v D:\mydir.github.io:/usr/src/app starefossen/github-pages

| `docker run` | means it should start up a container |
| `-it` | runs it interactively so that I can stop it with ctrl-c |
| `--rm` | removes the container after I pressed ctrl-c |
| `-p 4000:4000` | maps port 4000 of the virtual container to port 4000 of my machine |
| `-v D:\mydir.github.io:/usr/src/app` | makes the folder 'D:\mydir.github.io' available as '/usr/src/app' in the VM |
| `starefossen/github-pages` | is the image name the container should be based on |

With that .bat file in place, I can just double click it and my container with Jekyll will be started.
Jekyll will convert the contents of the given folder to its output folder _site and start a web server for this
directory. You can see the result in your browser with [http://localhost:4000](http://localhost:4000).
If you change any file in *mydir*.github.io, Jekyll will automatically re-generate the html and you can
simply refresh your browser.


## Windows 10 Home

If your machine runs Windows 10 Home, then you can't use Docker. You have to install everything locally.
Unfortunately Jekyll is not officially supported on Windows, but there is still a 
[installation guide](https://jekyllrb.com/docs/windows) which helps with the most important issues.


## Themes

The docs I linked at the beginning explain how Jekyll works and how you can write your .html, .md and .yml
files so that some html is generated. But you don't need to do all that on your own.
There are hundreds of Jekyll themes available on the internet. 
The most important pages where you can choose a theme you like are
- [themes.jekyllrc.org](http://themes.jekyllrc.org/),
- [jekyllthemes.org](http://jekyllthemes.org/) and
- [jekyllthemes.io](https://jekyllthemes.io).

Just browse through them and see what you like. Some are simply for one page, others are for complete blogs.

I went for [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes).
This theme has many different [layouts](https://mmistakes.github.io/minimal-mistakes/docs/layouts/) built in
which you can use and configure through simple [Front Matter](https://jekyllrb.com/docs/front-matter/).


## Comments

My readers should also have the ability to comment on blog posts of course.
But as Jekyll is a **static** site generator, dynamic things like comments need a little more work.

The easiest and from Jekyll recommended approach is to use an external service for comments.
[Disqus](https://disqus.com/admin/install/platforms/jekyll/) only needs some JavaScript code
on your site and then they will show all comments for the url where that JS is shown.
The problem is, that you have zero control over what they do.
They create the html for the comments and they also store all the data. And in the free version
they also add ads to your site. These are too many reasons against using them.

Luckily Google shows several alternatives.

- [60devs](https://60devs.com/adding-comments-to-your-jekyll-blog.html) uses Just Comments,
- [Savas Labs](https://savaslabs.com/2016/04/20/squabble-comments.html) create their own backend,
- [Dave Compton](https://dc25.github.io/myBlog/2017/06/24/using-github-comments-in-a-jekyll-blog.html) uses GitHub comments
- and [Phil Haack](https://haacked.com/archive/2018/06/24/comments-for-jekyll-blogs/) uses an Azure Function to create a PR with the comment.

All fair and square, but I wanted something where I own the data, I don't need to run an additional service,
the users don't need to register and the comments will be published automatically.

Staticman fulfils all these requirements. The comments will be automatically committed to your GitHub repository. Each comment in its own file. So you can easily manage them.

Unfortunately this was so much work with many pitfalls that it justifies [its own blog post about the Staticman installation](https://www.mrumpler.at/comments-with-staticman/).


## Links

### Getting Started

- [GitHub Pages](https://pages.github.com/)
- [Jekyll docs](https://jekyllrb.com/docs/home/)
- [Intro by Karl Broman](https://kbroman.org/simple_site/)
- [Intro by Jonathan McGlone](http://jmcglone.com/guides/github-pages/)

### Quick References

- [Jekyll cheatsheet](https://devhints.io/jekyll)
- [kramdown Quick Reference](https://kramdown.gettalong.org/quickref.html)

### Themes

- [jekyllthemes.org](http://jekyllthemes.org/)
- [jekyllthemes.io](https://jekyllthemes.io)
- [themes.jekyllrc.org](http://themes.jekyllrc.org/)

### Comments

- [60devs - uses Just Comments](https://60devs.com/adding-comments-to-your-jekyll-blog.html)
- [Savas Labs - create own backend](https://savaslabs.com/2016/04/20/squabble-comments.html)
- [Phil Haacked - uses Azure Function to create PR](https://haacked.com/archive/2018/06/24/comments-for-jekyll-blogs/)
- [Dave Compton - GitHub comments](https://dc25.github.io/myBlog/2017/06/24/using-github-comments-in-a-jekyll-blog.html)
- [Staticman](https://staticman.net/)
