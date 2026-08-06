---
title: "Automating K8S Cluster Installation with Kubespray"
date: 2021-01-18
type: post
url: "/blog/2021/01/18/automating-k8s-cluster-installation-with-kubespray/"
tags: ["Kubernetes", "Kubespray"]
draft: false
---

![kubespray](/images/automating-k8s-cluster-kubespray/pic-1.png "kubespray")

There are various ways to perform a kubernetes installation. If you look at the environment in which kubernetes will be installed on, you have options that can be done, namely:

**Learning purposes :**

*   _Kind_ tools ( Kubernetes In Docker )
*   _Minikube_

**Production purposes :**

*   Bootstrapping K8S with _kubeadm_
*   Installing K8S with _kubespray_
*   Installing K8S with _kops_

In this opportunity, I will do the installation of a kubernetes cluster using kubespray. Kubespray itself is a way to install Kubernetes cluster by automating it using ansible playbook.

Kubespray can be implemented in a variety of environments. Starting from the baremetal environment, virtualization and cloud. Until now, several supported cloud providers are OpenStack, AWS, Google Cloud, and Azure. Meanwhile, the official documentation for virtualization is VMware VSphere. But at this time, I will do it in a baremetal environment, where I have prepared 3 VMs first, namely for master there are 2 VMs and worker there is only 1 VM. With VM specifications as follows:

*   OS : Centos 7.8
*   CPU : 2vCPU
*   RAM : 8GB
*   Disk : 100GB

List of VMs :

*   Master-1 : 192.168.1.119
*   Master-2 : 192.168.1.120
*   Worker : 192.168.1.122

Of course this is not recommended for a production environment in view of the above specifications and there is also no load balancer that manages the load traffic on the cluster.

Okay, let’s just get into the execution stage! Bismillah

_Requirements:_

*   Internet access
*   The SSH public key from the ansible host is copied to all nodes
*   Tools installed on ansible host:  
    – Ansible v2.9  
    – Jinja 2.11 (or newer)  
    – Git  
    – Python3  
    – Kubectl

**Step 1: SSH Passwordless**

Create an SSH Key

```

root@fauzislami:~# ssh-keygen

Generating public/private rsa key pair.
Enter file in which to save the key (/root/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /root/.ssh/id_rsa
Your public key has been saved in /root/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:DSt3Ryf1tdxAoi7Hl1vSBXYiH+rjM8r3sCxGjsrHbmo root@LAPTOP-AGEMNL1C
The key's randomart image is:
+---[RSA 3072]----+
|            o.O o|
|           . B.B+|
|        . . + oo+|
|         * o = . |
|      . S * B o  |
|       o +.+ =   |
|       . +  *    |
|     .E =.+o.=   |
|     .+*..ooo..  |
+----[SHA256]-----+


root@fauzislami:~# cat .ssh/id_rsa.pub

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC3zM+kq4oo3GyEU363R7y8dbqD0CWsFG3cUmwkzaU3eWNN8FTLu68UZjHCh5D9i/yaS7kcn0UsmRTSL4U5Eb+JZFGfRVgl5CGRv3ljKi80LfS5KZV2pqDPbq49jLHFeq04a3y8FcyQ5crHvfoL00mMmL6mgFVYcM6BdhvHafyfKhZGuNqqa4ImQsWejcn1lyMhy/bbMBDTYwQAdI/9csWkEUO4V7LQukQk+NWszOOS3q38A1mGN7uROjo9/w1lg4ITX03UonzNjv2zOCHozrC4DeGsdw0m8tSNjjtrOIGtQ9sxFkNU0MoQacFR/orF9cWzZonk0IrFtMZoqf+Pan+1xpwzhA+QuRRceYE0VAv62shlI+ni6PR5xFRXWKIJOw6haMga0UfKi3/KLEHRtY3t+Ej73As7HdwjzgLZm6PfkXhmAbIp/dzeXNJxwXlyztjzexOy9dIGYxxEC1LDBkbwW8lE5aMvZjWv7s/ITKbMqgRx7dT6lWZXyRPIJ+mG9LM= root@LAPTOP-AGEMNL1C</pre>

```

Copy the public key from the ansible host to each nodes

*   Master-1

