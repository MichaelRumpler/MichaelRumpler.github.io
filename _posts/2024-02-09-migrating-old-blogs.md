---
title: Migrating old blogs
date: 2024-02-09
toc: true
toc_sticky: true
---

This blog on GitHub Pages is not my first one. I went on some big vacations in the past where I wanted to stay in touch with friends back home.
I did that with my own travel blog.

In 2011 my girlfriend and I traveled for 2.5 months to New Zealand, Australia and Thailand. Back then I still worked as a ASP.NET developer and I had my own Windows web server running at home.
I wanted something which I could tweak myself, so I used [BlogEngine.NET](https://blogengine.io/). My web server already ran a MySQL server, so I stored the data there.

In 2015 we have been to Laos for four weeks. My web server has since died, so I needed a new blog. I was already a Microsoft partner with some free Azure credits. This time I knew that I would not tweak it myself anymore, so I just used [Project Nami](https://projectnami.org/) - a WordPress fork - and hosted it in Azure. The web site ran in Azure, data was stored in a Azure SQL database and the files were stored in Azure storage.

Fast forward to 2024 and my blog is on GitHub pages. There is no database. Everything is stored in files. Microsoft cancelled my Azure subscription (although I'm still a MS partner) so if I still want the data, then I need to copy it over now.

## Necessary data

My current blog runs in GitHub Pages with Jekyll and [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/). The folder structure has to be like this:

| What | Where |
| ---- | ------ |
| Posts | _posts/YYYY-MM-DD-`<slug>`.md |
| Comments | _data/comments/`<postslug>`/comment-`<timestamp>`.yml |
| Images | assets/images |

A `slug` is the part of the url which identifies the post. So it may only contain chars allowed in a url. No umlauts or special chars.

The post files must be in this format:

~~~ yaml
---
title: Migrating old blogs
author: Michael
date: 2024-02-09
comments_locked: true
classes: wide
categories:
  - Category1
  - Category2
tags:
  - Tag1
  - Tag2
---

content
...
~~~

Comments in this:

~~~ yaml
_id: 16c11f40-f423-11eb-8b12-cf36e7b53b77
_parent: 560665a0-f35d-11eb-ad21-aba37136ac90
message: "Some message\r\nwith multiple lines."
name: Michael
date: '2021-08-03T06:21:51.401Z'
~~~

I changed the comment `_id` and `_parent` to `Guid`s. By default MinimalMistakes uses integers. But this way it is easier to delete a unwanted (spam or offensive) comment without changing all following ids.

Translated to C# this means I need this data:

~~~ csharp
public record Post(int Id, string Author, DateTime Date, string Title, string Slug, string Content, string[] Categories, string[] Tags);
public record Comment(Guid Id, int PostID, string Author, DateTime Date, string Content, Guid ParentID);
~~~

So lets see where I can get this data from.

## BlogEngine.NET

I still have the backups of my old web server. So I could easily get the data from there. I don't have a MySQL server anymore and I don't want to install it. It turns out, I don't need to.

[RebaseData](https://www.rebasedata.com/convert-mysql-to-sqlite-online) runs a service, where you can convert a MySQL database to SQLite for free. Luckily they expect a .sql file with the output from `mysqldump`. And this is just what I used to backup my databases back in the day. So I didn't need the actual MySQL data files.

It should be mentioned, that BlogEngine.NET writes all its settings to the database. This includes the SMTP account and password it used to send email notifications. In my case it was all old accounts, so it didn't matter. But you may not want to send actual credentials to a online tool which you don't know.

BlogEngine.NET uses 27 tables to store data. We only need 5.

- be_categories
- be_posts
- be_postcategory
- be_posttag
- be_postcomment

If you remove everything else from the .sql file (especially the be_settings table) before you send it to RebaseData, then you also don't have any security concerns.

With these SQL statements we get out the data, that we need:

~~~ sql
select PostID, Author, DateCreated, Title, Slug, PostContent from be_posts where IsDeleted = '0'
select pc.PostID, c.CategoryName from be_postcategory pc, be_categories c where pc.CategoryID = c.CategoryID
select PostID, Tag from be_posttag

select PostCommentID, PostID, Author, CommentDate, Comment, ParentCommentID from be_postcomment
 where IsSpam = '0' and PostID in (select PostID from be_posts where IsDeleted = '0')
~~~

BlogEngine.NET uses `Guid`s for all ids. So when we read the data, we have to translate the PostID to `int`s.

The images were saved in `wwwroot\BlogEngine.Web\App_Data\files`. Not all of them are really needed, so I copied them to a source folder and let the migration process copy the files over to `assets/images`.

I read the old database in [BlogEngineReader](https://github.com/MichaelRumpler/MigrateBlog/blob/main/MigrateBlog/BlogEngineReader.cs).

## WordPress

Microsoft suspended my old Azure subscription. They claimed to have made it read only and told me to copy the data before it got deleted three months later. So I tried that. I couldn't access the sql data, because my IP address was not allowed and I couldn't add my current address because the db was readonly. Similar with the files. When I tried to copy the images, the Azure Storage Explorer got 401 and 409 errors. So I needed to open a support ticket to reopen my subscription. But the support ticket can only be created with an active subscription. They just didn't think that through.

I had to write a PM to [@AzureSupport](https://twitter.com/AzureSupport). They created a support ticket for me, support reopened my Azure subscription for 48 hours. Suddenly the errors were gone and I could copy the data without problems.

I found [an old tool](https://www.codeproject.com/Articles/26932/Convert-SQL-Server-DB-to-SQLite-DB) from Liron Levi which converts a MS SQL database to SQLite. It looked good at the first glance. Unfortunately I only found out too late, that the german umlauts have not been copied correctly. By the time I saw that, my Azure database was already gone. So I can't find out anymore what caused that. Be sure to check that when you follow my instructions.

The data that we need is in the tables

- wp_comments
- wp_posts
- wp_terms
- wp_term_relationships
- wp_users

The images were no problem. After the subscription had been reopened, the Azure Storage Explorer showed my files and I could download them.

Here you need these SQL statements to get the right data:

~~~ sql
select p.ID, u.user_login, post_date, post_title, post_name, post_content from wp_posts p, wp_users u
 where post_type = 'post' and post_status = 'publish' and p.post_author = u.ID
select object_id, name from wp_term_relationships r, wp_terms t
 where object_id in (select ID from wp_posts where post_type = 'post' and post_status = 'publish')
   and  term_taxonomy_id = t.term_id

select comment_ID, comment_post_ID, comment_author, comment_date, comment_content, comment_parent from wp_comments
~~~

WordPress uses `int`s for ids. So here we have to go the other way round and convert the comment ids from `int` to `Guid`.

The WordPress data is provided by [`WordPressReader`](https://github.com/MichaelRumpler/MigrateBlog/blob/main/MigrateBlog/WordPressReader.cs).

## Writing in the format of my blog

Now I have all the data in local SQLite files and the images also in local folders. Writing the data to the files is straight forward - or should be, if there were no special cases.

- image links
- video links
- german umlauts and other special chars
- dynamically change categories
- special chars in page titles
- emojis
- images which don't use the normal format

### Image links

Image references looked like this in BlogEngine.NET:

~~~ html
<a href="http://www.mrumpler.at/Reiseblog/image.axd?picture=DSCN3263.jpg"><img style="background-image: none; padding-left: 0px; padding-right: 0px; display: inline; padding-top: 0px; border-width: 0px;" title="DSCN3263" src="http://www.mrumpler.at/Reiseblog/image.axd?picture=DSCN3263_thumb.jpg" alt="DSCN3263" width="225" height="170" border="0" /></a>
~~~

And like this in WordPress:

~~~ html
<a href="http://content.mrumpler.at/images/2015/10/DSC_0037.jpg"><img title="DSC_0037" style="border-top: 0px; border-right: 0px; background-image: none; border-bottom: 0px; padding-top: 0px; padding-left: 0px; border-left: 0px; display: inline; padding-right: 0px" border="0" alt="DSC_0037" src="http://content.mrumpler.at/images/2015/10/DSC_0037_thumb.jpg" width="604" height="342"></a>
~~~

First I tried with a `Regex` to find and parse those, but then I found out, that the attributes can be in different order, so I changed it to good old `IndexBy` calls. A LOT of `IndexBy` calls!

The method `MinimalMistakesWriter.ReplaceImages` fixes all image links.
It finds all image references (`GetImageReferences`), parses them (`ParseImageRef`), copies the image files to `/assets/images/yyyy/MM` and changes the old image reference to the new.
This way only those image files are in the new folder, which are still used.

The new links look like this:

~~~ html
<a href="/assets/images/2015/11/schlafwagen.jpg"><img src="/assets/images/2015/11/schlafwagen_thumb.jpg" width="504" height="629" alt="schlafwagen" border="0" /></a>
~~~

MinimalMistakes automatically picks them up and shows them in a gallery when you click on the thumbnails.

### Video links

Video links also changed. I didn't use any videos in 2015, but in BlogEngine.NET they looked like this:

~~~ html
<div id="scid:5737277B-5D6D-4f48-ABFC-DD9C333F4C5D:64e96401-691b-4924-9af5-8320a511ff23" class="wlWriterEditableSmartContent" style="margin: 0px; display: inline; float: none; padding: 0px;">
<div><object width="448" height="277"><param name="movie" value="http://www.youtube.com/v/lyaVEl-PiLo?hl=en&amp;hd=1" /></object></div>
</div>
~~~

MinimalMistakes has a built in video link. So I only need to parse the video id out of that huge snippet and replace it with

```liquid
{% raw %}{% include video id="XsxDH4HcOWA" provider="youtube" %}{% endraw %}
```

### German umlauts and other special chars

As I already mentioned above, in the WordPress db all the german umlauts were mangled. So I had to run a Replace on all post and comment content

~~~ csharp
    .Replace("Ã¤", "ä")
~~~

### Dynamically change categories

I had a category called "2015". But this was interpreted as integer by Jekyll which broke it. So I had to remove that. I also had the countries we had been to as tags which I wanted to have as category now.
Those changes are split in `BlogEngineReader.GetPosts`, `BlogEngineReader.GetPostCategories` and `MinimalMistakesWriter.WritePost`

Unfortunately those were all the changes, I could do automatically. The following edge cases had to be fixed manually.

### Special chars in page titles

Page titles with colons, parenthesis or which start with an &amp; were all allowed in the old blog systems, but do not work in Jekyll. Fortunately Jekyll prints a red error message when it tries to read the file, so you can easily find those.

I did not want to change the old database backups, so I changed the titles manually after the migration process ran.

Here are some examples which I had to change:

| Old title       | Problem     | Changes   |
|-----------------|-------------|-----------|
| "Chiang Rai: Wats, Wats, Wats" | Colon in YAML Front Matter broke Yekyll | Changed title to "Chiang Rai - Wats, Wats, Wats" |
| "Fraser Island - der letzte Tag (3. Tag)" | Couldn't find comments | Renamed the file to "Fraser-Island-der-letzte-Tag" |
| "&amp;UUml; Pak Ou zur&amp;uuml;ck nach Luang Prabang" | YAML Front Matter with a value starting with &amp; broke Jekyll | Changed title to "Über Pak Ou zurück nach Luang Prabang" |

Be careful when renaming a post file. As this is the same name as the folder name with the comments, the folder must be renamed too.

### Emojis

When we used emojis in our posts, the blog engines inserted them as images. These images were also loaded from the old image folder, so this does not work anymore. I replaced them with the normal emoji unicode character. You can insert those in Windows with `Windows`-`.`.

### Images which don't use the normal format

In the end I searched again over all files for the old image references and I found a few which were not formatted as the others and therefore not found. There were only two, so I changed them manually.

---

You can find the source of my migration project on [GitHub](https://github.com/MichaelRumpler/MigrateBlog).
