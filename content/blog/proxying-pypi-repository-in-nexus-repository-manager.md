---
title: "Proxying PyPI Repository in Nexus Repository Manager"
date: 2021-10-08
type: post
url: "/blog/2021/10/08/proxying-pypi-repository-in-nexus-repository-manager/"
tags: ["Nexus", "Pip", "Python"]
draft: false
---

{{< notice "info" >}}

**This post has some corrupted data. Will fix it soon!**

{{< /notice >}}

Here are the steps :

*   Create PyPI (Proxy)

Explanation :

1.  Click gear logo on the above view
2.  Select **pypi (proxy)**

*   Configure PyPI Proxy

Explanation :

1.  Give the repo a name
2.  Remote URL that this repo will be proxied to

then create repo by clicking the button below

And PyPI proxy has successfully created !

*   Create PyPI (group)

The purpose of this repository is to gather the available packages in each PyPI repos whatever its type ( group, hosted, and proxy ) into one centralized place.

Explanation :

1.  Give the repo a name
2.  Move the available repo from Available column to Members column
3.  Create repo

Voila!! It has been successfully created.

*   Configure pip

Although on this part we should have done all the required configuration on nexus, but we still have task to do. That is configuring pip by creating **pip.conf** in linux or **pip.ini** in windows. The steps should be like :

Create pip.conf as picture below :

Then fill the file with the configuration below :

Host can be customized based on your case but here I use a VM which runs Nexus with an IP Address 192.168.137.2 and running on port 8443. It will work either we use IP Address or FQDN. Don;t forget to save it.

Shortly afterwards, check the configuration as follows :

*   Try to fetch a package

Then we would see the previous package has been cached in our proxied repo. Check it out by following these steps below :

Well done!! we did it! 😀