```
###Master-1

root@fauzislami:~# ssh-copy-id root@192.168.1.119

/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_rsa.pub"
The authenticity of host 'master-1 (192.168.1.119)' can't be established.
ECDSA key fingerprint is SHA256:WD3MM3C1C+yfAo55EfJusx0rIcb+Q0BP4h1DutLsUxM.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@master-1's password:

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'root@192.168.1.119'"
and check to make sure that only the key(s) you wanted were added.


```

*   Master-2

```
###Master-2

root@fauzislami:~# ssh-copy-id root@192.168.1.20

/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_rsa.pub"
The authenticity of host 'master-2 (192.168.1.120)' can't be established.
ECDSA key fingerprint is SHA256:Ym2FizkXGlO+ESIPNvEhI0SSaFr/9NuAB05eLr/NAus.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@master-2's password:
bash: warning: setlocale: LC_ALL: cannot change locale (C.UTF-8)
/bin/sh: warning: setlocale: LC_ALL: cannot change locale (C.UTF-8)
sh: warning: setlocale: LC_ALL: cannot change locale (C.UTF-8)

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'root@192.168.1.120'"
and check to make sure that only the key(s) you wanted were added.

```

*   Worker

```
###Worker

root@fauzislami:~# ssh-copy-id root@192.168.1.122

/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/root/.ssh/id_rsa.pub"
The authenticity of host 'worker (192.168.1.122)' can't be established.
ECDSA key fingerprint is SHA256:MGVRcMxTBzixZPMlGk9NPEM0izTxqQtmEHBm3Ksh/hg.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
root@worker's password:
bash: warning: setlocale: LC_ALL: cannot change locale (C.UTF-8)
/bin/sh: warning: setlocale: LC_ALL: cannot change locale (C.UTF-8)
sh: warning: setlocale: LC_ALL: cannot change locale (C.UTF-8)

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'root@192.168.1.122'"
and check to make sure that only the key(s) you wanted were added.

```

Test login to each nodes and make sure you can log in without having to enter a password (passwordless)

```
###Master-1

root@fauzislami:~# ssh root@192.168.1.119
Last login: Thu Jan  7 14:16:14 2021
[root@localhost ~]#

                         ###Master-2

root@fauzislami:~# ssh root@192.168.1.120
Last login: Thu Jan  7 14:16:30 2021
[root@localhost ~]#

                         ###Worker

root@fauzislami:~# ssh root@192.168.1.122
Last login: Thu Jan  7 14:17:05 2021
[root@localhost ~]#
```

**Step 2: Installation requirements**

Do a _git clone_

```
root@fauzislami:~# git clone https://github.com/fauzislami/kubespray-deployment.git
root@fauzislami:~# cd kubespray
root@fauzislami:~/kubespray#
```

