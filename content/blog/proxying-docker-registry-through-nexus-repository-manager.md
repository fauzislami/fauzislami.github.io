---
title: "Proxying Docker Registry Through Nexus Repository Manager"
date: 2021-10-14
type: post
url: "/blog/2021/10/14/proxying-docker-registry-through-nexus-repository-manager/"
tags: ["Docker", "Nexus"]
draft: false
---

{{< notice "info" >}}

**This post has some corrupted data. Will fix it soon!**

{{< /notice >}}

In this post we’ve learned how to proxy PyPI and make it cached in our local repo, but for this time I want to share similar thing but it’s for docker image. Here we go!

*   Make docker group and docker proxy

We can see the configurations below :

Explanation :

1.  Name of proxy repository
2.  Allow anonymous user for pulling the image
3.  Remote registry. **[https://registry-1.docker.io](https://registry-1.docker.io)** is docker hub remote storage URL.
4.  Use docker hub as docker index

Explanation :

1.  Name of group repository
2.  5000 is port number for pulling the image through nexus registry
3.  Allow anonymous user for pulling the image.
4.  Set **docker-proxy** ( proxied docker registry we’ve created before ) to be a member of this group repo

*   Tell docker to consider the image registry we’ve created as registry mirrors to cache the image and as insecure registry, so there’s no need to verify TLS ( _**not recommended for production env**_ ) by creating new file called daemon.json in /etc/docker directory

Restart docker service afterwards. Then verify by executing docker info

*   Try to pull an image

And it works like a charm !
