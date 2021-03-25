---
title: The History of my Personal Website
date: 2018-08-10
toc: true
toc_sticky: true
---

## 2000

I started my first website around 2000. Back then clouds were something in the sky and I was a sysadmin and liked to play with servers
and software. I already had internet over cable (no dialup via modem anymore), so my PC at home was 100% online (well, not 100%, but close enough).
So I simply installed IIS and kept it running.

In the beginning the web site consisted only of some static HTML files. I managed a kart championship at the time and published the results on the
web. But sooner or later I got sick of the registrations for the races, so I added a `form` to my page backed by a **MySql database**. Static html didn't
suffice anymore, so I used **ASP** to make that a bit more dynamic. Somehow I chose **Perl** as programming language. Don't ask why, I forgot it.

The web page grew. Next were the results of a squash league and in 2002 I wrote my own photo album. That was completely dynamic. There were events
with pictures and those pictures could have a description. But the best was, that I could also configure (manually of course), who was shown on which
picture. The users could search for persons and would then see all pictures with those persons. It could even search for multiple persons and nicknames
e.g. "Michael and Vero". Today this is no big deal, but back in 2002 nobody could do that and I was very proud of it.

In 2005 I started to work as a frontend developer with C# and ASP.NET. Since then I wanted to get rid of my old Perl/ASP/MySql stuff, but it was never
important enough to really do it.

## 2011

My web server ran and ran and I didn't change anything at all until 2011. Back then my girlfriend and I went on a 2.5 months vacation visiting New Zealand,
Australia and Thailand. We wanted to stay in touch with our friends somehow and so I started a travel blog.
There were already many open source products freely available. I just needed something, which got along with my Windows PC and MySql database.
And if the thing is already open source, then I also wanted something which I could easily maintain on my own, so it should be written in C#.
I chose [BlogEngine.NET](http://www.dotnetblogengine.net/).

We had a great vacation and used the blog as a diary. Everything we did ended up in the blog and our friends back home commented on it. This way we kept
in touch without the need of phone or email.

I was now a ASP.NET developer for six years and knew quite a lot. So I thought about starting a developer blog too, but I never did it.
Again it was something like "it would be nice, but it would be effort".

A few years later my web server died. It was running for more than 10 years 24/7 by then, so it did deserve a peaceful place in heaven.

By now, *Cloud* did mean something else. So an own server running at home was out of the question anymore. But did I migrate any of the stuff from
the old server? Was it worth the effort? My kart championship and squash league ceaced to exist long ago. I was the only one really using my photo album
and the blog of a vacation years ago was also not very interesting to others.

Yes, I was a freelance developer and as such I should have my own web site, but I was not looking for new clients, so I didn't really need it.
The designer I worked with also mocked me because my web site looked like the 90s. So I'd also have had to think of a new design.
And I'm really bad at that. I hate it. So I didn't do it.

## 2015

In 2014 [Xamarin.Forms](https://docs.microsoft.com/en-us/xamarin/xamarin-forms/) was released and I started my experience as mobile developer
with version 1.0 of that framework. Soon I saw that it was still lacking some essential features and I was also not happy with a framework for
C# developers which copied an API from iOS. So I wrote my own touch gesture framework [MR.Gestures](https://www.mrgestures.com/)
and released it in early 2015. Now I did need a web page again. I started with a simple ASP.NET MVC page. While I added content I realized, that
it was only a static page, but I already used the MVC template so I sticked with it. The page was hosted in Azure.
As it was a commercial site, I couldn't use the Azure credits I got as Microsoft partner, so I paid around €8,- per month for it.

Later in 2015 the next big vacation came along. We have been in Laos for four weeks. The travel blog was great during our last journey,
so we wanted that again.
This time my choice fell on [Project Nami](https://projectnami.org/how-did-we-get-here/). Nami is essentially a Wordpress installation with the data
in MS SQL. Both the web site and the SQL Server are hosted in Azure.
With the help of the [Windows Azure Storage for WordPress](https://wordpress.org/plugins/windows-azure-storage/) plugin, the media can also be
hosted in Azure. And all that is for me to learn Azure of course, so I could use my MS Partner Azure credits.

More than a year after the vacation I got an email from MS saying that the PHP version my blog relied on would not be supported anymore.
I didn't need the blog at that time, so I did not update it and soon I got a HTTP 500 error back. My blog had stopped working again.

## 2018

Fast forward to 2018. Chrome states that http:// websites are *Not Secure*. It is long overdue that I install a SSL certificate on 
[http://www.mrgestures.com/](http://www.mrgestures.com/). Luckily, there's Let's Encrypt now and SSL certs are free.
Scott Hanselman wrote [a blog post](https://www.hanselman.com/blog/SecuringAnAzureAppServiceWebsiteUnderSSLInMinutesWithLetsEncrypt.aspx) on
how to install such a cert on Azure websites, but although it has "in minutes" in the title the procedure seems very complicated.

I ended up using GitHub Pages for [mrgestures.com](https://www.mrgestures.com/). 
With GitHub Pages hosting is free and they also create a SSL certificate with Let's Encrypt automatically.
That was very easy because mrgestures.com is only one long page without any dynamic functionality on it.

And when I was on it I also created a new and shiny website for [mrumpler.at](https://www.mrumpler.at/).
GitHub Pages use [Jekyll](https://jekyllrb.com/) as a static site generator.
So I can write my pages in markdown and they get converted to HTML automatically.
It also has blogging functionality built in, so I can finally get my developers blog running.
The problem was, that I also wanted to have comments in my blog.

I wanted to use [Staticman](https://staticman.net/) for the comments and when I tried this the first time, Staticman just ceased to work. 
Until 2018 [Eduardo Bouças](https://github.com/eduardoboucas) ran one public instance of Staticman which everybody could use.
But unfortunately this instance got more and more traffic until it was over its limit of the free tier he had somewhere.
This was exactly the time when I first tried it - and of course I failed.
There were no workarounds at that time and once again my ambitions to run my own website faded away.

## 2021

It took until 2021 until I tried again because it was just not important enough for me.
Now there was a way to get Staticman running and [mrumpler.at](https://www.mrumpler.at) became alive again at last.

Now that the website is up and the blog works, I will also import the data from my old travel blogs here.
But this is not important so it will happen when I feel like doing it - which could take some time.
Importing those old blogs will get more technical so I'll write separate blog posts about the migrations.