> The original Project: [https://github.com/kubernetes-sigs/kubespray.git](https://github.com/kubernetes-sigs/kubespray.git)

If _pip3_ is not available, you can install it using the command below

```
root@fauzislami:~/kubespray# apt install python3-pip -y
```

Requirement installation

```
root@fauzislami:~/kubespray# pip3 install -r requirements.txt
```

Copy and update existing sample inventory

```
root@fauzislami:~/kubespray# cp -rfp inventory/sample inventory/mycluster
```

```
### env var IPS contains IP nodes&lt;br>&lt;br>root@fauzislami:~/kubespray# declare -a IPS=(192.168.1.119 192.168.1.120 192.168.1.122)
```

```
CONFIG_FILE=inventory/mycluster/hosts.yaml python3 contrib/inventory_builder/inventory.py ${IPS[@]}
```

Edit inventory

*   Here I choose CRI for the container runtime (default: docker)

```
root@fauzislami:~/kubespray# vim inventory/mycluster/group_vars/k8s-cluster/k8s-cluster.yml

//
container_manager: crio
//
```

*   I change the prefix of node naming (default: node)

```
root@fauzislami:~/kubespray# vim inventory/mycluster/hosts.yaml

//
all:
  hosts:
    master-1:
      ansible_host: 192.168.1.119
      ip: 192.168.1.119
      access_ip: 192.168.1.119
    master-2:
      ansible_host: 192.168.1.120
      ip: 192.168.1.120
      access_ip: 192.168.1.120
    worker:
      ansible_host: 192.168.1.122
      ip: 192.168.1.122
      access_ip: 192.168.1.122
  children:
    kube-master:
      hosts:
        master-1:
        master-2:
    kube-node:
      hosts:
        master-1:
        master-2:
        worker:
    etcd:
      hosts:
        master-1:
        master-2:
        worker:
    k8s-cluster:
      children:
        kube-master:
        kube-node:
    calico-rr:
      hosts: {}
```

> To reproduce the further things, such as changing the pod prefix, the version of the cluster to be installed, the name of the cluster, etc., I don’t do this in this lab.

**Step 3: Installations**

This step is the final stage for installing kubernetes using kubespray, which is executing the ansible playbook.

```
root@fauzislami:~/kubespray# ansible-playbook -i inventory/mycluster/hosts.yaml --user root cluster.yml

Output: 

PLAY [localhost] *******************************************************************************************************************************************************************************************
Thursday 07 January 2021  15:05:04 +0700 (0:00:00.511)       0:00:00.512 ******

TASK [Check ansible version >=2.8.0] ***********************************************************************************************************************************************************************
ok: [localhost] => {
    "changed": false,
    "msg": "All assertions passed"
}

...........
...........
...........

PLAY RECAP *************************************************************************************************************************************************************************************************
localhost                  : ok=1    changed=0    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0
master-1                   : ok=595  changed=94   unreachable=0    failed=0    skipped=1068 rescued=0    ignored=0
master-2                   : ok=516  changed=84   unreachable=0    failed=0    skipped=918  rescued=0    ignored=0
worker                     : ok=436  changed=66   unreachable=0    failed=0    skipped=607  rescued=0    ignored=0

Thursday 07 January 2021  15:57:37 +0700 (0:00:00.084)       0:23:18.899 ******
===============================================================================
container-engine/cri-o : Install cri-o packages ---------------------------------------------------------------------------------------------------------------------------------------------------- 87.72s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 57.78s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 47.56s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 46.71s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 43.55s
etcd : Gen_certs | Write etcd master certs --------------------------------------------------------------------------------------------------------------------------------------------------------- 39.07s
etcd : Gen_certs | Write etcd master certs --------------------------------------------------------------------------------------------------------------------------------------------------------- 38.68s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 35.67s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 35.35s
kubernetes/master : Joining control plane node to the cluster. ------------------------------------------------------------------------------------------------------------------------------------- 30.43s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 27.58s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 26.47s
download : download_container | Download image if required ----------------------------------------------------------------------------------------------------------------------------------------- 23.80s
kubernetes/master : kubeadm | Initialize first master ---------------------------------------------------------------------------------------------------------------------------------------------- 21.49s
container-engine/crictl : download_file | Download item -------------------------------------------------------------------------------------------------------------------------------------------- 21.42s
Gather necessary facts ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- 19.82s
etcd : Gen_certs | Gather etcd master certs -------------------------------------------------------------------------------------------------------------------------------------------------------- 19.77s
kubernetes/kubeadm : Join to cluster --------------------------------------------------------------------------------------------------------------------------------------------------------------- 19.47s
etcd : Gen_certs | Gather etcd master certs -------------------------------------------------------------------------------------------------------------------------------------------------------- 19.06s
kubernetes-apps/ansible : Kubernetes Apps | Lay Down CoreDNS Template ------------------------------------------------------------------------------------------------------------------------------ 17.82s
```

Based on the output snippet above, the installation process will take about 23 minutes. The installation process will take longer depending on how many nodes will be made into one cluster and of course the internet connection. Here the installed kubernetes is version 1.19.6

Copy the certificate from one master to the host which will be used to manage the cluster. Here I still use ansible host.

```
root@fauzislami:~/kubespray# scp root@master-2:/etc/kubernetes/admin.conf /root/.kube/config
```

Testing

```
root@fauzislami:~# kubectl get nodes
NAME       STATUS   ROLES    AGE    VERSION
master-1   Ready    master   121m   v1.19.6
master-2   Ready    master   120m   v1.19.6
worker     Ready    &lt;none>   119m   v1.19.6

root@fauzislami:~# kubectl get ns
NAME              STATUS   AGE
default           Active   121m
kube-node-lease   Active   121m
kube-public       Active   121m
kube-system       Active   121m
```

Thank you for reading this article and I hope it is useful. See ya!
