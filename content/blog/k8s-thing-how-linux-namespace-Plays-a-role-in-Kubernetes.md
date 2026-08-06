---
title: "K8S-thing: How Linux Namespace Plays a Role in Kubernetes"
date: 2023-02-27
type: post
url: "/blog/k8s-thing-how-linux-namespace-Plays-a-role-in-Kubernetes/"
tags: ["Kubernetes", "K8S-thing"]
draft: false
---

# Linux Network Namespace

Before we look into how Linux Network Namespace works in Kubernetes Pod, we need to know from the basic what it is and what the purpose of it. Network namespace in linux provides an isolated system resources associated with networking-related stuff within a single host such as IP (Internet Protocol) either it is IPv4 or IPv6, NAT rules, firewall rules, and routing table.

![main picture](/images/k8s-thing-how-namespace-work-in-pod/host.png "main picture")

Let’s imagine you are a parent who have children and live in a house. Take the computer host as a house and namespaces are rooms within that house. You assign those rooms to each of your children. They have their own privacy, so each child can only see what’s within his or her room and they can’t see what happens outside their room. However, as a parent you have a visibility to all rooms in the house. If you wish, you can visit each room.

# How Linux Namespace Plays a Role in Kubernetes

Hopefully, the previous explanation is good enough for us to understand what Namespace does in Operating System level. Now we’re gonna be paying more attention on how Namespace plays an essential role in Kubernetes. Basically, containers we deploy to Kubernetes are making use of Namespace ability to separate process/make logical space and network from the underlying host. I would say Kubernetes consists of a bunch of namespaces within containers it orchestrates over time. Therefore, from now we may understand that the “container” term we usually hear nowadays isn’t a standalone entity that making up (potentially) multiple processes into a single separated process within a host, yet it utilizes Namespace to do that isolation and package it up to a blueprint (a.k.a container images). Afterward, we may use it anywhere as long as there is container runtime, it could be docker, containerd, cri-o, and so on. Up to this point, we may think of the network namespace is like taking the physical network interface and then slicing it into smaller independent parts.

Here I put a Pod manifest that contains multiple containers as an example:

```
apiVersion: v1
kind: Pod
metadata:
  name: multi-containers-pod
spec:
  containers:
    - name: container-1
      image: busybox
      command: ['/bin/sh', '-c', 'sleep 1d']
    - name: container-2
      image: nginx
```

_What will happen when it gets deployed?_

The following things happen:

*   The pod gains its own network namespace on the node
*   The pod will then be assigned with an IP Address. The IP Address will be shared between those two containers except the port where each container is running on.
*   Since both containers are sharing the same networking namespace, they can communicate with each other as they live in the same Pod (localhost-alike concept)

All packets will be sent to the physical interface in the end, as such, it’s also responsible to create a virtual interface that will be used by all namespaces to talk to.

Let’s have a look to the following illustration:

1.  ![1](/images/k8s-thing-how-namespace-work-in-pod/1.png "1")

See that the physical network interface has the root Network Namespace

2.  ![2](/images/k8s-thing-how-namespace-work-in-pod/2.png "2")

It depicts the Network Namespaces can create isolated networks. Each of them is independent and not able to communicate with each other unless we desire to.

3.  ![3](/images/k8s-thing-how-namespace-work-in-pod/3.png "3")

When we create a Pod, the container runtime will create a Network Namespace for containers to use.

4.  ![4](/images/k8s-thing-how-namespace-work-in-pod/4.png "4")

After that, The [CNI](https://github.com/containernetworking/cni) assigns the Pod an IP Address

5.  ![5](/images/k8s-thing-how-namespace-work-in-pod/5.png "5") As the final step, CNI will immediately attach that container to the whole network by establishing a connection to root Network Namespace through Virtual Interface

Probably, you’re still wondering what happens with the node that running namespace and container. I’ll try to provide you some information regarding that.

First thing first, we need to come inside the container by using SSH. But in my case, I’ll use `docker exec` since I’m running local kubernetes inside Docker container (see: [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/))

*   We can look at some Network Namespaces as listed below:

```
root@k8s-playground-worker:/# ip netns list

cni-d5d2156f-e4aa-9e5c-c8c3-d930d8892f2b (id: 1)
```

Those list of Network Namespaces can be managed by `ip netns` utility. From the above output, I did list them to assure that Pod manifest I applied on the prior step was created Namespace in the Operating System level.

{{< notice "note" >}}

Notice that `cni-` prefix, that means the Namespace creation has been initiated of by CNI. If a pod contains multiple containers, they will reside in the same namespace.

{{< /notice >}}

*   IP Assignment to each Namespaces

We have seen that each Pod have been assigned an IP Address by the CNI. Here is what we see in Kubernetes User’s perspective:

```
➜  test-nginx k get pods -o wide
#truncated output

 multi-containers-pod  2/2     Running   0          55m   10.244.1.5   k8s-playground-worker   <none>           <none>

```

IP Address `10.244.1.5` represents the Network Namespace IP Address running on the worker node. Let’s prove it!

```
root@k8s-playground-worker:/# ip netns exec cni-1ddde74d-9d1d-ef8c-aaab-919e9237ffcb ip address
#truncated output

2: eth0@if6: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default 
    link/ether 6e:87:6f:bb:91:c8 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.244.1.5/24 brd 10.244.1.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::6c87:6fff:febb:91c8/64 scope link 
       valid_lft forever preferred_lft forever
```

Focus on `eth0@if6`, that’s actually a virtual interface for the Pod to be used for establishing network connection to the root Network Namespace. What we just saw here is the underlying stuff of Pod’s IP Address that appears when we make an API call against Kubernetes for listing Pods in details. It does verify that the Network Namespace plays an important role in Kubernetes. Hence, we won’t think of the container as the only underlying and standalone entity under Kubernetes. Keep in mind that container is the implementation of Network Namespace and not the other way around.
