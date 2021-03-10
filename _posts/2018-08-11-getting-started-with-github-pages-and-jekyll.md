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

## Staticman

Staticman fulfils all these requirements. The comments will be automatically committed to your GitHub repository. Each comment in its own file. So you can easily manage them.

So the decision was made. It would be Staticman! But unfortunately Eduardo Bouças (the original developer) stopped working on it. Others took over, but Eduardo needs to review and confirm those changes before they can be merged. I saw PRs which were not reviewed in two years and then closed again because the contributor was not willing to solve merge conflicts anymore.

So Staticman is not perfect, but it's still the best option I found.

Staticman is a Node.js app. So it cannot run on GitHub pages, but needs something else. It works like this:

1. your app posts a new comment to Staticman
2. Staticman authenticates with GitHub and either creates a PR or merges the comment to your repo right away
3. when the comment has been merged, GitHub will re-create the HTML and the comment will be shown

Unfortunately the [Staticman docs](https://staticman.net/docs/getting-started.html) are outdated and not very exhaustive. What took me a few days and [much help from Vincent Tam](https://github.com/eduardoboucas/staticman/issues/406) is to set up the authentication between Staticman and GitHub.

The docs list three _options_ how this can be done, but they don't mention, that you **have** to use [option 1](https://staticman.net/docs/getting-started.html#option-1-authenticate-as-a-github-application) with Staticman v3 and [option 2](https://staticman.net/docs/getting-started.html#option-12-authenticate-to-github-using-a-personal-access-token-on-a-bot) with v2. When v3 was created, they broke the githubToken authentication and they never fixed it. [Option 3](option-3-authenticate-to-github-using-a-personal-access-token-on-your-main-account) is not recommended, but it should work with v2 too. V1 is deprecated and should not be used anymore.

What all have in common is that you need somewhere to host the Node.js app. Staticman recommends Heroku, but [Jan Hajek also managed with Azure](https://hajekj.net/2020/04/15/staticman-setup-in-app-service/).

I went with Heroku. That's very easy. You just go to [heroku.com](https://www.heroku.com/) and sign up for a free account. Then click [this link](https://heroku.com/deploy?template=https://github.com/eduardoboucas/staticman/tree/master) to deploy a new application with Staticman as template.

When this is finished, open the settings of your app and click Reveal Config Vars. Add the variable `RSA_PRIVATE_KEY`. For the value you need to create a RSA key. How you do that depends on your OS. It's either `ssh-keygen` or `openssl genrsa`. Copy the private key to the value of your config var. I also removed all newlines from the key value.

Keep that browser tab open, we'll need to define some other vars later.

### Staticman version 3

Version 3 uses a GitHub App to authenticate. This has the advantage, that you can set strict permissions for what the App (and thus Staticman) can do.

Go to your [account settings / Developer Settings on GitHub](https://github.com/settings/apps) and create a New GitHub App. Most of the values can remain the default. You just have to change:

| GitHub App Name | anything you want |
| Homepage URL | the url of your web site |
| Webhook URL | https://\<heroku app name\>.herokuapp.com/v1/webhook |
| Permissions: Content | Read & Write |
| Permissions: Pull Requests | Read & Write |

After the App was created first note the App Id at the top. Go back to your Heroku tab and add the var `GITHUB_APP_ID` with the 6-digit App id from your GitHub App.

Back in your GitHub App settings scroll down and Generate a Private Key. This will download a .pem file. Open that file and copy its contents to the `GITHUB_PRIVATE_KEY` config var in Heroku.

Then on GitHub select Install App in the navigation and install it to your GitHub Pages repository.

In your _config.yml you need to specify these values:

    comments:
      provider: "staticman_v2"
      staticman:
        endpoint: "https://<your heroku appname>.herokuapp.com/v3/entry/github/"

The API of versions 2 and 3 are very similar. So you can set the provider to `"staticman_v2"`. The `endpoint` matters.

### Staticman version 2

Version 2 needed a GitHub account to perform the necessary actions. This can either be your own account ([option 3](option-3-authenticate-to-github-using-a-personal-access-token-on-your-main-account)) or some newly created account which you can create solely for Staticman comments ([option 2](https://staticman.net/docs/getting-started.html#option-12-authenticate-to-github-using-a-personal-access-token-on-a-bot)). The former is not recommended because in this case Staticman can do everything in all your repositories.

This is explained pretty good on [this blog](https://spinningnumbers.org/a/staticman-heroku.html#create-a-github-bot-account) and I won't repeat it here. You don't need to install the Heroku CLI. Just copy the personal access token of your new account and use the Heroku settings to add variable `GITHUB_TOKEN` there.

In your _config.yml you need to specify these values:

    comments:
      provider               : "staticman_v2"
      staticman:
        endpoint: "https://<your heroku appname>.herokuapp.com/v2/entry/"

There are many blogs about Staticman, but I didn't find anything which explains the differences between v2 and v3. So I listed that in more detail. If you have any more questions, then find some other links below.
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
- [Michael Rose - uses Staticman](https://mademistakes.com/articles/jekyll-static-comments/)
- [Staticman](https://staticman.net/)
- [Willy McAllister about Staticman v2](https://spinningnumbers.org/a/staticman-heroku.html)
- [Travis Downs about Staticman v2](https://travisdowns.github.io/blog/2020/02/05/now-with-comments.html)
- [Vincent Tam about Staticman v3](https://github.com/pacollins/hugo-future-imperfect-slim/wiki/staticman.yml)
- [Jan Hajek about Staticman v3](https://hajekj.net/2020/04/15/staticman-setup-in-app-service/)
- [Staticman issues on GitHub](https://github.com/eduardoboucas/staticman/issues)
- [Add support for threaded comments](https://mademistakes.com/articles/improving-jekyll-static-comments/#add-support-for-threaded-comments)