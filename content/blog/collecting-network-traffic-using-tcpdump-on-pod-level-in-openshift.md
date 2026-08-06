---
title: "Collecting Network Traffic Using TCPDump on POD Level in Openshift"
date: 2021-07-23
type: post
url: "/blog/2021/07/23/collecting-network-traffic-using-tcpdump-on-pod-level-in-openshift/"
tags: ["ScratchpadOpenshift"]
draft: false
---

Ada kalanya ketika sebuah aplikasi mengalami masalah dan tidak mengeluarkan log pada stdout secara lengkap dan cenderung tidak membantu untuk kebutuhan troubleshooting. Sehingga diperlukan analisa lebih dalam untuk mendapatkan petunjuk dari masalah tersebut, terutama jika masalahnya dalam ruang lingkup network yang perlu dilakukan analisa dari network traffic yang ada. Maka dari itu kita bisa melakukan TCPDump di level POD, namun pada umumnya tidak semua image aplikasi dibekali utilitas untuk melakukan hal itu. Oleh karena itu berikut adalah cara bagaimana melakukan TCPDump pada level POD di Openshift :

1.  Periksa terlebih dahulu di node worker mana POD tersebut running

```
root@bastion ~]# oc get pods -o wide| grep ossn

ossn-server-5-2v7gk                  1/1     Running     0          3d22h   10.131.5.121   worker-08.example.com
ossn-server-5-5jzrt                  1/1     Running     0          2d13h   10.130.4.61    worker-08.example.com
ossn-server-5-pvgcz                  1/1     Running     0          3d21h   10.131.5.122   worker-08.example.com
```

Dapat dilihat bahwa POD dengan nama ossn-server-5-xxxx running di node worker 8

2.  Masuk ke dalam worker tersebut dengan membuat satu instance POD baru yang mewakili environment OS yang ada di worker 8

```
root@bastion ~]# oc debug node/worker-08.example.com

Starting pod/worker-08examplecom-debug ...
To use host binaries, run `chroot /host`
Pod IP: 10.245.15.21
If you don't see a command prompt, try pressing enter.
sh-4.2# 
```

> ℹ️ Jika environment Openshift adalah disconnected gunakan command di bawah ini (menggunakan debug image yang berasal dari registry.redhat.io/rhel7/rhel-tools:latest namun di-push ke dalam registry lokal):

```
root@bastion ~]# oc debug node/worker-08.paas.pajak.go.id --image=registry.paas.pajak.go.id:5000/rhel7/rhel-tools:latest

Starting pod/worker-08examplecom-debug ...
To use host binaries, run `chroot /host`
Pod IP: 10.245.15.21
If you don't see a command prompt, try pressing enter.
sh-4.2# 
```

3.  Identifikasi process ID dari target sandbox

```
sh-4.2# NAME=<pod-name>
sh-4.2# NAMESPACE=<pod-namespace>
sh-4.2# pod_id=$(chroot /host crictl pods --namespace ${NAMESPACE} --name ${NAME} -q)
sh-4.2# pid=$(chroot /host bash -c "runc state $pod_id | jq .pid")
```

4.  Sebelum melakukan tcpdump, kita perlu menentukan interface mana yang akan dijadikan target.

```
sh-4.2# nsenter -n -t $pid -- tcpdump -D
1.eth0
2.nflog (Linux netfilter log (NFLOG) interface)
3.nfqueue (Linux netfilter queue (NFQUEUE) interface)
4.any (Pseudo-device that captures on all interfaces)
5.lo [Loopback]
```

yang dipakai pada kasus ini adalah **eth0**

```
sh-4.2# INTERFACE=eth0
```

5.  Eksekusi tcpdump

```
sh-4.2# nsenter -n -t $pid -- tcpdump -nn -i ${INTERFACE} -w /host/tmp/${HOSTNAME}_$(date +\%d_%m_%Y-%H_%M_%S-%Z).pcap ${TCPDUMP_EXTRA_PARAMS}
tcpdump: listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
```

Lakukan simulasi dimana masalah pada aplikasi tersebut ditemui, pada kasus ini penulis mengalami kendala pada aplikasi yang membutuhkan waktu cukup lama agar bisa login.

6.  Setelah dirasa cukup, maka interrupt proses tcpdump dengan menekan **ctrl+c** dan secara otomatis file hasil tcpdump dengan format **pcap** berhasil didapatkan.
    
7.  Copy file **pcap** tersebut ke dalam host, namun sebelum itu kita perlu tahu terlebih dahulu nama POD yang digunakan debugging pada node tersebut apa, berikut adalah caranya :
    

```
[root@bastion ~]# oc get pods -A | grep worker
apim                                                    backend-worker-2-zcmpv                                            1/       66d
apim2                                                   backend-worker-2-nbs9g                                            1/       66d
djpconnect                                              <strong>worker-08examplecom-debug</strong>                                      1/       7m32s
```

POD tersebut bernama **worker-08examplecom-debug** dan berada pada namespace/project bernama **djpconnect**. Maka lakukan copy file dari dalam POD ke Host di session terpisah (agar POD Debugger tidak mati) :

```
[root@bastion ~]# oc cp worker-08examplecom-debug:/host/tmp/worker-08.example.com_23_07_2021-04_48_39-UTC.pcap worker-08.example.com_23_07_2021-04_48_39-UTC.pcap
tar: Removing leading `/' from member names

[root@bastion ~]# ls | grep worker
worker-08.example.com_23_07_2021-04_48_39-UTC.pcap
```

Selanjutnya kita tinggal baca file **pcap** tersebut menggunakan tools network analyzer pilihan kita, yang sudah umum kita bisa gunakan WireShark.

Sekian sedikit dokumentasi yang pernah penulis alami. Semoga bermanfaat!

Ref : [https://access.redhat.com/solutions/4569211](https://access.redhat.com/solutions/4569211)
