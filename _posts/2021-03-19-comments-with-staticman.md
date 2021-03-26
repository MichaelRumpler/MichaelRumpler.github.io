---
title: Comments with Staticman
date: 2021-03-19
toc: true
toc_sticky: true
---

The biggest problem of the blog by far were the comments. 

In theory Staticman is great. The users don't have to register. You have complete control over the HTML of your comments. The comments will be automatically committed to your GitHub repository. Each comment in its own file. So you can easily manage them.

In practice though Eduardo Bouças (the original developer) stopped working on Staticman. Others took over, but Eduardo needs to review and confirm those changes before they can be merged. I saw PRs which were not reviewed in two years and then closed again because the contributor lost interest and was not willing to solve merge conflicts anymore.

So Staticman is not perfect, but it's still the best option I found.

My information comes from different blog posts listed at the end of this article and some [GitHub issues of Staticman](https://github.com/eduardoboucas/staticman/issues). Apparently everybody who starts a new blog needs some content and describes their experiences. I won't just repeat that here, but as there was no one blog post to rule them all I'll describe the biggest problems here.

## Concept

Staticman works like this:

1. your app posts a new comment to Staticman
2. Staticman authenticates with GitHub and either creates a PR or merges the comment to your repo right away
3. when the comment has been merged, GitHub will re-create the HTML and the comment will be shown

Until 2018 there was one public Staticman instance which handled comments for all blogs. But as it became more popular, the public instance could not run in a free tier anymore and this stopped working.
Now you need to host your own Staticman instance. This was something I wanted to prevent, but it looks like there is no other way anymore.

## Many different services

Staticman is a Node.js app. They recommend to run it on [Heroku](https://www.heroku.com/).

You also need spam protection or your blog will be flooded with spam comments. So you also need to register for [reCAPTCHA](https://www.google.com/recaptcha/about/).

If you want email notifications - and who doesn't? - then you also need an account at [Mailgun](https://signup.mailgun.com/new/signup).

These services are all free and configuration is straight forward. But still it's something you have to do and what can go wrong.

## Configuring Staticman

Lets start with Staticman. As I wrote above, there are some people working on it, but the PRs take ages until they are merged in - if at all. As I ran into a problem where a PR existed but was not merged I ended up forking [eduardoboucas/staticman](https://github.com/eduardoboucas/staticman). You don't have to do that, but if there is any trouble, it is better to be able to change the Staticman code yourself.

Either way, you need to run the Node.js app somewhere. Staticman recommends Heroku and that's also what I used.
Go to [heroku.com](https://www.heroku.com/) and sign up for a free account. Then click [this link](https://heroku.com/deploy?template=https://github.com/eduardoboucas/staticman/tree/master) to deploy a new application with Staticman as template. If you forked Staticman, you can connect Heroku to your github repo on the _Deploy_ page.

Staticman needs a RSA key to encrypt/decrypt some values. Depending on your OS you can create a RSA key with either `ssh-keygen` or `openssl genrsa`. Don't use a passphrase.
When you have that, then open the _Settings_ page in your Heroku Dashboard and click _Reveal Config Vars_. Add the variable `RSA_PRIVATE_KEY` and set the value to the private RSA key without newlines.
Keep that tab open, we will need to add more variables.

Unfortunately the [Staticman docs](https://staticman.net/docs/getting-started.html) are outdated and not very exhaustive. What took me a few days and [much help from Vincent Tam](https://github.com/eduardoboucas/staticman/issues/406) is to set up the authentication between Staticman and GitHub.

The docs list three _options_ how this can be done, but they don't mention that you **have** to use [option 1](https://staticman.net/docs/getting-started.html#option-1-authenticate-as-a-github-application) with Staticman v3 and [option 2](https://staticman.net/docs/getting-started.html#option-12-authenticate-to-github-using-a-personal-access-token-on-a-bot) with v2. When v3 was created, they broke the githubToken authentication and it was never fixed. [Option 3](option-3-authenticate-to-github-using-a-personal-access-token-on-your-main-account) is not recommended, but it should work with v2 too. V1 is deprecated and should not be used anymore.

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

## reCAPTCHA

Next you need reCAPTCHA. Go ahead and [register here](https://www.google.com/recaptcha/admin). I did this in 2018 and registered for v2. TBH I don't know if v3 or Enterprise also work. I didn't try myself and couldn't find anybody confirming that. However, after you registered you get a _Site key_ and a _Secret_. The Secret must be [encrypted](https://staticman.net/docs/encryption). 

Both have to inserted in the staticman.yml

~~~yml
  reCaptcha:
    enabled: true
    siteKey: "yourSitekey"
    secret: "yourEncryptedSecret"
~~~

And if you use Minimal Mistakes they also need to go to _config.yml

~~~yml
reCaptcha:
  siteKey                : "yourSitekey"
  secret                 : "yourEncryptedSecret"
~~~

## Mailgun

Mailgun can be used to notify your users of new comments via email. By default Minimal Mistakes notifies everybody who commented on the same blog post. I changed that in order that you can send an answer to a previous comment and only those receive emails who answered to the same comment.

Registering for Mailgun is quite complicated, but their docs are very good. Just start [here](https://signup.mailgun.com/new/signup). You need to provide your credit card info, but they will not charge anything. One problem I had (and nobody documented) was that you can choose whether you want to create your mail domain in the US or EU. As I am from Austria I chose EU and that didn't work. By default Staticman only works with the US domain and you can't change the region later.

There has been a [PR](https://github.com/eduardoboucas/staticman/pull/275/files) in 2019 which enabled you to configure the API URL, but it was not merged. Fortunately it was pretty easy to make those changes in my own fork so that I could configure the `apiHost` in my staticman.yml file.

I now have these settings for Mailgun in my staticman.yml:

~~~yml
  notifications:
    # Enable notifications
    enabled: true

    # (!) ENCRYPTED
    # Mailgun API key
    apiKey: "yourEncryptedMailgunApiKey"

    # (!) ENCRYPTED
    # Mailgun domain (encrypted)
    domain: "yourEncryptedMailgunDomain"

    # By default staticman can only send to the US mailGun API.
    # With the PR below, it can also use the EU domain.
    # See https://github.com/eduardoboucas/staticman/pull/275/files
    apiHost: "api.eu.mailgun.net"

    # emails will be sent from this address
    fromAddress: "Michaels Blog <noreply@mg.mrumpler.at>"
~~~

## Threaded comments

I want to be able to reply to previous comments. By default, this is not possible in Minimal Mistakes. You can only send comments to the whole blog post. But [Michael Rose](https://mademistakes.com/articles/improving-jekyll-static-comments/) did this for his own blog and [Gabriel Luci](https://www.gabescode.com/staticman/2019/01/04/staticman-comments-for-jekyll.html#per-thread-notifications) built on that. Although that is quite a lot of manual work, their description is very good. So I won't repeat it here.

After I did that, my comments all had an id which I could link to. As I didn't like the standard email Staticman sends I changed that in my Staticman fork in [lib/Notification.js](https://github.com/MichaelRumpler/staticman/blob/master/lib/Notification.js#L14-L19). But unfortunately that function did not get the id of the new comment, so I also had to provide that in [lib/Staticman.js](https://github.com/MichaelRumpler/staticman/blob/master/lib/Staticman.js#L508).
My email notifications now don't contain a strange greeting ("Dear human") anymore. Instead they list the name of the person who sent the new comment, the message and a direct link to the new comment.

## Other changes

A few days after my blog went online (and I didn't promote it in any way) I already had my first spam message. Apparently reCAPTCHA is not enough. I found [this](https://spinningnumbers.org/a/staticman-heroku.html#appendix--fighting-spam) about spam protection.

It basically changes the submit button to a normal button and disables it. On the reCAPTCHA add a data-callback attribute - both in comments.html:

~~~html
  {% if site.reCaptcha.siteKey %}
    <div class="form-group">
      <div class="g-recaptcha"
           data-sitekey="{{ site.reCaptcha.siteKey }}"
           data-callback="verifyCaptcha"></div>
    </div>
  {% endif %}
  <div class="form-group">
    <button type="button" disabled="disabled" id="comment-form-submit" ...
  </div>
~~~

When the page loads, the button will be disabled and a spam bot won't be able to submit. Only when the reCAPTCHA is checked, it executes the verifyCaptcha function. Add it to some .js file:

~~~js
var verifyCaptcha = function(response) {
    if(response.length == 0) {
    } else {
        var _el=$('#comment-form-submit');
        _el.removeAttr("disabled");
        _el.addClass('button-primary dark-blue-bg');
        _el.attr('aria-disabled', 'false');
        _el.attr('type', 'submit');
    }
};
~~~

This changes the submit button back to what it should be.

I'll see if I still get some spams. If Yes, then I have to look into Akismet too. This also does spam prevention, but as I understood it, it is still in preview in Staticman and does not really work. [PRs](https://github.com/eduardoboucas/staticman/pull/372) fixing it have not been merged.

## Links

- [Staticman](https://staticman.net/)
- [Staticman issues on GitHub](https://github.com/eduardoboucas/staticman/issues)
- [Willy McAllister about Staticman v2](https://spinningnumbers.org/a/staticman-heroku.html)
- [Travis Downs about Staticman v2](https://travisdowns.github.io/blog/2020/02/05/now-with-comments.html)
- [Vincent Tam about Staticman v3](https://github.com/pacollins/hugo-future-imperfect-slim/wiki/staticman.yml)
- [Jan Hajek about Staticman v3](https://hajekj.net/2020/04/15/staticman-setup-in-app-service/)
- [Michael Rose: Improving static comments](https://mademistakes.com/articles/improving-jekyll-static-comments/#add-support-for-threaded-comments)
- [Gabriel Luci: Threaded comments](https://www.gabescode.com/staticman/2019/01/04/staticman-comments-for-jekyll.html#per-thread-notifications)