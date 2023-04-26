---
title: BtlsException on Synology
date: 2021-04-14
classes: wide
---

## Update from April 2023:

Two years later there is a Mono update with these release notes:

{% capture notice-text %}
Version 6.12.0.182-20
1. Update mono to version 6.12.0.182.
2. Fix BTLS for aarch64 on DSM 6
3. Add script to update ca certificates.
{% endcapture %}

<div class="notice--info">
  {{ notice-text | markdownify }}
</div>

This is exactly what I was waiting for. And sure enough after installing this version Sonarr and Radarr still work and the warning about the outdated Mono is gone.

This is the old blog post from April 2021:

---

### MonoBtlsException: POINT_IS_NOT_ON_CURVE

I run Sonarr on my Synology NAS. This worked quite well until about three months ago. All of a sudden Sonarr couldn't check the indexers anymore. After some search I found this exception in the logs (System / Log Files):

~~~
21-1-8 16:14:42.6|Debug|NewznabCapabilitiesProvider|
    Failed to get newznab api capabilities from https://api.nzbgeek.info

[v2.0.0.5344] System.Net.WebException: Error: 
    SecureChannelFailure (Authentication failed, see inner exception.):
     'https://api.nzbgeek.info/api?t=caps&apikey=(removed)
 ---> System.Net.WebException: Error: SecureChannelFailure (Authentication failed, see inner exception.) ---> System.Security.Authentication.AuthenticationException: Authentication failed, see inner exception.
 ---> Mono.Btls.MonoBtlsException: Ssl error:0f000078:
     elliptic curve routines:OPENSSL_internal:POINT_IS_NOT_ON_CURVE
  at /spksrc/spk/mono/work-aarch64-6.1/mono-5.20.1.34/external/boringssl/crypto/ec/ec.c:835
~~~

I opened an issue in the [Sonarr forum](https://forums.sonarr.tv/t/webexception-error-securechannelfailure/27432) but nobody answered. So I digged a bit more myself and finally found a [similar issue](https://github.com/Jackett/Jackett/issues/9701). They also got this **elliptic curve routines:OPENSSL_internal:POINT_IS_NOT_ON_CURVE**. According to them the newer BoringSSL version (which is used by Mono) has this problem on ARM64.

So I installed an old Mono version with these steps:

1. I connected to my NAS via SSH
1. edit /var/packages/mono/INFO
1. change version from “5.20.1.34” to “0.5.20.1”
1. note arch
1. browse to [https://synocommunity.com/package/mono](https://synocommunity.com/package/mono), find release 5.8.0.108-11 and copy the link to your architecture.
1. in the shell do `wget <link to Mono on your architecture>`
1. `synopkg install <downloaded .spk file>`
1. restart your NAS
1. check if Mono is running after the restart

That version 5.8.0.108 is from 2018, but everything seems to work again. Maybe a newer version also works, but I didn’t want to check each and every version inbetween.


### MonoBtlsException: CERTIFICATE_VERIFY_FAILED

A few days ago it stopped working again. The exception was very similar, but not exactly the same:

~~~
21-4-14 08:56:50.0|Error|TaskExtensions|Task Error

[v3.0.5.1144] System.Net.WebException: Error: 
    TrustFailure (One or more errors occurred.):
     'https://services.sonarr.tv/v1/update/master?version=3.0.5.1144&os=linux&runtimeVer=5.8.0.108&active=true'
---> System.Net.WebException: Error: TrustFailure (One or more errors occurred.) ---> System.AggregateException: One or more errors occurred. ---> System.Security.Authentication.AuthenticationException: A call to SSPI failed, see inner exception. 
---> Mono.Btls.MonoBtlsException: Ssl error:1000007d:
    SSL routines:OPENSSL_internal:CERTIFICATE_VERIFY_FAILED
  at /spksrc/spk/mono/work-aarch64-6.1/mono-5.8.0.108/external/boringssl/ssl/handshake_client.c:1132
~~~

The same exception also came when querying the indexer on a totally different domain.

So instead of `elliptic curve routines:OPENSSL_internal:POINT_IS_NOT_ON_CURVE` I now got **SSL routines:OPENSSL_internal:CERTIFICATE_VERIFY_FAILED**.

I found the solution in [another Sonarr forum posting](https://forums.sonarr.tv/t/sonarr-on-synology-unable-to-connect-to-indexer-error-securechannelfailure/27572/4?u=bussibaer50). This time it seemed like the root certificate of "DigiCert Baltimore Root" (the root of Cloudflare) was not valid anymore.

You can validate that it really is a Mono problem by doing the following in a shell on your NAS:

~~~shell
$ cd /var/packages/mono/target/bin
$ ./csharp -e 'new System.Net.WebClient().DownloadString("https://services.sonarr.tv")'
~~~

This should also throw the same exception which you found in the logs.

It turns out that BoringSSL maintains its own list of root SSL certificates. I'd really be interested why. The Synology box itself does have a current CA list. 
You can update all certificates which Mono uses to those of the Synology system with:

~~~shell
$ sudo ./cert-sync /etc/ssl/certs/ca-certificates.crt
~~~

Then you can try the csharp command from above again and this time it should work.

Unfortunatly forums.sonarr.tv closes any issues automatically after two months so I cannot add this info to the thread from there. But I'll keep it here in the hope that somebody finds it useful.

According to [hgy59](https://github.com/SynoCommunity/spksrc/issues/3946#issuecomment-612418403) the `POINT_IS_NOT_ON_CURVE` problem has already been fixed in the source of BoringSSL in March 2020. But until this gets picked up by Mono, released and then rolled out to Synology will take time. Lets hope that Mono can be normally updated to the latest version at some point in time.