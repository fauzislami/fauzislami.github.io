---
title: "Distribute Pods Across Nodes With topologySpreadConstraints"
date: 2022-11-01
type: post
url: "/blog/pod-topology-spread-constraints/"
tags: ["Kubernetes"]
draft: false
---

![main picture](/images/podTopologySpreadConstraints/main.png "main picture")

# Intro

I had several works related to evenly spreading out pods across nodes in order to prevent potentially Kubernetes schedule the replicas of pods on the same node which will lead to a problem if that particular node falls over. I comprehended the case because there are some ways to schedule pods and the solution must be suitable to the environment in my case. As we might already know, Kubernetes has its own built-in mechanism to schedule a pod into a node named **scheduler**. But Kubernetes gives us flexibility on how and where a pod is scheduled on which node, it depends on our needs. Let’s take an example such as **taints & tolerations**, **nodeSelector**, and even a more advanced way like **podAntiAffinity**. Basically, it allows us to dictate the scheduler on where pods should be put on.

Long story short, I was thinking adding podAntiAffinity would solve the problem but it didn’t work as I thought. In my case, podAntiAffinity will cause a pending status for some particular pods when the replica of pods exceeds the number of nodes. After having a discussion with one of my colleagues, I got informed that there’s a must-try solution as it should fit my case, it’s **topologySpreadConstraints**. I just knew that feature and found it interesting after reading its documentation. Finally, **topologySpreadConstraints** was the most appropriate workaround.

# What is topologySpreadConstraints?

This is one of many features that Kubernetes provides starting from v1.19 (if I’m not mistaken). podTopologySpreadConstraints is like a pod anti-affinity but in a more advanced way, I think. It relies on failure-domain like regions, zones, nodes, and any other custom-defined topology domains which need to be defined as node labels. That mechanism aims to spread pods evenly onto multiple node topologies. We can imagine that we have a cluster with dozens of nodes and we want the workload of each node automatically scales. There could be a possibility those workloads are unevenly distributed across nodes. Suppose there are only as few as 3 pods or as many as 10 pods, we’d prefer not to have those pods run on the same node, right? otherwise, it would run the risk if the involved nodes fall over and take the workload offline.

# Question: Why is podTopologyConstraints preferred over podAntiAffinity?

I think the question above is biased against my case 🤣. Let me clarify that it’s not always true if podTopologyConstraints fits every case. Probably, the explanation below will lead us to understand more. Here I’m using GKE.

1.  **Using podAntiAffinity**

![1](/images/podTopologySpreadConstraints/1.png "1")

The number of nodes is 3 in the first place and it was increased to 6 nodes as I increased the replica of pods from 3 to 6. **It happened because the cluster autoscaler was active** and its number would keep increasing to accommodate the workload which is scheduling the pod with a certain label onto the new node rather than doing it onto existing nodes. Meanwhile, suppose we don’t use autoscaler, the common behavior is there will be a pending pod waiting for the node which is not running a pod with the same label. Nevertheless, we’re using autoscaler and that won’t be a problem for us but we absolutely don’t want to be charged for more cost for letting the cluster unnecessarily scales out for only accommodating one pod. Therefore, we better not use podAntiAffinity 😄

2.  **Using topologySpreadConstraints**

![2](/images/podTopologySpreadConstraints/2.png "2")

After scaling out the pods to be 6 replicas, the number of nodes remained at 3. With this, the pods would be evenly distributed across nodes but won’t cause the pods to be pending due to unmatched criteria with the nodes.

In addition, I have also had experiments in my local machine related to topologySpreadConstraints. I had a cluster with 4 nodes and tried to deploy simple nginx pods with various amounts of replicas as follows:

*   **4 replicas**

![3](/images/podTopologySpreadConstraints/3.png "3")

*   **8 replicas**

![4](/images/podTopologySpreadConstraints/4.png "4")

*   **12 replicas**

![5](/images/podTopologySpreadConstraints/5.png "5")

it also still spreads out across nodes (almost) evenly in non-multiple of 4 replicas (since I have 4 nodes) like the picture below:

*   **10 replicas**

![6](/images/podTopologySpreadConstraints/6.png "6")

*   **9 replicas**

![7](/images/podTopologySpreadConstraints/7.png "7")

*   **5 replicas**

![8](/images/podTopologySpreadConstraints/8.png "8")

As we may see all of the pods deployment above, it’s evenly spread out across nodes in the multiple of 4 replicas (since I have 4 nodes) and it’s (almost) evenly spread out across nodes if the replica is in a non-multiple of 4. To guarantee high availability and scheduling flexibility of the services, I have set the maxSkew to 1 and whenUnsatisfiable to ScheduleAnyway, this combination ensures that the scheduler gives higher precedence to topologies that help to reduce the skew but will not lead to pods in a pending state that cannot satisfy the pods topology spread constraints due to the maxSkew setting.

Let’s have a look how topologySpreadConstraints sits at the following deployment which I used in my case:

```

apiVersion: apps/v1
kind: Deployment
metadata:
  ...
spec:
  ...
  template:
  ...
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: my-app
      containers:
      ...

```

For those who are interested to learn further, this document might be useful to get the full context : [https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)
