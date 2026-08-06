---
title: "Immutable Infrastructure, treating servers like “cattle”. Does it sound ridiculous ?"
date: 2022-02-06
type: post
url: "/blog/2022/02/06/immutable-infrastructure-treating-servers-like-cattle-does-it-sound-ridiculous/"
tags: ["IaC", "Infrastructure as Code"]
draft: false
---

{{< notice "info" >}}

**This post has some corrupted data. Will fix it soon!**

{{< /notice >}}

## Chattering

## Circle of Server’s Life

*   Initial provisioning & Basic Setup

*   Continuous Updates and Applying Changes (Configurations)

*   Decommissioning A Server

## What’s the problem ?

Okay I think it’s time to jump to the main problem before it’s going to be more and more long-winded tedious explanation 🥱

## Treat Servers Like Cattle, not Pets

I know it sounds ridiculous but it’s only an analogy to make it easier to understand. Why should we treat servers like cattle, instead of pets ? Let’s compare them !

*   Pets have a name, we care about them. They are unique and lovingly hand raised and cared for.
*   Cattle is replaceable, we have many of them. They are almost identical to one another

It drives to a conclusion, that’s most servers should be treated like cattle, not pets. Treating entire servers as a built artifact. So if we need to change something, build and run a new server then terminate the old one.

## The benefits of Immutable Infrastructure

After knowing how this approach works, we can get some benefits of it.

*   More consistency and reliability
*   More predictable deployment
*   Prevent configuration drift.

This means resulting less error-prone of deployment and reducing the chance of applying unexpected changes in particular servers **a.k.a** prevent configuration drift.

## Immutable Infra VS Mutable Infra

The picture above depicts how Immutable Infrastructure and Mutable Infrastructure are compared to each other.

*   **Mutable Infrastructure** will be repeatedly applying configuration to bring it into line with the latest specifications.

A deep dive into Mutable Infrastructure :

As we can see a common flow for this approach below, configuring server will be conducted after deployment process.

I know on this situation has no a big deal since only one server we’re going to manage. But wait until until you scroll down to the next picture.

What if we have many servers ? Should we manage them manually to each of them ?

We can use a tool for configuration management instead.

*   **Immutable Infrastructure** will be frequently destroying, rebuilding and running servers from the base image, 100% of the server’s elements are reset to a known state, without spending a ridiculous amount of time specifying and maintaining detailed configuration specifications.

A deep dive into Immutable Infrastructure :

From the picture below, it reminds us how container contains everything including _source code, system configurations,_ and _all other dependencies_ it needs to work during the runtime. Why ? Because container is also one of the implementation of Immutable Infrastructure approach. It also applies on how we can create custom VM images.

To make it easier to understand, here on the first picture below depicts whenever App/Config changes occurs, it will create new custom image then running the new instance with the latest expected changes.

Then the older instance will be decommissioned. So all of the traffic request will only served by the new instance.

## Pros and Cons

```
<td class="has-text-align-center" data-align="center">
  <strong>Immutable Infrastructure</strong>
</td>
```

```
<td class="has-text-align-center" data-align="center">
  <strong><em><span style="color:#ba0835" class="has-inline-color">Pros</span></em></strong>
</td>
```

```
<td class="has-text-align-center" data-align="center">
  <strong>Discrete versioning</strong>, means tracking and rollbacks are much easier.
</td>
```

```
<td class="has-text-align-center" data-align="center">
  <strong>Testing is easier</strong> to run because of the consistency in configurations between different servers.
</td>
```

```
<td class="has-text-align-center" data-align="center">
  <strong>Predictable</strong> <strong>state</strong> since the infrastructure is never modified in-place, it means reducing complexity.
</td>
```

```
<td class="has-text-align-center" data-align="center">
  <strong>Suitable for DevOps implementation</strong>, in addition to virtualization and cloud computing are powerful technology that supports agile development.
</td>
```

```
<td class="has-text-align-center" data-align="center">
  <strong><em><span style="color:#0b9870" class="has-inline-color">Cons</span></em></strong>
</td>
```

```
<td class="has-text-align-center" data-align="center">
  The infrastructure is completely <strong>unable to be modified in-place and need a complete overhaul</strong>. It will take time if we expect immediate changes. In the event of a <em>zero-day </em>vulnerability for example, all servers with the same configuration must receive a security update.
</td>
```

```
<td class="has-text-align-center" data-align="center">
  Improved agility and dynamism of immutable infrastructure can sometimes be <strong>misaligned with traditional IT security practices.</strong>
</td>
```

```
<td class="has-text-align-center" data-align="center">
  Overhead associated with copying <strong>array data </strong>from one location to another. Externalizing data instead of writing data to the local disk.
</td>
```

```
<td class="has-text-align-center" data-align="center">
</td>
```

```
<td class="has-text-align-center" data-align="center">
</td>
```

```
<td class="has-text-align-center" data-align="center">
</td>
```

## Packer Comes Into Play

**How Packer Works**

## It’s Time to Practice

The first thing before doing this practice, I want to elaborate a bit what will be done for this one. As we can see on the picture above, there are Packer, Ansible and Terraform. Packer is used to build the image while invoking Ansible as its provisioner to customize it. When the building and provisioning process are all set, Terraform will take control to deploy a VM using the image that previously built. For this moment I decide to use AWS as the environment.

**Let’s have a walkthrough**

*   **Packer**

This configuration below is Packer directives to define a source we’re going to build, which is AMI. It consists of required plugins section, source definition, builder block and provisioner block. In this point, we tell Packer to build an image with the specifications as written below and it will invoke Ansible to run a playbook which has purposes to install Nginx and configure Nginx. In the end, the Image will be stored as AMI.

_**N**_**_ote : AMI will be stored based on region we_ designate to.**

*   **Ansible**

Ansible will run the playbook to apply the necessary configurations once it’s invoked by Packer.

*   **Terraform**

Once the AMI is ready to use, Terraform will take control to create new instance using that AMI.

## Let’s Get The Job Done !

*   **Run Packer as the below picture**

See what happens when `packer build .` is being executed. Packer will instantiate a temporary instance and access it through SSH in order to apply all the expected states and wait until the process is done. It might take a few minutes to be ready btw. In the meantime, let’s have a cup of tea!

If we get the result like below, it looks good as expected.

Check out to AWS console and we’ll see an instance is already terminated. It was a created temporary instance during the last build.

And here it is! AMI is ready to use.

After feel pretty sure the AMI is ready, Terraform will take its turn. By executing `terraform apply` and yeah we’re good to go! Don’t forget to verify the planning output is all we expect, type `yes` and hit **Enter**.

If we see the result looks like below, yeah we did it! We can check it out later by accessing the generated output for Public IP of our instance.

Let’s back to AWS console and take a look there is a running instance which is deployed recently by Terraform.

Here is the expected result. It shows a simple display which is considered as Version 1. And later we want to update the upper version.

As shown below, it shows the changes. This is needed to have another version of the web server display. The current version is Version 1 and I want to make it as Version 2. This is done by only modifying `index.html` and create another name of AMI.

And there you go, just repeat to build, provision and deploy it.

See there is a new AMI has been built.

And let’s jump to execute terraform right away !

Bammm! Our website is updated to Version 2 already.

Just in case you want to follow along, feel free to see my repo : [https://github.com/fauzislami/immutable-infra-using-packer.git](https://github.com/fauzislami/immutable-infra-using-packer.git)

## **Conclusion :**

Immutable Infra and Mutable Infra have their own pros and cons. Moreover, it depends on what type of business we’re running on, financial ability, what culture and values we pursue in our organization. Choose which one is more suitable for our circumstances and preferences. But if we want to make our operations more flexible, reliable, faster and robust, there’s no harm in practicing Immutable Infra paradigm.

Hey folks! Thank you for coming to my blog. I hope you find it useful 🙂

References :

*   [https://itnext.io/immutable-infrastructure-using-packer-ansible-and-terraform-7ca6f79582b8](https://itnext.io/immutable-infrastructure-using-packer-ansible-and-terraform-7ca6f79582b8)
*   [https://martinfowler.com/bliki/ImmutableServer.html](https://martinfowler.com/bliki/ImmutableServer.html)
*   [https://sport-net.org/how-does-a-packer-work](https://sport-net.org/how-does-a-packer-work)
*   [https://eplexity.com/blog/a-side-by-side-comparison-of-immutable-vs-mutable-infrastructure](https://eplexity.com/blog/a-side-by-side-comparison-of-immutable-vs-mutable-infrastructure)
